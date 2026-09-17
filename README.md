# 校园猫猫档案社区

这是一个无需构建工具的静态网站，打开 `index.html` 即可使用。

## 已实现

- 新增、编辑、删除猫猫档案
- 猫猫性别字段、健康状态、性格、地点、留言和照片
- 搜索、性别筛选、我的收藏
- 按收藏次数生成猫猫社区排行榜
- 本地 `localStorage` 自动保存，电脑关机后数据仍在本机浏览器中
- 手机端适配

## 让网站关机后仍能访问

把整个文件夹发布到 GitHub Pages、Cloudflare Pages 或 Netlify。它们是免费静态托管，网站不依赖你的电脑开机。GitHub Pages 最简单：新建 GitHub 仓库，把这些文件上传到 `main` 分支，在仓库 Settings > Pages 选择 GitHub Actions 或 `main` 分支部署。

## 让同学免费上传并共享数据

静态网页本身不能安全地长期接收多人数据，需要一个免费云数据库。推荐 Supabase 免费层：

1. 注册 Supabase，新建项目。
2. 建立 `cats` 表，字段：`id`、`name`、`pinyin`、`location`、`gender`、`personality`、`status`、`note`、`image`、`created_at`。
3. 建立公开 Storage bucket `cat-photos`，允许匿名上传和读取；按 Supabase 文档配置 RLS 策略。
4. 把项目 URL 和 anon public key 写入 `supabase-config.js` 的 `url` 和 `anonKey`。
5. 将更新后的文件重新推送到 GitHub Pages。

注意：不要把 `service_role` 密钥放进前端；前端只能使用 anon public key。公开匿名写入意味着任何人都可以提交内容，正式使用时建议增加登录、审核或 Turnstile 防滥用。

当前这份静态版本默认是本机模式，因此无需任何账号就能完整体验增删改查和榜单；配置 Supabase 后再变为同学共享模式。

要统计全体同学的真实收藏次数，建议在 Supabase 增加 `cat_favorites(cat_id, visitor_id)` 表，并用匿名会话或登录用户作为 `visitor_id`；当前前端榜单在云端模式下仍是每位访客自己的收藏榜，避免公开接口被随意改写。
