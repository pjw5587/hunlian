/**
 * 全站配置（改这一个文件即可切换站点信息与 Supabase 后端）
 * ------------------------------------------------------------
 * 1) 把 SUPABASE_URL / SUPABASE_ANON_KEY 换成你自己项目的值
 *    位置：Supabase 控制台 → Project Settings → API
 * 2) anon key 是"可公开"的密钥，安全性由 Supabase 的 RLS 策略保证
 *    （见 sql/schema.sql）。千万不要把 service_role key 放到前端。
 */
window.SITE_CONFIG = {
  // ---------- 站点信息（按需修改） ----------
  SITE_NAME: 'XX市婚恋服务中心',
  SITE_SUBTITLE: '婚恋信息服务平台 · 实名登记 · 资料审核',
  SITE_SHORT: '婚恋服务中心',
  HOST_ORG: 'XX市总工会　XX市妇女联合会（示例）',   // 主办单位
  RUN_ORG: 'XX市婚恋服务中心（示例）',               // 承办单位
  ICP: '京ICP备00000000号-1（示例）',                 // 备案号
  POLICE_ICP: '京公网安备00000000000000号（示例）',
  TEL: '0000-00000000',
  EMAIL: 'service@example.com',
  ADDRESS: 'XX市XX区XX路XX号　市政务服务中心 3 楼 306 室',
  WORK_TIME: '周一至周五 9:00-17:00（法定节假日除外）',

  // ---------- Supabase ----------
  SUPABASE_URL: 'https://your-project-id.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_SUPABASE_ANON_KEY',
  PHOTO_BUCKET: 'member-photos',

  // ---------- 业务参数 ----------
  PAGE_SIZE: 12,                                     // 会员列表每页条数
  DEMO_FALLBACK: true                                // 未配置 Supabase 时展示示例数据
};
