# 字段捷径介绍

「字段捷径」是多维表格字段级开放能力，支持开发者将 AI 能力、垂直场景应用融入用户的业务系统，降低用户使用门槛，提升渗透率和效率。

字段是多维表格作为数据库产品最基础的能力，覆盖的用户非常广。用户使用字段捷径，一次添加，自动运行，无需额外配置自动化工作流，简单方便。

字段捷径有两种实现方式：

* 公式版：将一个多维表格公式封装成字段捷径，使用公式实现功能
* FaaS 版：支持编写代码、调用第三方 API，可灵活实现自定义功能

所有的字段捷径执行机制：

对开发者而言，捷径本质是一个nodejs函数，部署在feishu这边的服务器中。它可以将一行记录的所有字段的值作为输入，然后开发者根据函数输入，返回一些值，最终多维表格将返回的值以对应的格式渲染于表格上。

在处理大量任务的时候，会同时处理2-4条记录（即同时存在2-4个函数运行时），其余的进入排队状态，队列最长1w。

此队列包含：当前表所有捷径的所有任务，最长排队1h，超时将取消排队，并不显示任何错误。超出队列长度的任务，无法进入排队，会提示限流错误。

其中每一条记录的生成（函数执行）都是独立的，这个函数仅可获取一行记录的数据，不感知其他的记录。

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=OGI1ZTBmYWQ5MTJkZGFlMGE2ZjRkMWI1MTcxM2JmYTFfMmZZQXFxdGkwWHEwYnh4Y0hzNjBjVnZEZFg5Y0E0YkNfVG9rZW46RDc1d2JvY1k1b3lVTjB4T25OOGNsU3hzblBnXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=M2FiYWIyZDE1N2Y3NGRiM2EzNDJmZWFlMjNlYjMwMWRfMDVlT0lnY1NSTUZNWFJpQ0hhR2R6TU1qOU5FR0lCRlNfVG9rZW46TFZPVGI1N0lGbzg5cmh4TFpKZWM0bk5OblFiXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

**暂时无法在飞书文档外展示此内容**

[https://feishu.feishu.cn/sync/Tb4Yd6CnoseisMbd4facsSEVnQe](https://feishu.feishu.cn/sync/Tb4Yd6CnoseisMbd4facsSEVnQe)

# 开发步骤

## 运行环境（开发必看）

如果项目重度依赖nodejs或者资源消耗巨大，可以选择将复杂逻辑部分部署到你的服务器A，然后仅在字段捷径中放调用服务A的代码。

或者在开发阶段，就使用与线上相同的环境配置，这是线上的运行环境：

Nodejs版本：14.21.0

服务隔离：按插件+租户维度隔离，支持动态伸缩容，最大40个实例

单实例规格配置：1核1G内存

**运行超时时间：15 分钟****，且无法调整。**

**捷径部署在feishu服务器上。不支持访问公司内网**

**一些限制**

1. 单个表，单个捷径字段1分钟最多生成90条记录，如果捷径执行的时间更长，则1分钟生成的记录更少。
2. 捷径部署在feishu服务器上。不支持访问公司内网
3. 以下三方库无法在沙箱内运行
   1. axios
   2. got
   3. bcrypt
   4. moment
   5. jsdom
   6. sharp
   7. crypto（请使用crypto-js替代）
4. 以下全局对象（也是所有可用的模块）是由沙箱注入，如果你依赖这些对象的原型链做判断时，可能会出现预期外的结果。如果你的代码中想要使用child Process等下面没有列举出的模块，则会提示找不到模块。
   **暂时无法在飞书文档外展示此内容**

**暂时无法在飞书文档外展示此内容**

## 初始化项目

在命令行执行以下命令克隆项目模板代码

**暂时无法在飞书文档外展示此内容**

项目目录结构为

**暂时无法在飞书文档外展示此内容**

### 其他功能的代码示例

为了方便你了解如何开发一个字段捷径，我们还提供了其他功能的代码示例

1. [field-demo](https://github.com/Lark-Base-Team/field-demo)的feat-ocr分支：展示了一个接收附件字段作为输入，发起 mock API然后返回发票Object字段的插件
2. [field-demo](https://github.com/Lark-Base-Team/field-demo)的feat-attachment分支：展示了一个接收文本字段作为输入，解析文本的URL然后返回附件字段的插件

## 调试表单UI

### 第一步：启动本地服务

在克隆下来的项目根目录中执行以下命令启动本地服务：

**暂时无法在飞书文档外展示此内容**

### 第二步：创建调试字段

基于[FaaS字段捷径调试模板](https://feishu.feishu.cn/base/DiQXbSLkSaGmwUsHkfJcAscunlh?table=tblwp5TejhYSjeNU&view=vewPbLApNL)复制副本，然后点击右侧边栏的「字段捷径调试助手」，或者直接在侧边栏插件市场中搜索“字段捷径调试助手”，然后运行，pin到侧边栏即可。

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=ODliYTE1NDIyN2ZlZWEwOWVkNGVjODRkYmYwNzY5ZDRfb0dGV0kzdmxyVlJMTFhtcnRjN01nRjZoNkoyd2RKWmJfVG9rZW46QTRRYmJOUTkxb3d3cFV4akRtYWNuOG1ObmRkXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

使用模板中的“字段捷径开发助手”

**暂时无法在飞书文档外展示此内容**

在插件市场中添加“字段捷径开发助手”

**在确保本地服务已启动的情况下**，点击打开面板按钮，字段的相关配置（表单 UI、关联字段等信息）便会显示在创建字段的面板上。

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=YWEyYzFiNmM5YTY2NTIwZWJiM2U5YjEwM2Q2YzE4OGRfU2ZwVFJOcDZqa0hRSFhxQXZUTHpZcWdXY1MyMEM1U1FfVG9rZW46Q29hcWIwWEcyb0JjUlN4NnVTeWNQNkhKbkhjXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

以 `feat-ocr` 示例代码为例，选择必填的附件字段后点击保存便能创建一个调试字段：

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=OGYwYWNkZDhiNzQ4NzI1MWFmMGI1ZTFlMzY4MmEzMjFfYWhpZWJsTXg5TmZGdVBsS2hOMnBoZmhMNVdEdW5DTUlfVG9rZW46U1Jzc2JSYURtb1J0aHl4VVFRU2MzOTNybkJoXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=YjBjZTVhMTUwYTY2NmE2Yjc4ZWIwZDk4NjI4MGYwOTFfa2YzSTZhVGJXRjBPaVF6TkszTGk4N1FnaGVtdjNVRDlfVG9rZW46T2ZGQmJvRVpPbzE4am94NzhaZ2NOMUpqbmJkXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

需要注意的是，通过【字段捷径调试助手】创建的捷径字段，只会自动生成第一行的值，并且要保证【字段捷径调试助手】和【本地服务】处于运行状态。

### 第三步：模拟 FaaS 请求

选择需要进行调试的 FaaS 字段，点击**「调试字段」****：**

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=YjZkOTcxYjI5ZjAxMTA3N2JmMmI1MmYzNTkyYTA5N2RfSFh5MmM5STQwRVI5dlI1bTI4VFd4MkhpNlVYNmpicmxfVG9rZW46RzcwZGJ1Snphb3VwcnV4UkFHQWN6bVVBbmliXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

调试插件便会模拟请求 FaaS 的行为，将你的 `execute`函数执行结果写入多维表格。目前我们仅支持本地模拟请求 FaaS 调试，目前调试模式下的插件只能使用「字段捷径调试助手」触发更新，无法通过自动更新，未来我们还会支持云端调试的方式。

## 补充日志!

为了方便捷径运行出错的时候能快速定位到问题，这一步是必须的，在开发完之后，必须要检查并补充日志。

1. 侧边栏插件开发助手查到的日志，是不区分table的，仅仅是插件和时间纬度的，所以每一条console.log必须要带上logID（context中有此属性），并在查日志的时候以此为条件进行过滤，否则查到的日志将非常多。

**暂时无法在飞书文档外展示此内容**

2. 在每个容易出错的代码前，都加上日志，比如：处理请求返回的结果时候推荐：

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=NGU5YjAzZWJjMmU0NDUzMmI4MmU1ZTM5NDk1Nzk5ZjBfRHVxN1RwYmF1TGlrQTNpcFNQUUFLb1BNU1k3SjRxR1FfVG9rZW46VThRRWJGdXhwb29nRHJ4OEFHSWNRa3VqbktmXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

3. 如果错误原因明确，想要向使用者传递信息，要避免直接报错，可将错误信息当作成功结果返回：

**暂时无法在飞书文档外展示此内容**

## 发布捷径

如果要发布付费插件，可以参考[插件开发者接入 「个人付费」](https://bytedance.larkoffice.com/wiki/XP67wlI41iNLC5kgworcUhsnnyb)。

企业内、个人、免费插件发布可以直接提交插件包：

在项目目录下执行 `npm run pack`（nodejs版本14.21.0及以上），然后将 `output/output.zip`文件上传即可。然后提交[多维表格捷径插件表单](https://feishu.feishu.cn/share/base/form/shrcnwTXnFVAbMPOSeaOFwIAnbf)，可发布给所有用户，或公司内使用。

提交表单后，会自动拉群沟通。

* 发布至公司内使用，请与公司飞书管理员确认可以发布。
* **全量发布** **、更新插件**前，请开发者参考[插件上下架审核说明](https://bytedance.larkoffice.com/wiki/O8v7wYI4MidHYEkoUvXcXMQqn2c)自查插件代码及功能是否符合标准，明确审核周期和维度。
* 关于捷径更新：捷径代码包内可以分为2个部分：

1.execute执行函数，称为捷径后端，捷径执行的逻辑。

2.formItems（控制捷径配置表单），授权部分，和resultType（控制捷径表现字段），可以称为捷径前端

其中捷径前端部分只会在用户重新打开字段并保存的时候，去获取最新版本的配置。

而捷径后端则是在捷径更新后直接使用最新版本的，不需要等用户操作，所以如果捷径v1>v2升级过程中修改了捷径前端部分，那么一定同时存在：v1的前端+v2的后端，和v2的前端+v2的后端这2种情况的捷径运行。如果你的后端没有兼容所有版本的前端部分，那么就很容易出现bug。

从历史经验来看，绝大部分开发者都无法处理好这个情况，所以建议直接上个新的，标记为v2即可，并联系上架人员将旧版本的捷径设置为保留状态。

### 上下架及更新版本前请看👉[插件上下架审核说明](https://bytedance.larkoffice.com/wiki/O8v7wYI4MidHYEkoUvXcXMQqn2c)

快速入门资源：

如果你使用 AI 编程，强烈推荐把当前开发指南交给 AI，它可以帮你快速写字段捷径。

**暂时无法在飞书文档外展示此内容**

# 捷径插件的结构

捷径主要由 `formItems`、`execute`、`resultType`3个主要属性组成，它们描述了插件入参、执行函数和返回结果。

| 捷径属性           | 代码示例                                 | UI示例                                                                                                                                                                                                                                                    | 说明                                                                                                     |
| ------------------ | ---------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `formItems` | **暂时无法在飞书文档外展示此内容** | ![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=NmUyNWY1OTMxM2Y0ZTFiOGQ2NjFkM2NlMDRiMWRmYTlfUzh0T05DYmo2S3Eydkl1SWk4ZUJ3MHkwYVZHOTlLZGVfVG9rZW46SXFqWWJHQkZOb0k4eTR4eUZHTWMyVm1BbkhoXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)          | `formItems`描述了捷径的UI表单，捷径运行时 `formItems`的配置值它会作为 `execute`函数的入参`` |
| `resultType`     | **暂时无法在飞书文档外展示此内容** | ![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=OWFhMjk5NjA2NTYwZGE2MWFjNWZhZDQzNGM4NDYzY2RfOXcxNXRaakNzVzVrMU1ROW5YTEtybDkxT3NnTkFRTFRfVG9rZW46R3Y1ZGJmY0djb1lUSmx4a1ZlV2N4TkpnblJHXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)`` | `resultType`描述了捷径属性字段和类型``                                                          |
| `execute`        | **暂时无法在飞书文档外展示此内容** | ``                                                                                                                                                                                                                                                 | 捷径的运行函数                                                                                           |

# 表单(formItems)

`formItems`用于定义捷径的表单UI，以及接收用户传入的参数，例如你可以通过 `SingleSelect` 声明单选组件，通过 `FieldSelect`声明字段选择组件。目前支持以下组件：

## Input 组件

文本输入组件，用户可手动输入，`props`支持以下参数

| 参数        | 类型   | 说明           |
| ----------- | ------ | -------------- |
| placeholder | string | 输入框提示文字 |

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=Zjg3MmU5ZTIxNzljMTNhYzY4MTU4NWM2Y2U5YzZlOTJfQzRRMjV0WUFWN3phTFJJdW1nZDJ6emRBZDZtcjhuVFBfVG9rZW46VmVGMWJnamZCb0JQbEl4TzQzd2Nmb1N2bklnXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

| ``       | 类型   | 说明                                                       |
| --------------- | ------ | ---------------------------------------------------------- |
| execute函数入参 | string | 使用 `Input`组时，多维表格会传递字符串给 `execute`函数 |

**暂时无法在飞书文档外展示此内容**

## SingleSelect 组件

下拉单选组件，用户手动选择下拉项里的值，`props` 支持以下参数

| 参数        | 类型               | 说明                                                  |
| ----------- | ------------------ | ----------------------------------------------------- |
| placeholder | string             | 输入框提示文字                                        |
| options     | { label, value }[] | 选项数据，其中 `label`为展示文案，`value`为实际值 |

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=M2I1NjE3MzlkMzU4MGU0NjllNjQ3ODM2OGY1ODQxOGFfb0ZUVEk4VEl4U3FJZkJDak1Qa0ZZcmtNNWxEZlc5MEFfVG9rZW46SmR5TmJpMG9Zb1JtbUJ4aWc2VGNmcGFLbkJlXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

| ``       | 类型               | 说明                                                              |
| --------------- | ------------------ | ----------------------------------------------------------------- |
| execute函数入参 | `{label, value}` | 使用 `SingleSelect`组件时，多维表格会传递对象给 `execute`函数 |

**暂时无法在飞书文档外展示此内容**

## MultipleSelect 组件

下拉多选组件，用户手动选择下拉项里的值，`props` 支持以下参数

| 参数        | 类型               | 是否必填 | 说明                                                  |
| ----------- | ------------------ | -------- | ----------------------------------------------------- |
| placeholder | string             | 否       | 输入框提示文字                                        |
| options     | { label, value }[] | 是       | 选项数据，其中 `label`为展示文案，`value`为实际值 |

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=MWExYThjZDMyZjNmZTZkN2E4YjVkYjdhODE5NzE1MGJfU2Rld0dLUEU5NDhBYnlwUjhubXdXZWV4RWxwanJtNjlfVG9rZW46Qk9TN2JwdmlIb3FsMHZ4cGZsM2M5aUhTbkhkXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

| ``       | 类型                 | 说明                                                                                                                                             |
| --------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| execute函数入参 | `{label, value}[]` | `MultipleSelect`组件与 `SingleSelect`组件类似，区别是用户可以选择多个选项，多维表格会传递包含 `{label, value}`对象的数组给 `execute`函数 |

**暂时无法在飞书文档外展示此内容**

## Radio 组件

单选框组件，`props` 支持以下参数

| 参数        | 类型               | 是否必填 | 说明                                                  |
| ----------- | ------------------ | -------- | ----------------------------------------------------- |
| placeholder | string             | 否       | 提示文字                                              |
| options     | { label, value }[] | 是       | 选项数据，其中 `label`为展示文案，`value`为实际值 |

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=MTY5ZWE2YWM4MThiZjU3ZjZlZDM5MWFlYjZjMTQ1NWJfcnN5WTFLVnc5RzBacWtjVFFhOHdtRFo0amlYNjBSZVZfVG9rZW46UmRPd2Jkd01pb09lcFh4TEZGWWM5MFJDblFmXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

| ``       | 类型                    | 说明                                                                                                                                        |
| --------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| execute函数入参 | `{label, value}` | `Radio`组件与 `SingleSelect`组件类似，适合在选项少于5个时使用，方便用户直接选择。多维表格会传递 `{label,value}`对象给 `execute`函数 |

**暂时无法在飞书文档外展示此内容**

## FieldSelect 组件

字段选择组件，`props` 支持以下参数

| 参数        | 类型      | 是否必填   | 说明                                                                                                                                      |
| ----------- | --------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| placeholder | string    | 否         | 提示文字                                                                                                                                  |
| mode        | 'single'  | 'multiple' | 否                                                                                                                                        |
| supportType | FieldType | 否         | 支持哪些字段类型，比如 [FieldType.Attachment]则只能选附件字段，目前只支持**文本、单选、多选、日期、附件、数字、复选框、超链接字段** |

其出参的数据结构，根据用户选择的字段有所不同，目前支持以下几种字段类型：

**暂时无法在飞书文档外展示此内容**

### 附件字段

**暂时无法在飞书文档外展示此内容**

| 参数    | 类型   | 说明                                                                    |
| ------- | ------ | ----------------------------------------------------------------------- |
| name    | string | 附件名称                                                                |
| size    | number | 附件大小                                                                |
| type    | string | 附件类型                                                                |
| tmp_url | string | 附件的临时下载地址，附件二级域名为 `feishu.cn`或者 `larkoffice.com` |

处理附件的捷径示例

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=NjZiODcxN2I5MTVkMmU1ODM5MzZlMzU0ZjU2Mzg4YmJfcll5UGRUd295c0ZiWWZyT21jaVNoNURMRW42NGpCa3dfVG9rZW46TlZ1b2JCRTB2b2NqVXB4OVNIdmN5WklCbmdlXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

**暂时无法在飞书文档外展示此内容**

### 文本字段

**暂时无法在飞书文档外展示此内容**

### 数字字段

**暂时无法在飞书文档外展示此内容**

### 日期字段

**暂时无法在飞书文档外展示此内容**

### URL 字段

**暂时无法在飞书文档外展示此内容**

### 单选字段

**暂时无法在飞书文档外展示此内容**

### 多选字段

**暂时无法在飞书文档外展示此内容**

### 复选框字段

**暂时无法在飞书文档外展示此内容**

## 表单公共配置项

以下是formItems的一些公共配置项目

### 表单帮助说明

**暂时无法在飞书文档外展示此内容**

表现结果：

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=ZWI4NDI0YzBiODNmNDBkYWI3YTUxYWVhYTI1NmRjMmZfVnJJdGJHN3hkZzdrdzMya2l2MkZvTVRaRU1UMEdNa0pfVG9rZW46UVNhb2JKWG5Hb2F5NkF4UWFNQmNrcEtpbk1CXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

# 返回结果(resultType)

`resultType`用于定义捷径插件返回值的类型，注意：在 `resultType`中声明的类型，需要与 `execute` 函数对应的返回值类型一致，否则数据会无法写入到多维表格

## 返回Object 字段

对于 Object 字段，其属性字段也是在此处声明

| 属性             | 值        | 是否必填 | 说明                               |
| ---------------- | --------- | -------- | ---------------------------------- |
| type             | FieldType | 是       | 对于Object字段则为FieldType.Object |
| extra            | object    | 是       | Object字段的相关参数               |
| extra.icon       | string    | 是       | Object字段主属性的图标             |
| extra.properties | object[]  | 是       | Object属性字段                     |

其中 extra.properties 支持以下配置

| 属性             | 值               | 是否必填 | 说明                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | ---------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| key``     | string``  | 是       | Object属性字段的key。从execute返回值取值用。例如：execute返回值为res，则这个字段将显示res[key]                                                                                                                                                                                                                                                                                              |
| type             | FieldType        | 是       | Object属性字段类型                                                                                                                                                                                                                                                                                                                                                                          |
| title            | string           | 是       | Object属性字段的名称                                                                                                                                                                                                                                                                                                                                                                        |
| isGroupByKey     | boolean`` | 否       | 标记该属性会作为 Object 字段的筛选、分组依据。⚠️注意：1.`properties`中必须有个属性的 `isGroupByKey`为 `true`，且type只能为 `FieldType.Text`，该属性会作为 Object 字段的筛选、分组依据。如果返回结果中不包含此属性的字段，则不会更新object字段1. 该属性在运行时的返回值没有精度要求，只要字符串长度小于128的即可，如果没有适合的值作为筛选和分组依据，则可以使用 ``${Date.now()}`` |
| primary`` | boolean`` | 否       | 标记该属性为用于排序的主属性。⚠️注意：1.`properties`数组中必须有一个 `primary`值为 `true`表示主属性，且主属性type只能为 `FieldType.Text`或 `FieldType.Number`，且不能被隐藏。如果返回结果中不包含此属性的字段，则不会更新object字段                                                                                                                                             |
| hidden           | boolean`` | 否       | 是否在字段面板中隐藏该字段，隐藏后该属性不可被新建为字段，默认为false                                                                                                                                                                                                                                                                                                                       |
| extra.formatter  | NumberFormatter  | 否       | 对于数字字段，可以指定其数字格式                                                                                                                                                                                                                                                                                                                                                            |
| extra.dateFormat | DateFormatter    | 否       | 对于时间字段，可以指定其日期格式                                                                                                                                                                                                                                                                                                                                                            |

与属性 type 对应的实际返回值类型示例：

| type类型                | 返回值类型   | 说明                        | 示例                                              |
| ----------------------- | ------------ | --------------------------- | ------------------------------------------------- |
| FieldType.Text`` | `string`   | ``                   | **暂时无法在飞书文档外展示此内容**          |
| FieldType.Number        | `number`   | ``                   | **暂时无法在飞书文档外展示此内容**`` |
| FieldType.SingleSelect  | `string`   | 返回单选的文案``     | **暂时无法在飞书文档外展示此内容**`` |
| FieldType.MultiSelect   | `string[]` | 返回多选的文案数组`` | **暂时无法在飞书文档外展示此内容**`` |
| FieldType.DateTime      | `number`   | UNIX 时间戳``        | **暂时无法在飞书文档外展示此内容**          |
| FieldType.Checkbox      | `boolean`  | ``                   | **暂时无法在飞书文档外展示此内容**          |

object示例：

模板：https://github.com/Lark-Base-Team/field-demo/tree/feat-ocr

**暂时无法在飞书文档外展示此内容**

## 返回附件字段

**暂时无法在飞书文档外展示此内容**

| 参数        | 类型   | 说明                                                                                                                                                                                                                                                                 |
| ----------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name        | string | 附件名称                                                                                                                                                                                                                                                             |
| contentType | string | "attachment/url"// 固定值                                                                                                                                                                                                                                            |
| content     | string | 附件下载地址，必须是公共资源。**数量限制为5个附件**  **，**  **单个附件的大小限制为10M** **，且直接get有content-length响应头。下载时间不能超过1min。**如果要向用户提示这个信息，而不是直接报错，可以参考：**暂时无法在飞书文档外展示此内容** |

**处理附件的捷径示例**

**暂时无法在飞书文档外展示此内容**

## 返回多行文本字段

可以通过resultType创建一个多行文本字段，请参考完整示例：

**暂时无法在飞书文档外展示此内容**

## 返回单选字段

| 属性          | 值                     | 是否必填 | 说明               |
| ------------- | ---------------------- | -------- | ------------------ |
| type          | FieldType.SingleSelect | 是       | 声明返回为单选字段 |
| extra         | object                 | 是       | 单选字段的相关参数 |
| extra.options | {name: string}[]       | 是       | 单选字段的预设选项 |

可以通过resultType创建一个单选字段，请参考完整示例：

**暂时无法在飞书文档外展示此内容**

## 返回多选字段

| 属性          | 值                    | 是否必填 | 说明               |
| ------------- | --------------------- | -------- | ------------------ |
| type          | FieldType.MultiSelect | 是       | 声明返回为多选字段 |
| extra         | object                | 是       | 多选字段的相关参数 |
| extra.options | {name: string}[]      | 是       | 多选字段的预设选项 |

可以通过resultType创建一个多选字段，请参考完整示例：

**暂时无法在飞书文档外展示此内容**

## 返回数字字段

可以通过resultType创建一个数字字段，请参考完整示例：

**暂时无法在飞书文档外展示此内容**

## 返回日期字段

| 属性             | 值                 | 是否必填 | 说明               |
| ---------------- | ------------------ | -------- | ------------------ |
| type             | FieldType.DateTime | 是       | 声明返回为日期字段 |
| extra            | object             | 否       | 日期字段的相关参数 |
| extra.dateFormat | DateFormatter      | 否       | 日期字段的预设格式 |

可以通过resultType创建一个日期字段，请看完整示例：

**暂时无法在飞书文档外展示此内容**

# 执行函数(execute)

## execute入参

`execute`定义捷径插件的运行逻辑，目前仅支持 `Nodejs`，该函数包含以下入参。

| 参数               | 类型    | 说明                                                                                                                                                                                  |
| ------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `formItemParams` | object  | 是实际运行时用户传入的参数，* 该对象的 `key`会与 `formItems`中定义的 key 值保持一致* value 与 `formItems`中各种组件定义的结构一致示例：**暂时无法在飞书文档外展示此内容** |
| `context`        | Context | 每次调用的上下文，数据结构见下方的 `context`定义                                                                                                                                    |

### context定义

我们通过会 context 对象，向运行中的 FaaS 函数提供上下文环境信息

| 参数                   | 类型                                                     | 示例值                                                | 说明                                                                                                                                                  |
| ---------------------- | -------------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| fetch                  | (url, options, authorizationId) => Promise`<Response>` | ``                                             | 请求外部的数据的API                                                                                                                                   |
| baseSignature          | string                                                   | eyJzb3V...                                            | 签名数据，与packID配合使用，可以在服务端验证请求是否来自此捷径，详见“捷径流量标识”                                                                  |
| baseID                 | string                                                   | 7395539782238404612                                   | 多维表格的id，仅用于区分多维表格，无法通过此id定位到某一具体多维表格。                                                                                |
| logID                  | string                                                   | 02172524652697100000000000000000000fffff9bbf0be4d73cd | 可用于报错的时候协助排查错误日志，建议每个console.log都带上此参数，以区分每次捷径的运行，因为查到的日志是一个时间段下所有的表格混合在一起的日志集合。 |
| tableID                | string                                                   | tblvoVgvLtYumGeq                                      | 数据表中的表格id                                                                                                                                      |
| packID                 | string                                                   | replit_3e4ce893726c23e4                               | 捷径上线后的唯一标识。可以与baseSignature配合使用，供开发者服务端验证流量来源                                                                         |
| tenantKey              | string                                                   | 11a1b11208c8575e                                      | 租户id，可用于计费                                                                                                                                    |
| timeZone               | string                                                   | Asia/Shanghai                                         | 时区                                                                                                                                                  |
| baseOwnerID            | string                                                   | ou_e04138c9633dd0d2ea166d79f54abcef                   | 文档owner用户在捷径字段场景下的唯一标识                                                                                                               |
| isNeedPayPack`` | bool``                                            | true``                                         | 用户可根据当前字段判断当前插件是否是付费插件``                                                                                                 |
| hasQuota               | bool                                                     | true                                                  | 是付费插件的情况下，开发者根据此字段判断当前用户是否具有权益，有权限即可执行                                                                          |

## execute返回值

`execute`必须要有一个返回值，通过 `code`告知多维表格运行结果，通过 `data`返回数据。不支持流式填充到多维表格，execute函数必须15分钟内返回结果，否则会失败。

| 属性     | 类型            | 说明                                                                                                                                                                                                                                                                                                                                                                       |
| -------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `code` | `FieldCode`   | `execute`执行结果 `code`，具体值见下方的 `code`定义。请使用code来向用户抛出错误，而不是msg                                                                                                                                                                                                                                                                           |
| `data` | `object` | 根据定义的返回结果(resultType)，返回对应的数据结构值，目前支持以下字段，详见本文的「[返回结果(resultType)](https://feishu.feishu.cn/docx/SZFpd9v6EoHMI7xEhWhckLLfnBh#doxcnlRD6FkkJqpZeG1iWXytARh)」章节* Object 字段，根据返回结果的定义返回对应的属性值，其中id和主属性是必填值* Attachment 字段* Text 字段* SingleSelect 字段* MultiSelect 字段* Number 字段* DateTime 字段 |

### `data`

需要按照resultType的声明来返回data，其结构必须严格遵守resultType的声明。

**暂时无法在飞书文档外展示此内容**

### `code`

| code值                       | 含义                                                               |
| ---------------------------- | ------------------------------------------------------------------ |
| FieldCode.Success            | 运行成功                                                           |
| FieldCode.ConfigError        | 配置错误，即用户在配置面板选择的值不合法可以返回该错误码           |
| FieldCode.AuthorizationError | 授权错误                                                           |
| FieldCode.PayError           | 付费错误异常                                                       |
| FieldCode.RateLimit          | 限流                                                               |
| FieldCode.QuotaExhausted     | quota耗尽（非飞书付费体系）                                        |
| FieldCode.InvalidArgument    | 参数错误，用户所选配置的内容合法，但是代码中未兼容等情况。         |
| FieldCode.Error              | 插件运行失败（如果前面的code值都不符合，才考虑使用通用的报错code） |

## 请求外部数据

注意：插件中只能请求公网可访问的接口

你可以通过 `context`中注入的 `fetch` 方法请求外部数据，`fetch`语法见[node-fetch](https://github.com/node-fetch/node-fetch)

**暂时无法在飞书文档外展示此内容**

### 域名白名单

注意：需要在插件调用 `basekit.addDomainList`声明所需发起网络请求的域名白名单，向不在白名单内的域名请求会被拒绝！！！

* 所填写域名需包含主机名（如 example.com）.可打开其子域名（如 doc.example.com）
* 域名可以使用 IP 地址（支持IPV4和 IPV6）或 localhost
* 不支持配置端口
* 仅支持填写域名，带上协议、路径会导致匹配失败

**暂时无法在飞书文档外展示此内容**

# 授权

凭证不是字段捷径的必选项，取决于字段捷径代码是否依赖其他三方平台的凭证以及是否需要托管到平台侧。

* 对于平台[已接入](https://feishu.feishu.cn/docx/SZFpd9v6EoHMI7xEhWhckLLfnBh#share-WTFzd4z2EoHGalxzI9Ac8e4qnSg)的凭证类型，开发者按照本文指引定义具体的插件接口。
* 对于平台未接入的凭证类型，开发者如有需要，可提需求给平台，平台经过评估后决定是否接入。新接入凭证，开发者需要提供如下信息。
  * 凭证类型（ApiKey，Oauth）
  * 凭证使用相关文档
  * 如果凭证账号展示三方平台的账号信息，还需额外提供用于拉取三方账号信息的API。并指定需要展示的字段
    ![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=NmM5YmQ2NGQwNmZlNTYxN2MwOTIyODQ1NTllYThjNTJfaWRibWVWcHZCMlMwdnk4ZVY0REFOeW1hMFNoNjNPNWVfVG9rZW46RTBzVWJpQ3pab2ljRjF4UmxTNWNKYTgyblBiXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

## 已支持的三方凭证

目前只支持以下三方凭证，如果想要一个自己公司/平台专属的凭证标识，请填写[申请表单](https://bytedance.larkoffice.com/share/base/form/shrcn75JZxOoVsZ9DW9qGPOaNbe)，提交表单之后会拉群，约10天后群里通知申请通过。

| 平台(授权方)唯一标识(platform)                                                                                                                              | 平台说明                                   | 凭证类型        | 平台官方链接                                                                                              | 备注                           |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | --------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------ |
| nolibox                                                                                                                                                     | 画宇宙开放平台凭证                         | ApiKey          | https://creator-nolibox.apifox.cn/endpoint-56289960                                                       | ``                      |
| feishu_user(暂无法使用)                                                                                                                                     | 飞书用户身份凭证user_access_token`` | Oauth2`` | https://open.larkoffice.com/document/server-docs/api-call-guide/calling-process/get-access-token#4d916fe0 | ``                      |
| baidu                                                                                                                                                       | 百度智能云                                 | ApiKey          | https://cloud.baidu.com/                                                                                  | ``                      |
| qzoffice                                                                                                                                                    | 轻竹智能                                   | ApiKey          | ``                                                                                                 | ``                      |
| autodocs                                                                                                                                                    | autodocs                                   | ApiKey          | ``                                                                                                 | ``                      |
| juzi                                                                                                                                                        | 句子秒回企业级凭证                         | ApiKey          | [https://api-doc.juzibot.com/](https://api-doc.juzibot.com/)                                                 | ``                      |
| minimax                                                                                                                                                     | ``                                  | ApiKey          | ``                                                                                                 | ``                      |
| zhipuAI                                                                                                                                                     | ``                                  | ApiKey          | ``                                                                                                 | ``                      |
| zhipu_bigmodel                                                                                                                                              | ``                                  | ApiKey          | ``                                                                                                 | ``                      |
| volcengine                                                                                                                                                  | 火山引擎                                   | ApiKey          | https://console.volcengine.com/ark/                                                                       | ``                      |
| connect_ai                                                                                                                                                  | ``                                  | ApiKey          | ``                                                                                                 | ``                      |
| AWSSigV4``                                                                                                                                           | aws``                               | ApiKey`` | https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html``                 | 需提交官方测试，且包版本要求： |
| "@lark-opdev/block-basekit-cli": "1.0.4-alpha.33""@lark-opdev/block-basekit-server-api": "1.0.4-alpha.34"格式参考：**暂时无法在飞书文档外展示此内容** |                                            |                 |                                                                                                           |                                |

* 「平台唯一标识」在开发者授权相关模块代码中会被用到，详情可参考下文「ApiKey授权模式」章节

## APIKey 授权模式

### 支持的授权模式

目前多维表格支持以下几种 APIKey 授权模式。

> 1. 捷径一旦上线之后，对捷径授权的升级是不兼容的。会导致已有用户的捷径不可用，比如：捷径从没有授权升级到有授权，更换授权的id、platform、type。
> 2. 授权信息在execute中无法被感知，它会在请求的时候，通过被代理的context.fetch携带上。所以只能在被请求的服务端获取到它。

| 授权类型``                                                                                                                                                                                                                                                                                                                                                                    | 相关介绍``                                                                                                                                                                             | 代码示例``                                 | 本地调试授权示例本地开发阶段，在src/config.json中设置mock值以进行本地调试                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HeaderBearerToken                                                                                                                                                                                                                                                                                                                                                                    | 用户输入 APIKey 后，多维表格框架在请求时会在header中带上请求头**暂时无法在飞书文档外展示此内容**服务端接收到的请求示例：**暂时无法在飞书文档外展示此内容**```` | **暂时无法在飞书文档外展示此内容**`` | 本地测试时field-demo/config.json结构与authorizations结构对应如下图所示：![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=YTY3OTA1ZTM4NWFiZjQ0NWM4NTliMTI5OTI4ZjkzMTZfY0x2R2g4UzkxeFVXRlFwVkJaSG80dUhSNHRXOWI1cXhfVG9rZW46UlQ5NWJKWk4wbzAzMlV4WXAxemNUa2NwbkJjXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)在execute函数中使用该授权：![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=YWEwODZhMzlkZmU4ZDBjOWEwZWVmZTliNWRiNWJkODFfUExsMjNZTUltcnN4b2xydXNUakN1TDdjR2JmRVZrV21fVG9rZW46SFg5SGJWazlob1lHckN4SUZlZ2MzUXMwbjloXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)然后在捷径开发助手中正常调试，即可测试field-demo/config.json中mock的授权信息。框架会自动给请求头带上Authorization: Bearer APIKey，这是服务端接收到的请求数据示例：**暂时无法在飞书文档外展示此内容**                                 |
| Basic``                                                                                                                                                                                                                                                                                                                                                                       | 用户输入用户名和密码，多维表格框架在请求时在 header 中带上请求头**暂时无法在飞书文档外展示此内容**服务端接收到的请求示例：**暂时无法在飞书文档外展示此内容**``             | **暂时无法在飞书文档外展示此内容**          | 本地测试时field-demo/config.json结构与authorizations结构对应如下图所示：![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=YWM3YzJhNGE4OGQ5MmY3ZDgyZTQ2ZGUyMTAwM2FiZmNfWGhGY0hGUGUxVXVOWDA2aVJDTlhvbmlwVVlYM3RITTdfVG9rZW46Snlrd2JhQzhtb1FZMnJ4QlpaU2NWVDZOblBoXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)在execute函数中使用该授权：![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=MjI5MGRiNDVmYjUwZDY4NGJmNWE4MDhmMjQxNzUyZTlfaE90Z01PcVRzRXZkYjN2bnd4NVhaVE5velVNOHBFQjlfVG9rZW46U2FCZ2J1SHZRbzZzWFJ4aGpieWNWZHc3bkpkXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)然后在捷径开发助手中正常调试，即可测试field-demo/config.json中mock的授权信息。框架会自动带上请求头：Authorization: Basic `<base64 encoded username:password>`                                                                            |
| 这是服务端接收到的请求数据示例：**暂时无法在飞书文档外展示此内容**该字符串 `QUFBQUFBQUFBOKJCQg==`进行Base64解码后：![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=YzEzOTNlYmExMzIwNzAxM2U2YWE4YTE0NGYzNDk1Y2VfSVFiNzhXMkhDRGFFWGlqWXFMU0NrbjNzTGhFWHphNVJfVG9rZW46SUlveGJOUUs0b1hkSTF4SGhSTWMxbjdYbkhnXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)`` |                                                                                                                                                                                               |                                                   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| MultiHeaderToken``                                                                                                                                                                                                                                                                                                                                                            | 用户可以输入多个key，多维表格框架会在你请求时带上请求头。服务端接收到的请求示例：**暂时无法在飞书文档外展示此内容**``                                                            | **暂时无法在飞书文档外展示此内容**`` | 本地测试时field-demo/config.json结构与authorizations结构对应如下图所示(按照params中的顺序一一对应)：![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=NDM5NGEzMDdmYjU1MzgzY2U1NGNkZWJhZWVjZWQxYzhfcjdkSDk4TU1YWGxhanREUWhpeFNJOFpVRjRBWndQODVfVG9rZW46UTJkdWJpY1o2b2I1bjZ4U3ZNTmN1OHZLbnhCXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)在execute函数中使用该授权：![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=MWE0ZDJjYTdhNWJiYTZhMDY0MThmYjJiYTNmMDY3MmJfODNwT0lrTUtOVWRMdG9ZbnNWR3hlMWFFQjlLQVluSklfVG9rZW46RlpHU2JIRTVCb0JqcUl4M1M4eWN3anV5bmVkXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)然后在捷径开发助手中正常调试，即可测试field-demo/config.json中mock的授权信息。无需手动拼接授权参数，框架会自动将其拼接到请求头中(这是服务端接收到的请求数据示例)：**暂时无法在飞书文档外展示此内容**     |
| MultiQueryParamToken                                                                                                                                                                                                                                                                                                                                                                 | 用户能输入多个key，多维表格框架会在请求时在url query 带上授权信息服务端接收到的请求示例：**暂时无法在飞书文档外展示此内容**``                                                    | **暂时无法在飞书文档外展示此内容**`` | 本地测试时field-demo/config.json结构与authorizations结构对应如下图所示(按照params中的顺序一一对应)：![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=NWE5NTk4NWViY2M3YmFlOTUzMTk0N2IxNWExYWYzYjVfeTBkUlhkbXZvVnZKQzY5QjQ4a1p5d25BWDV5Y1VxNkNfVG9rZW46Q1dDUGJQVVVLb1dET2t4U0JGd2NxRWZjblJlXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)在execute函数中使用该授权：![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=NTFjMDM4NjFmY2JkZjI0ZDYwNTIwNDM5YTE1ZmY2ODZfUUxvU1FLeW5wMnpGUUVEQ3lSdHFZQWM4dkxXeDNDTUFfVG9rZW46UzVNb2JmS1BXb1VEVmd4SnE0R2NSMXo0bndlXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)然后在捷径开发助手中正常调试， 即可测试field-demo/config.json中mock的授权信息。无需手动拼接授权参数，框架会自动将其拼接到url query中(这是服务端接收到的请求数据示例)：**暂时无法在飞书文档外展示此内容** |
| Custom                                                                                                                                                                                                                                                                                                                                                                               | 用户可以输入多个key，由你指定组装到url或body中（不包含headers）服务端接收到的请求示例：**暂时无法在飞书文档外展示此内容**``                                                      | **暂时无法在飞书文档外展示此内容**`` | 本地测试时field-demo/config.json结构与authorizations结构对应如下图所示(按照params中的顺序一一对应)：![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=Mzk3YTFiNzhiZGJlOGVkNDZiZjRhOGIzZTNmY2Q5YWZfRWY0T1lMRlBGRzlvbVFicXozbURUWnBZREEwNU42WEpfVG9rZW46TjNWN2J1MDBRb1hGZEN4alRHaWM1a1V5bkdnXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)在execute函数中使用该授权：![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=OWZlNWY5NWQ2MDc2NWFkYTI1ZjAyZmYzNmNkOWMxZGZfbG1VeXZNaTNBTElMb2NKZTJBZ1QxSW02ZjFKVG90QUhfVG9rZW46S1NHY2J3d3plb1hoWFN4Y2hJamNRZzJWbm5nXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)然后在捷径开发助手中正常调试，即可测试field-demo/config.json中mock的授权信息。这是服务端接收到的请求数据示例：**暂时无法在飞书文档外展示此内容**                                                         |

### 开发阶段本地调试授权

在开发阶段暂不支持直接显示授权ui界面并调试。仅支持通过设置config.json来进行模拟调试：config.json中的配置将模拟用户的授权输入。

如果要调试非必填的授权项，用户未填写授权的情况，则可以在config.json中将对应的授权信息设置为空字符串即可。

根据不同的授权类型，在项目根目录中修改config.json中的 `authorizations`为对应的结构即可在捷径调试阶段注入 `config.json`中的的模拟授权信息。

每种授权类型的授权mock参数格式详见上方表格中的"本地调试授权示例"一列。

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=Mzk2OWM4MDUzYTIwMjJmZTRiYWY2NDIwODI0Mzc1NWZfUndkNjQ0YU1TTXRIRWVnNlBtdVQ5YUxENm9pOVloQ1ZfVG9rZW46SFFYa2JzTFE3bzYwZGF4dUgxNmNPRXZibkdMXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

# 本地开发调试模式注意事项

1. 一次只能调试生成一行，捷径上线之后才可以处理多行，每一行的处理都是隔离的，即使同时处理多行，execute仍然无需关注并发问题。
2. 调试模式下，只能通过开发助手的调试按钮生成，点击表格中的手动更新、自动更新是无效的：

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=NzE5ZTUwZDRiZjlmNmYxODgzZGM3MjgwYjljZmMxZDVfOFVFVzdmSDV1ZmhXQ3ZGOElndEZOY2UycGhnWFBwWHZfVG9rZW46SDF2eGJsSVVYbzk1elV4WmpzRmN4MndGbldiXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

3. 每次修改formitems都要重新添加捷径，旧的可以删掉。

# 字段配置

支持通过 `basekit.addField`的 `options`控制字段的配置，示例代码如下

**暂时无法在飞书文档外展示此内容**

目前支持配置如下

| 参数              | 类型    | 说明                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| disableAutoUpdate | boolean | 是否显示自动更新，默认为false开启自动更新，传递true则为关闭自动更新，字段不再跟随字段配置自动更新，并且字段配置面板不会再展示自动更新按钮![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=YjUxZDI4YjI4MzA2YTJlNGUzNDMwMTBhNDE4NDhjNDRfSGY2SnpFY09pTExOMUNlZXR0QjIzOFJ3anR3S0w5VGxfVG9rZW46TWhSUGJpNVpjb2FGdHR4R2ZhTWNyY2tQbjJjXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)`` |

# 捷径流量标识

目前开发者在插件里通常会通过http协议调用自己服务端的api，某些情况下，为了适配捷径插件，api无任何校验，为了防止被其他恶意流量，base侧目前支持三方开发者识别流量来源于base。具体的实现方式是：平台侧通过私钥签名一份数据，开发者通过平台暴漏的公钥对数据进行验签来确保流量来源于base。

具体做法：

1. 在捷径请求中同时将 `context.baseSignature`和 `context.packID`带上。
2. 服务端对 `baseSignature`验签后再比较其中的 `packID`，如果验签通过且 `packID`一致，则表示该请求是来自 `packID`的捷径插件。需要注意的是，在本地调试开发阶段，`baseSignature`是一个固定的值，每个开发者拿到的值都是一样的。

流量标识数据如下：

**暂时无法在飞书文档外展示此内容**

验签：

**暂时无法在飞书文档外展示此内容**

示例代码(Nodejs写法)：

**暂时无法在飞书文档外展示此内容**

公钥：

**暂时无法在飞书文档外展示此内容**

# 同步&异步执行插件

不同类型的插件，实际执行的时间会存在很大差异。比如一般AI生成类的插件，执行时间会比较久，经常出现超过一分钟的情况。目前插件平台侧在等待插件在沙箱执行结果时，有两种方式可选：同步、异步等待。因此插件发布时，可以选择插件的执行方式。两者方式的差异如下：

| 同步 | * 等待沙箱执行，超时时间为58s，超时会导致本次内容生成失败* 限流时，限制的是qps(参考限流章节)      |
| ---- | ------------------------------------------------------------------------------------------------- |
| 异步 | * 等待沙箱执行，超时时间为15min，超时会导致本次内容生成失败* 限流时，限制的是并发数(参考限流章节) |

# 限流

对于插件，考虑到插件侧能够承受的流量存在一定的限制，因此提供了限流的能力，目前主要提供两个维度（插件、租户），共三个限流值的配置，下面简要说明：

**暂时无法在飞书文档外展示此内容**

上文解释了限制值的含义，下面说明下限制值的含义，这里限制值的含义受插件执行方式（异步、同步）影响

| 同步 | 限制调度到下游的并发值，同一时间最多只有指定数量的流量到插件侧。如果你的捷径能确保在1分钟内返回结果，那就在上架群中额外说明，使用同步方式，否则将默认为异步                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 异步 | 限制调度到下游的QPS，每s内，最多只有指定数量的流量到插件，剩余的将进入排队中。平均每个小时捷径最多可以成功运行：90*qps/t次qps：管理表配置的限流数量，分当前租户、所有租户、插件维度，取三者剩余最小值t:捷径平均每次运行时间（单位：秒）。此外单个 Base 的提交量 + 排队量需要 < 1 万行，超过此限制会直接提示失败![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=MjU4MDgwNTJhZjE5NWQwZmNlYmIwYjM3NGI4M2NkY2RfWno5WGNqajVsR3p1WklVZDBjNXM4aVk3a3RkQ3h0a3VfVG9rZW46WnJESGJpeEVSb0Y1QlZ4ZVpxSmN4OFgybjdnXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)需要注意的是，某条记录的捷径任务排队时间超过1h之后，该条记录的捷径任务会被直接取消，不会报错，也不会提示，单元格内容保持不变。 |

说明：之所以同步、异步限制存在差异，主要是考虑异步通常执行时间较长，下游通常只能接受固定数量的执行任务。同步因为执行时间较短，因此采用了qps限制。

# 国际化

支持通过 `basekit.addField`声明国际化资源，通过 `t`方法使用国际化 key，目前支持中文（`zh-CN`）、英文（`en-US`）、日文（`ja-JP`），如果当前的语言环境不属于其中3种，则会使用默认英文的语言资源。

**暂时无法在飞书文档外展示此内容**

# FAQ

## 调试阶段只会处理第一行

在捷径的调试开发阶段，只会处理第一行记录，其余记录不会生成结果。

## Error: Cannot find module '@ies/starling_intl'错误

在项目目录下，执行以下步骤重新安装依赖可解决

**暂时无法在飞书文档外展示此内容**

## 获取多维表格的附件buffer数据

**暂时无法在飞书文档外展示此内容**

# 交流群

如果在开发过程中遇到任何困难，或有任何反馈，请加入交流群，发起话题，与运营人员及其他开发者一起进行讨论。

**暂时无法在飞书文档外展示此内容**

# 捷径开发助手

## 日志查询

为了方便开发展排查插件的异常报错等问题，当前支持捷径开发者查询开发者代码里通过**console.log打印**的日志信息。查询的入口在[字段捷径开发助手](https://bytedance.larkoffice.com/base/extension/replit_3e4a086586ade3e3)：

目前查询日志时，需要提供如下参数：（捷径id，tableID）

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=NmI2NGU1YjZjNjQ4ZDUzM2U0MDRkOTY5MDg0MjRhMjJfNEZYN0gzaWd2aTE4a2VRelg0UDNKN1h4QUw2RVlKdm1fVG9rZW46UFRTYmJCcnFUbzFBaVB4YVQ5eWNVOGxrbkFoXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

* 获取捷径 ID：在字段捷径中心搜索，进去字段捷径详情页，点击「分享链接」，链接末尾的字符串即为 ID，例如：https://bytedance.larkoffice.com/base/extension/replit_3e1c110e91bda3e4
* TableID：URL 中 table = 后的字符。

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=M2Q3ZmI0Y2U2N2M3MDI5NGU2MjgxMmE1MDg5NGEyOGNfdU5BRkdhQzc3dkl3aTM1RTNRS0dTNGxTeGVwcWhOVTdfVG9rZW46SXlFc2JWRElrb0RIRk54SFJPT2NKWVVubmpnXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

对于用户反馈异常的问题，可以让用户提供报错信息，按照如下方式一键复制即可：

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=MjI0YTY2ODFiYTAwZjlmN2ZjZDU3YjI2YTMyOWU2ZTFfSldZMGVoUVMwcUc1WWpaa1RFRVlJWVRON0pTUG01NlFfVG9rZW46VnJ5OGJtdDgzb01MS1F4TGJIM2MxQkNnbjJnXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

此功能仅供**捷径id对应的管理员**查询**已上线**捷径输出的js代码console.log日志。**需要配置插件管理员，可联系****上架群中上架人员****进行配置。**

查询能力上，目前限制了 **时间跨度（6h）** 以及最多返回的**日志条数(最多500条)。**

获取捷径运行的logid/捷径id：

**暂时无法在飞书文档外展示此内容**

获取捷径运行的logid

![](https://feishu.feishu.cn/space/api/box/stream/download/asynccode/?code=NDlmOTc2NmZlMWZmNDg0Mjc4ZmM0ZjUxZmVjODI5MTZfWXlkdW9TMFcxUWFTUTVtN3hsaGhpU2E3ZDAzU1d0bndfVG9rZW46VklLb2JVcjRjb0dIRG14V2NlemNtd3FObklnXzE3NjQ4MTg4NTY6MTc2NDgyMjQ1Nl9WNA)

获取捷径的id

# 最佳实践

1. **环境对齐** ：开发和测试时尽量使用与线上一致的 Node.js 版本 (14.21.0)，注意内存 (1G) 和超时限制 (15分钟)。避免使用文档中明确禁用的三方库。
2. **模板先行** ：基于官方提供的 `field-demo` 模板 ([https://github.com/Lark-Base-Team/field-demo](https://github.com/Lark-Base-Team/field-demo)) 开始开发，理解其基本结构。参考其 `feat-ocr` 和 `feat-attachment` 分支学习不同场景的实现。
3. **核心结构** :
4. 捷径的核心是 `basekit.addField` 方法，它包含三个主要部分： `formItems` , `resultType` , 和 `execute` 。
5. **formItems** : 定义用户配置界面。
   * 使用合适的 FieldComponent （如 SingleSelect , Input , FieldSelect ）来获取用户输入。
   * 提供清晰的 `label` 和 `placeholder` 。
   * 利用 i18n 实现多语言支持
   * 使用 `tooltips` 提供帮助信息或文档链接
   * 设置 `validator` 确保必要参数已填写。
6. **resultType** ：定义捷径输出结果写入的字段类型。
   * 明确指定 type (如 `FieldType.Text `, `FieldType.MultiSelect` , `FieldType.Object`
   * 对于复杂类型（如 `MultiSelect` , `Object` ），需要提供 extra 配置。
7. **execute** : 实现捷径的核心业务逻辑。
   * 函数接收 `formItemParams` (用户在表单中的输入) 和 `context` (包含 fetch 等上下文方法) 作为参数。
   * 安全地从 `formItemParams` 中解构所需参数。
   * 正确处理输入字段 ( `inputField` ) 的数据格式，特别是从 FieldSelect 获取的值可能是一个数组，需要提取其中的文本内容，如 `index.js` 中对 `inputField` 的处理。
   * 使用 `context.fetch` 发起网络请求。 不要使用 `axios` 等被禁用的库。
   * 如果需要访问外部域名，使用 `basekit.addDomainList` 将其添加到白名单，如 `index.js` 中添加 `allowedDomains` 。
   * 实现健壮的错误处理：
     * 检查 `fetch` 返回的 `response.ok `状态。
     * 处理常见的 HTTP 错误码（如 401 未授权, 429 请求频繁）。
     * 仔细解析 API 返回的 JSON 数据，处理可能的解析错误和 API 本身返回的错误信息（如 data.error ）。
     * 使用 try...catch 包裹主要逻辑，捕获未知异常。
   * 返回结果时，使用正确的 `FieldCode` （如 FieldCode.Success , FieldCode.RateLimit , FieldCode.AuthorizationError ）。
   * 即使是逻辑上处理的“错误”（如 API Key 无效），也通常返回 FieldCode.Success ，并在 data 字段中提供用户可读的错误提示，同时可以在 `msg` 字段中记录更详细的内部错误信息供开发者排查。
8. **安全第一** ：
9. 如果你的捷径需要调用你自己的后端服务，务必在服务端使用文档提供的公钥和方法，对请求中的 `context.baseSignature` 和 `context.packID` 进行验签，防止恶意调用。
10. 谨慎处理用户输入和第三方 API 返回的数据。
11. **授权管理** ：
12. 根据第三方 API 的要求选择合适的 `AuthorizationType`。
13. 提供清晰的 `instructionsUrl` 引导用户获取和填写凭证。
14. 本地调试时，在 `config.json` 中正确配置模拟授权信息。

* **调试充分** ：利用「字段捷径调试助手」进行本地调试。在 `config.json` 中 mock 好授权信息和必要的配置。记住调试模式下仅更新第一行数据。

6. **性能考量** ：
7. 评估捷径执行所需时间。对于耗时较长（可能超过 58 秒）的操作（如复杂的 AI 计算、大量数据处理），在发布时选择「异步」执行模式。
8. 注意并发/QPS 限制，优化代码逻辑，避免不必要的长耗时操作。
9. **用户体验** ：
10. 提供国际化支持 (`i18n`)，至少覆盖中、英、日文。
11. 根据需要配置 `options.disableAutoUpdate`，决定是否允许用户关闭自动更新。
12. **日志与监控** ：
13. 在 `execute` 函数中使用 `console.log` 输出关键步骤和调试信息，方便上线后通过「日志查询」工具排查问题。
14. 关注 `context` 中的 `logID`，在反馈问题时提供。
15. **遵循限制** ：时刻注意运行环境的资源限制（CPU、内存、并发数、禁用库、附件大小/数量限制等）。对于资源消耗大的任务，考虑将核心逻辑部署到自己的服务器，捷径仅做简单调用。

遵循这些实践，可以帮助你更高效、更稳定地开发出优秀的字段捷径插件。

# 更新日志

| 版本 | 更新时间  | 说明                                         |
| ---- | --------- | -------------------------------------------- |
| 0    | 2024.7.4  | 初始版本                                     |
| 1    | 2024.7.9  | 优化执行函数部分                             |
| 2    | 2024.7.12 | 增加其他功能的代码示例                       |
| 3    | 2024.7.15 | 新增 isGroupByKey，修改 context 注入的内容   |
| 4    | 2024.7.29 | 不建议使用CustomHeaderToken、QueryParamToken |
| 5    | 2024.9.27 | 增加关闭自动更新的配置                       |
