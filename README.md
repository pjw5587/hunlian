# 政务风格婚恋服务平台（静态前端 + Supabase）

参考政府门户网站风格的婚恋信息服务网站：顶部条 + 蓝底表头 + 主导航下拉 + 通知公告 + 快捷服务 + 页脚备案栏。
纯静态 HTML/CSS/JS，**无需服务器端代码**，后端用 Supabase（数据库 + 对象存储 + 管理员登录），
可一键部署到 Vercel / Netlify / GitHub Pages。

---

## 一、功能一览

| 页面 | 文件 | 说明 |
|---|---|---|
| 首页 | `index.html` | 焦点区、通知公告、快捷服务、服务数据统计、办理流程、政策法规提示 |
| 会员信息 | `members.html` | 男/女嘉宾列表，按性别、年龄段、学历、关键词筛选，分页，详情弹窗（联系方式脱敏） |
| 登记报名 | `register.html` | 在线登记表单（含照片上传），提交后状态为「待审核」 |
| 服务指南 | `guide.html` | 办理流程、所需材料、审核标准、填写规范、常见问题 |
| 公告通知 | `notice.html` | 左侧公告列表 + 右侧正文，支持 `notice.html?id=xxx` 直达 |
| 关于我们 | `about.html` | 机构简介、服务职责、服务承诺、**个人信息保护声明**、监督投诉 |
| 后台管理 | `admin.html` | 工作人员登录（Supabase Auth）→ 数据看板 / 资料审核 / 公告管理 |

**隐私设计（重要）**

- 公开展示：性别、公开称呼、年龄、身高、学历、职业、现居地、婚况、自我介绍、择偶要求、照片
- 仅后台可见：真实姓名、完整手机号、微信号、户口、审核备注
- 公开列表中的手机号一律显示为 `138****0001`
- 数据库层面用行级安全策略（RLS）兜底：匿名用户**只能读到 `status='approved'` 的资料**，
  且**只能提交 `status='pending'`**，无法绕过审核直接把资料挂到前台

---

## 二、后端配置（Supabase，约 5 分钟）

### 1. 建库建表

新建 Supabase 项目 → **SQL Editor** → 新建查询 → 粘贴 `sql/schema.sql` 全文 → **Run**。
脚本会创建：

- 表 `profiles`（会员资料）、`notices`（公告）
- RLS 策略（公开只读已通过资料 / 匿名只能提交待审核资料 / 管理员全量读写）
- 存储桶 `member-photos`（公开可读、匿名可上传）

> 脚本同时插入了 10 条示例会员与 5 条示例公告，正式使用前可在表里删除。
> 建库后请把示例里的 `138****` 手机号、`某某` 姓名替换为真实登记数据。

### 2. 创建管理员账号

控制台 → **Authentication → Users → Add user**：
填写邮箱（如 `admin@example.com`）与密码，勾选 **Auto Confirm User**，保存。

这个账号用于登录 `admin.html`；**不要**把管理员密码写进前端代码。

### 3. 填写前端配置

打开 `js/config.js`，替换：

```js
SUPABASE_URL: 'https://xxxxxxxx.supabase.co',   // Project Settings → API → Project URL
SUPABASE_ANON_KEY: 'eyJhbGciOi...',             // Project Settings → API → anon public
```

> `anon key` 是设计上可公开的密钥，安全性由 RLS 策略保证。
> **绝对不要**把 `service_role` key 放进前端。
> 未配置时网站会自动进入「演示数据模式」，可以先看效果。

---

## 三、本地预览

因浏览器安全策略，直接双击打开 HTML 也能看，但建议用本地服务：

```bash
# 方式一：Python
python -m http.server 8080

# 方式二：Node
npx serve .

# 方式三：VS Code / Cursor 装 Live Server 插件，右键 index.html → Open with Live Server
```

然后访问 <http://localhost:8080>。

---

## 四、部署

### 方案 A：Vercel + GitHub（推荐）

```bash
git init
git add .
git commit -m "init: 婚恋服务平台"
git branch -M main
git remote add origin https://github.com/你的账号/仓库名.git
git push -u origin main
```

然后：<https://vercel.com> → **Add New → Project** → 选择该仓库 → Framework Preset 选 **Other** →
Build Command 留空、Output Directory 留空（纯静态）→ **Deploy**。
几十秒后得到 `https://xxx.vercel.app` 域名，后续 `git push` 会自动重新部署。

### 方案 B：Vercel CLI

```bash
npm i -g vercel
vercel login
vercel          # 预览部署
vercel --prod   # 正式部署
```

### 方案 C：Netlify / GitHub Pages

把整个文件夹拖到 <https://app.netlify.com/drop> 即可；
GitHub Pages 则在仓库 **Settings → Pages** 选择 `main` 分支根目录。

> 部署后记得在 `js/config.js` 里把配置改好再提交（或者本地构建时注入）。
> 页面里的备案号、主办单位、电话等占位信息都在 `js/config.js` 与 `about.html` / 各页脚中，请替换为真实信息。

---

## 五、目录结构

```
├─ index.html            首页
├─ members.html          会员信息（男/女嘉宾列表）
├─ register.html         登记报名
├─ guide.html            服务指南
├─ notice.html           公告通知
├─ about.html            关于我们 / 个人信息保护声明
├─ admin.html            后台管理（需登录）
├─ css/
│  └─ style.css          全站样式（政务风格）
├─ js/
│  ├─ config.js          ★ 站点信息 + Supabase 配置（改这里）
│  ├─ common.js          站点框架渲染、Supabase 客户端、数据访问层、工具函数
│  ├─ home.js            首页公告与统计
│  ├─ members.js         列表筛选 / 分页 / 详情弹窗
│  ├─ register.js        登记表单校验与提交
│  ├─ notice.js          公告列表与正文
│  └─ admin.js           后台登录、审核、公告管理、CSV 导出
├─ sql/
│  └─ schema.sql         ★ 建表 + RLS + 示例数据（在 Supabase 执行）
└─ README.md
```

---

## 六、日常操作说明

**审核资料（后台）**：`admin.html` 登录 → 资料审核 → 可按状态/性别/关键词筛选 →
「查看」看完整资料（含真实姓名、手机号、照片）→「通过 / 驳回（填原因）/ 隐藏 / 删除」，
支持一键导出 CSV（Excel 可直接打开，已处理中文编码）。

**发布公告**：后台 → 公告管理 → 填写标题、正文（换行自动分段）、勾选置顶 → 发布。

**关闭某会员展示**：不删除数据，用「隐藏」即可（`status='hidden'`，前台不再展示）。

**修改站点名称/电话/备案号**：改 `js/config.js`，全站页头页脚统一生效。

---

## 七、界面样式与字体说明

全站视觉集中在 `css/style.css`，顶部 `:root` 里改这几个变量即可整体换色：

```css
--blue: #1462a8;    /* 主色：藏蓝（导航、按钮、链接） */
--blue-deep: #0b3c66;/* 深色：页脚、表头 */
--gold: #b9975b;    /* 点缀：标题装饰线、下拉菜单顶边 */
--red: #b32530;     /* 强调：服务热线、重要提示、跌色 */
```

**字体**：标题（站名、banner 大标题、页面标题、文章标题）用**思源宋体**（Noto Serif SC），
正文用微软雅黑 / 苹方等系统无衬线字体，正文与标题形成明显层次。

思源宋体通过 jsDelivr 上的 `@fontsource/noto-serif-sc` 按 Unicode 分片加载，
浏览器**只下载页面实际用到的字形分片**，其余自动回退到系统宋体。

> 如果你不想依赖外部字体，把每个 HTML 里这两行删掉即可，标题会自动回退到
> 系统宋体（SimSun / Songti SC），排版不变：
>
> ```html
> <link rel="preconnect" href="https://cdn.jsdelivr.net" crossorigin />
> <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fontsource/noto-serif-sc@5/700.css" />
> ```
>
> 若想彻底离线自托管，可用 `npm i @fontsource/noto-serif-sc` 把字体文件拷到
> 项目里，再把上面的链接换成本地路径。

---

## 八、上线前的合规提醒（建议逐条落实）

1. **主体与资质**：婚介服务涉及个人信息与经营活动，建议以工会、妇联、街道等公信主体或已备案的婚介机构名义运营，页脚如实填写主办/承办单位与备案信息。
2. **个人信息保护**：按《个人信息保护法》做到「告知—同意—最小必要—目的限定」；本站在登记页已设勾选授权，请保留该流程。建议再补充《用户服务协议》与《隐私政策》独立页面。
3. **实名与真实性**：现场核验身份证时只查验不留存复印件；离异状况核验相关法律文书。
4. **内容安全**：建议在后台审核环节增加违规词检查，驳回含敏感、低俗、广告内容的资料。
5. **防诈骗**：站内已设置「不索取银行卡号与验证码」提示；如发现冒用平台名义行骗，及时报警并公示处理结果。
6. **数据留痕与安全**：管理员账号一人一号，不共用；定期在 Supabase 后台查看登录与操作记录；离职人员及时删除管理员账号。
7. **接口域名**：若在正式域名下使用 Supabase 存储的图片，无需额外白名单（浏览器直连），但若添加自定义域名/CDN，注意 HTTPS 证书。
