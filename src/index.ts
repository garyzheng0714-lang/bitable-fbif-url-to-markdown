import { basekit, FieldType, field, FieldComponent, FieldCode } from '@lark-opdev/block-basekit-server-api';
import * as cheerio from 'cheerio';
import TurndownService from 'turndown';

const { t } = field;

// ============ 域名白名单配置 ============
// 必须配置，否则请求会被拒绝
const domainList = [
  'mp.weixin.qq.com',   // 微信公众号文章
  'mmbiz.qpic.cn',      // 微信图片 CDN
  'r.jina.ai',          // Jina Reader API
  'images.weserv.nl',   // 图片代理服务（解决微信防盗链）
];

basekit.addDomainList(domainList);

// ============ 常量配置 ============
const JINA_RATE_LIMIT_STATUS = 429;
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 2000;

// ============ 类型定义 ============
interface ExecuteContext {
  fetch: (url: string, options?: RequestInit) => Promise<Response>;
  logID: string;
  baseID: string;
  tableID: string;
  packID: string;
  tenantKey: string;
  timeZone: string;
}

function isWeChatUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname === 'mp.weixin.qq.com';
  } catch {
    return false;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function normalizeError(error: unknown): { name: string; message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message || String(error),
      stack: error.stack,
    };
  }

  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
    };
  }

  try {
    return {
      name: 'Error',
      message: JSON.stringify(error),
    };
  } catch {
    return {
      name: 'Error',
      message: String(error),
    };
  }
}

async function parseWeChatArticle(
  url: string, 
  context: ExecuteContext
): Promise<{ title: string; content: string }> {
  const { fetch, logID } = context;
  
  console.log(logID, '[WeChat] 开始获取文章:', url);
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
  });

  if (!response.ok) {
    console.log(logID, '[WeChat] 请求失败:', response.status);
    throw new Error(`获取微信文章失败: HTTP ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const title = $('#activity-name').text().trim() || $('title').text().trim() || '无标题';

  $('script, style, noscript, iframe, .qr_code_pc, .rich_media_area_extra, #js_pc_qr_code, #js_profile_qrcode').remove();

  const $content = $('#js_content');
  if ($content.length === 0) {
    throw new Error('未找到微信文章内容区域 (#js_content)');
  }

  $content.find('img').each((_, img) => {
    const $img = $(img);
    const dataSrc = $img.attr('data-src');
    if (dataSrc && !$img.attr('src')) {
      $img.attr('src', dataSrc);
    }
  });

  $content.find('section[data-role="paragraph"]').each((_, section) => {
    const $section = $(section);
    if ($section.children().length === 0 && $section.text().trim() === '') {
      $section.remove();
    }
  });

  const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    bulletListMarker: '-',
    strongDelimiter: '**',
    emDelimiter: '*',
  });

  turndownService.addRule('preserveImages', {
    filter: 'img',
    replacement: (content, node: any) => {
      let src = node.getAttribute?.('src') || node.getAttribute?.('data-src') || '';
      const alt = node.getAttribute?.('alt') || '';
      if (!src) return '';
      
      // 使用图片代理服务解决微信防盗链问题
      // images.weserv.nl 是免费的图片代理服务
      if (src.includes('mmbiz.qpic.cn') || src.includes('mmbiz.qlogo.cn')) {
        // 对 URL 进行编码，确保特殊字符被正确处理
        src = `https://images.weserv.nl/?url=${encodeURIComponent(src)}`;
      }
      
      return `![${alt}](${src})`;
    },
  });

  turndownService.addRule('removeEmptyParagraphs', {
    filter: (node) => {
      return node.nodeName === 'P' && node.textContent?.trim() === '' && !node.querySelector('img');
    },
    replacement: () => '',
  });

  const contentHtml = $content.html() || '';
  let markdown = turndownService.turndown(contentHtml);

  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+|\s+$/g, '');

  console.log(logID, '[WeChat] 解析完成, 标题:', title.substring(0, 30));
  
  return { title, content: markdown };
}

async function fetchWithJina(
  url: string, 
  apiKey: string | undefined, 
  context: ExecuteContext
): Promise<{ title: string; content: string }> {
  const { fetch, logID } = context;
  const jinaUrl = 'https://r.jina.ai/';
  
  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  if (apiKey && apiKey.trim()) {
    headers['Authorization'] = `Bearer ${apiKey.trim()}`;
    console.log(logID, '[Jina] 使用 API Key 认证');
  } else {
    console.log(logID, '[Jina] 未提供 API Key，使用免费额度');
  }

  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < MAX_RETRY_COUNT; attempt++) {
    console.log(logID, '[Jina] 请求尝试:', attempt + 1, '/', MAX_RETRY_COUNT);
    
    try {
      const response = await fetch(jinaUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ url }),
      });

      if (response.status === JINA_RATE_LIMIT_STATUS) {
        console.log(logID, '[Jina] 遇到限流 (429)，等待重试...');
        lastError = new Error(`Jina API 请求超限 (429)，第 ${attempt + 1} 次重试...`);
        if (attempt < MAX_RETRY_COUNT - 1) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
          continue;
        }
        throw new Error('Jina API 请求超限，已达最大重试次数。建议配置 API Key 提高限额');
      }

      if (!response.ok) {
        console.log(logID, '[Jina] 请求失败:', response.status);
        throw new Error(`Jina API 请求失败: HTTP ${response.status}`);
      }

      const result = await response.json() as {
        code: number;
        status?: string;
        data?: { title?: string; content?: string };
      };
      
      if (result.code !== 200 || !result.data) {
        console.log(logID, '[Jina] API 返回错误:', result.status);
        throw new Error(`Jina API 返回错误: ${result.status || '未知错误'}`);
      }

      const title = result.data.title || '无标题';
      const content = result.data.content || '';

      console.log(logID, '[Jina] 解析成功, 标题:', title.substring(0, 30));
      
      return { title, content };
    } catch (error: any) {
      if (error.message?.includes('请求超限') && attempt < MAX_RETRY_COUNT - 1) {
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('Jina API 请求失败');
}

basekit.addField({
  // ============ 国际化配置 ============
  // 支持 zh-CN、en-US、ja-JP 三种语言
  i18n: {
    messages: {
      'zh-CN': {
        'url': '文章链接',
        'urlPlaceholder': '请输入网页链接（支持微信公众号文章和普通网页）',
        'urlTooltip': '微信公众号文章将使用专用解析器，其他网页使用 Jina Reader API。',
        'tutorialLink': '使用教程',
        'jinaApiKey': 'Jina API Key',
        'jinaApiKeyPlaceholder': '可选，填写后可提高请求限额',
        'jinaApiKeyTooltip': '免费获取: https://jina.ai/?sui=apikey',
      },
      'en-US': {
        'url': 'Article URL',
        'urlPlaceholder': 'Enter webpage URL (supports WeChat articles and regular webpages)',
        'urlTooltip': 'WeChat articles use dedicated parser, other webpages use Jina Reader API.',
        'tutorialLink': 'Tutorial',
        'jinaApiKey': 'Jina API Key',
        'jinaApiKeyPlaceholder': 'Optional, increases request quota',
        'jinaApiKeyTooltip': 'Get free key: https://jina.ai/?sui=apikey',
      },
      'ja-JP': {
        'url': '記事リンク',
        'urlPlaceholder': 'ウェブページのURLを入力（WeChat記事と一般的なウェブページに対応）',
        'urlTooltip': 'WeChat記事は専用パーサーを使用、その他はJina Reader APIを使用。',
        'tutorialLink': 'チュートリアル',
        'jinaApiKey': 'Jina API Key',
        'jinaApiKeyPlaceholder': 'オプション、入力するとリクエスト制限が増加',
        'jinaApiKeyTooltip': '無料で取得: https://jina.ai/?sui=apikey',
      },
    }
  },

  formItems: [
    {
      key: 'url',
      label: t('url'),
      component: FieldComponent.FieldSelect,
      props: {
        placeholder: t('urlPlaceholder'),
        // 支持文本字段和超链接字段
        // 注意：FieldSelect 只支持 文本、单选、多选、日期、附件、数字、复选框、超链接
        supportType: [FieldType.Text, FieldType.Url],
      },
      tooltips: [
        {
          type: 'text',
          content: t('urlTooltip'),
        },
        {
          type: 'link',
          text: t('tutorialLink'),
          link: 'https://foodtalks.feishu.cn/docx/CjhZdWkRJoYUawxxbfxc1vbOnAg',
        },
      ],
      validator: {
        required: true,
      },
    },
    {
      key: 'jinaApiKey',
      label: t('jinaApiKey'),
      component: FieldComponent.Input,
      props: {
        placeholder: t('jinaApiKeyPlaceholder'),
      },
      tooltips: [
        {
          type: 'text',
          content: t('jinaApiKeyTooltip'),
        },
      ],
    },
  ],

  resultType: {
    type: FieldType.Text,
  },

  // ============ 执行函数 ============
  execute: async (
    formItemParams: {
      url: unknown;  // 支持多种字段类型，使用 unknown
      jinaApiKey?: string;
    }, 
    context: ExecuteContext
  ) => {
    const { logID } = context;
    
    console.log(logID, '========== URL to Markdown 开始执行 ==========');

    try {
      const { url: urlField, jinaApiKey } = formItemParams;
      
      console.log(logID, '[Debug] 原始输入:', JSON.stringify(urlField));
      
      // 解析输入字段（支持多种字段类型）
      // - 文本字段: [{ type: 'text', text: '内容' }]
      // - URL 字段: { link: 'url', text: '显示文本' } 或 [{ link: 'url', text: '显示文本' }]
      // - 公式字段: 可能返回字符串或数组
      let url: string = '';
      
      if (typeof urlField === 'string') {
        // 直接是字符串
        url = urlField.trim();
      } else if (Array.isArray(urlField) && urlField.length > 0) {
        // 数组格式（文本字段或 URL 字段数组）
        const firstItem = urlField[0] as Record<string, unknown>;
        if (firstItem) {
          // 尝试从 link 字段获取（URL 字段格式）
          if (typeof firstItem.link === 'string') {
            url = firstItem.link.trim();
          }
          // 尝试从 text 字段获取（文本字段格式）
          else if (typeof firstItem.text === 'string') {
            url = firstItem.text.trim();
          }
          // 尝试数组中的第二个元素（有些格式第一个是类型标识）
          else if (urlField.length > 1) {
            const secondItem = urlField[1] as Record<string, unknown>;
            if (typeof secondItem?.text === 'string') {
              url = secondItem.text.trim();
            } else if (typeof secondItem?.link === 'string') {
              url = secondItem.link.trim();
            }
          }
        }
      } else if (urlField && typeof urlField === 'object') {
        // 对象格式（URL 字段）
        const urlObj = urlField as Record<string, unknown>;
        if (typeof urlObj.link === 'string') {
          url = urlObj.link.trim();
        } else if (typeof urlObj.text === 'string') {
          url = urlObj.text.trim();
        }
      }
      
      console.log(logID, '[Debug] 解析后的 URL:', url);

      // 验证输入
      if (!url) {
        console.log(logID, '[Error] 输入为空');
        return {
          code: FieldCode.ConfigError,
          msg: 'URL 为空',
          data: '请输入有效的网页链接',
        };
      }

      // 验证 URL 格式
      try {
        new URL(url);
      } catch {
        console.log(logID, '[Error] URL 格式无效:', url);
        return {
          code: FieldCode.InvalidArgument,
          msg: 'URL 格式无效',
          data: '链接格式无效，请输入完整的 URL（包含 http:// 或 https://）',
        };
      }

      const isWeChat = isWeChatUrl(url);
      console.log(logID, '[Info] 处理 URL:', url.substring(0, 50), '| 类型:', isWeChat ? '微信' : '普通网页');

      let result: { title: string; content: string };

      if (isWeChat) {
        result = await parseWeChatArticle(url, context);
      } else {
        result = await fetchWithJina(url, jinaApiKey, context);
      }

      const markdown = `# ${result.title}\n\n${result.content}`;

      console.log(logID, '[Success] 转换完成, 标题长度:', result.title.length, '内容长度:', result.content.length);

      return {
        code: FieldCode.Success,
        data: markdown,
      };
    } catch (error: unknown) {
      const normalizedError = normalizeError(error);
      console.log(logID, '[Error] 执行失败:', normalizedError.message);
      
      // 根据错误类型返回对应的错误码
      const errorMsg = normalizedError.message || '未知错误';
      
      if (errorMsg.includes('请求超限') || errorMsg.includes('429')) {
        return {
          code: FieldCode.RateLimit,
          msg: errorMsg,
          data: `转换失败: ${errorMsg}`,
        };
      }
      
      return {
        code: FieldCode.Error,
        msg: errorMsg,
        data: `转换失败: ${errorMsg}`,
      };
    }
  },
});

export default basekit;
