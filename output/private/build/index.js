"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeError = normalizeError;
const block_basekit_server_api_1 = require("@lark-opdev/block-basekit-server-api");
const cheerio = __importStar(require("cheerio"));
const turndown_1 = __importDefault(require("turndown"));
const { t } = block_basekit_server_api_1.field;
// ============ 域名白名单配置 ============
// 必须配置，否则请求会被拒绝
const domainList = [
    'mp.weixin.qq.com', // 微信公众号文章
    'mmbiz.qpic.cn', // 微信图片 CDN
    'r.jina.ai', // Jina Reader API
    'images.weserv.nl', // 图片代理服务（解决微信防盗链）
];
block_basekit_server_api_1.basekit.addDomainList(domainList);
// ============ 常量配置 ============
const JINA_RATE_LIMIT_STATUS = 429;
const MAX_RETRY_COUNT = 3;
const RETRY_DELAY_MS = 2000;
function isWeChatUrl(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname === 'mp.weixin.qq.com';
    }
    catch {
        return false;
    }
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function normalizeError(error) {
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
    }
    catch {
        return {
            name: 'Error',
            message: String(error),
        };
    }
}
async function parseWeChatArticle(url, context) {
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
    const turndownService = new turndown_1.default({
        headingStyle: 'atx',
        codeBlockStyle: 'fenced',
        bulletListMarker: '-',
        strongDelimiter: '**',
        emDelimiter: '*',
    });
    turndownService.addRule('preserveImages', {
        filter: 'img',
        replacement: (content, node) => {
            let src = node.getAttribute?.('src') || node.getAttribute?.('data-src') || '';
            const alt = node.getAttribute?.('alt') || '';
            if (!src)
                return '';
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
async function fetchWithJina(url, apiKey, context) {
    const { fetch, logID } = context;
    const jinaUrl = 'https://r.jina.ai/';
    const headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
    if (apiKey && apiKey.trim()) {
        headers['Authorization'] = `Bearer ${apiKey.trim()}`;
        console.log(logID, '[Jina] 使用 API Key 认证');
    }
    else {
        console.log(logID, '[Jina] 未提供 API Key，使用免费额度');
    }
    let lastError = null;
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
            const result = await response.json();
            if (result.code !== 200 || !result.data) {
                console.log(logID, '[Jina] API 返回错误:', result.status);
                throw new Error(`Jina API 返回错误: ${result.status || '未知错误'}`);
            }
            const title = result.data.title || '无标题';
            const content = result.data.content || '';
            console.log(logID, '[Jina] 解析成功, 标题:', title.substring(0, 30));
            return { title, content };
        }
        catch (error) {
            if (error.message?.includes('请求超限') && attempt < MAX_RETRY_COUNT - 1) {
                continue;
            }
            throw error;
        }
    }
    throw lastError || new Error('Jina API 请求失败');
}
block_basekit_server_api_1.basekit.addField({
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
            component: block_basekit_server_api_1.FieldComponent.FieldSelect,
            props: {
                placeholder: t('urlPlaceholder'),
                // 支持文本字段和超链接字段
                // 注意：FieldSelect 只支持 文本、单选、多选、日期、附件、数字、复选框、超链接
                supportType: [block_basekit_server_api_1.FieldType.Text, block_basekit_server_api_1.FieldType.Url],
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
            component: block_basekit_server_api_1.FieldComponent.Input,
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
        type: block_basekit_server_api_1.FieldType.Text,
    },
    // ============ 执行函数 ============
    execute: async (formItemParams, context) => {
        const { logID } = context;
        console.log(logID, '========== URL to Markdown 开始执行 ==========');
        try {
            const { url: urlField, jinaApiKey } = formItemParams;
            console.log(logID, '[Debug] 原始输入:', JSON.stringify(urlField));
            // 解析输入字段（支持多种字段类型）
            // - 文本字段: [{ type: 'text', text: '内容' }]
            // - URL 字段: { link: 'url', text: '显示文本' } 或 [{ link: 'url', text: '显示文本' }]
            // - 公式字段: 可能返回字符串或数组
            let url = '';
            if (typeof urlField === 'string') {
                // 直接是字符串
                url = urlField.trim();
            }
            else if (Array.isArray(urlField) && urlField.length > 0) {
                // 数组格式（文本字段或 URL 字段数组）
                const firstItem = urlField[0];
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
                        const secondItem = urlField[1];
                        if (typeof secondItem?.text === 'string') {
                            url = secondItem.text.trim();
                        }
                        else if (typeof secondItem?.link === 'string') {
                            url = secondItem.link.trim();
                        }
                    }
                }
            }
            else if (urlField && typeof urlField === 'object') {
                // 对象格式（URL 字段）
                const urlObj = urlField;
                if (typeof urlObj.link === 'string') {
                    url = urlObj.link.trim();
                }
                else if (typeof urlObj.text === 'string') {
                    url = urlObj.text.trim();
                }
            }
            console.log(logID, '[Debug] 解析后的 URL:', url);
            // 验证输入
            if (!url) {
                console.log(logID, '[Error] 输入为空');
                return {
                    code: block_basekit_server_api_1.FieldCode.ConfigError,
                    msg: 'URL 为空',
                    data: '请输入有效的网页链接',
                };
            }
            // 验证 URL 格式
            try {
                new URL(url);
            }
            catch {
                console.log(logID, '[Error] URL 格式无效:', url);
                return {
                    code: block_basekit_server_api_1.FieldCode.InvalidArgument,
                    msg: 'URL 格式无效',
                    data: '链接格式无效，请输入完整的 URL（包含 http:// 或 https://）',
                };
            }
            const isWeChat = isWeChatUrl(url);
            console.log(logID, '[Info] 处理 URL:', url.substring(0, 50), '| 类型:', isWeChat ? '微信' : '普通网页');
            let result;
            if (isWeChat) {
                result = await parseWeChatArticle(url, context);
            }
            else {
                result = await fetchWithJina(url, jinaApiKey, context);
            }
            const markdown = `# ${result.title}\n\n${result.content}`;
            console.log(logID, '[Success] 转换完成, 标题长度:', result.title.length, '内容长度:', result.content.length);
            return {
                code: block_basekit_server_api_1.FieldCode.Success,
                data: markdown,
            };
        }
        catch (error) {
            const normalizedError = normalizeError(error);
            console.log(logID, '[Error] 执行失败:', normalizedError.message);
            // 根据错误类型返回对应的错误码
            const errorMsg = normalizedError.message || '未知错误';
            if (errorMsg.includes('请求超限') || errorMsg.includes('429')) {
                return {
                    code: block_basekit_server_api_1.FieldCode.RateLimit,
                    msg: errorMsg,
                    data: `转换失败: ${errorMsg}`,
                };
            }
            return {
                code: block_basekit_server_api_1.FieldCode.Error,
                msg: errorMsg,
                data: `转换失败: ${errorMsg}`,
            };
        }
    },
});
exports.default = block_basekit_server_api_1.basekit;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUE4Q0Esd0NBMkJDO0FBekVELG1GQUE0RztBQUM1RyxpREFBbUM7QUFDbkMsd0RBQXVDO0FBRXZDLE1BQU0sRUFBRSxDQUFDLEVBQUUsR0FBRyxnQ0FBSyxDQUFDO0FBRXBCLG9DQUFvQztBQUNwQyxnQkFBZ0I7QUFDaEIsTUFBTSxVQUFVLEdBQUc7SUFDakIsa0JBQWtCLEVBQUksVUFBVTtJQUNoQyxlQUFlLEVBQU8sV0FBVztJQUNqQyxXQUFXLEVBQVcsa0JBQWtCO0lBQ3hDLGtCQUFrQixFQUFJLGtCQUFrQjtDQUN6QyxDQUFDO0FBRUYsa0NBQU8sQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7QUFFbEMsaUNBQWlDO0FBQ2pDLE1BQU0sc0JBQXNCLEdBQUcsR0FBRyxDQUFDO0FBQ25DLE1BQU0sZUFBZSxHQUFHLENBQUMsQ0FBQztBQUMxQixNQUFNLGNBQWMsR0FBRyxJQUFJLENBQUM7QUFhNUIsU0FBUyxXQUFXLENBQUMsR0FBVztJQUM5QixJQUFJLENBQUM7UUFDSCxNQUFNLE1BQU0sR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUM1QixPQUFPLE1BQU0sQ0FBQyxRQUFRLEtBQUssa0JBQWtCLENBQUM7SUFDaEQsQ0FBQztJQUFDLE1BQU0sQ0FBQztRQUNQLE9BQU8sS0FBSyxDQUFDO0lBQ2YsQ0FBQztBQUNILENBQUM7QUFFRCxTQUFTLEtBQUssQ0FBQyxFQUFVO0lBQ3ZCLE9BQU8sSUFBSSxPQUFPLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxVQUFVLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDekQsQ0FBQztBQUVELFNBQWdCLGNBQWMsQ0FBQyxLQUFjO0lBQzNDLElBQUksS0FB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