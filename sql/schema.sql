-- ============================================================================
--  政务风格婚恋服务平台 · Supabase 建表脚本
--  用法：Supabase 控制台 → SQL Editor → 新建查询 → 粘贴全文 → Run
--  说明：脚本可重复执行（建表/策略均做了存在性判断），示例数据会重复插入，
--        如需重复执行请先删除示例数据部分。
-- ============================================================================

-- 扩展：生成 uuid（Supabase 默认已启用 pgcrypto）
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. 会员资料表 profiles
--    公开端只能读 status='approved'（RLS 控制）；完整资料仅登录的管理员可见
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key default gen_random_uuid(),
  code          text,                          -- 会员编号，如 M260001 / F260001
  gender        text not null check (gender in ('male','female')),
  name          text,                          -- 真实姓名（仅后台可见）
  display_name  text,                          -- 公开称呼，如 王先生
  birth_year    int,
  height        int,
  weight        int,
  education     text,
  occupation    text,
  industry      text,
  income        text,
  city          text,
  district      text,
  hukou         text,
  marital_status text,                         -- 未婚 / 离异 / 丧偶
  has_children  text,
  housing       text,
  car           text,
  phone         text,                          -- 完整手机号（仅后台可见）
  wechat        text,                          -- 微信号（仅后台可见）
  self_intro    text,
  mate_expect   text,
  photo_url     text,
  status        text not null default 'pending' check (status in ('pending','approved','rejected','hidden')),
  source        text default 'web',
  audit_note    text,                          -- 审核备注 / 驳回原因
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_profiles_status_created on public.profiles (status, created_at desc);
create index if not exists idx_profiles_gender on public.profiles (gender);

-- ----------------------------------------------------------------------------
-- 2. 公告通知表 notices
-- ----------------------------------------------------------------------------
create table if not exists public.notices (
  id           uuid primary key default gen_random_uuid(),
  category     text default '公告',             -- 公告 / 提示 / 活动
  title        text not null,
  content      text not null,
  is_top       boolean not null default false,
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists idx_notices_published on public.notices (is_top desc, published_at desc);

-- ----------------------------------------------------------------------------
-- 3. 行级安全策略（RLS）
--    公开（anon）：
--      · profiles 只能读 status='approved'，只能插入 status='pending'（避免绕过审核）
--      · notices 可读全部
--    管理员（authenticated，用 Supabase Auth 邮箱账号登录）：
--      · profiles / notices 全部读写
-- ----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.notices  enable row level security;

drop policy if exists "public read approved profiles" on public.profiles;
create policy "public read approved profiles"
  on public.profiles for select
  to anon
  using (status = 'approved');

drop policy if exists "public submit profile" on public.profiles;
create policy "public submit profile"
  on public.profiles for insert
  to anon
  with check (status = 'pending');

drop policy if exists "admin all profiles" on public.profiles;
create policy "admin all profiles"
  on public.profiles for all
  to authenticated
  using (true)
  with check (true);

drop policy if exists "public read notices" on public.notices;
create policy "public read notices"
  on public.notices for select
  to anon, authenticated
  using (true);

drop policy if exists "admin all notices" on public.notices;
create policy "admin all notices"
  on public.notices for all
  to authenticated
  using (true)
  with check (true);

-- ----------------------------------------------------------------------------
-- 4. 照片存储桶 member-photos
--    公开可读（<img> 展示需要）；匿名可上传（登记时上传照片）；管理员可管理
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('member-photos', 'member-photos', true)
on conflict (id) do update set public = true;

drop policy if exists "member photos public read" on storage.objects;
create policy "member photos public read"
  on storage.objects for select
  using (bucket_id = 'member-photos');

drop policy if exists "member photos anon upload" on storage.objects;
create policy "member photos anon upload"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'member-photos');

drop policy if exists "member photos admin manage" on storage.objects;
create policy "member photos admin manage"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'member-photos')
  with check (bucket_id = 'member-photos');

-- ============================================================================
--  5. 示例数据（首次初始化用；正式环境可删除或替换）
--    执行后请到 Authentication → Users 添加管理员账号（邮箱 + 密码）
-- ============================================================================
insert into public.profiles
  (code, gender, name, display_name, birth_year, height, education, occupation, income,
   city, district, marital_status, has_children, housing, car, phone, wechat,
   self_intro, mate_expect, status, created_at)
values
  ('M260001','male','王某某','王先生',1991,178,'硕士','软件工程师','20-50万 / 年',
   '本市','高新区','未婚','无子女','有房','有车','13800001001','wang_01',
   '性格稳重，工作稳定，喜欢运动和阅读，希望遇到可以长期相处的另一半。',
   '年龄相仿，性格温和，有稳定工作，愿在本地长期发展。','approved', now() - interval '26 days'),
  ('M260002','male','李某某','李先生',1988,175,'本科','公务员','10-20万 / 年',
   '本市','政务区','未婚','无子女','有房','有车','13800001002','li_88',
   '工作规律，待人真诚，爱好摄影和徒步。','善良体贴，能共同经营家庭。','approved', now() - interval '23 days'),
  ('M260003','male','张某某','张先生',1993,180,'本科','中学教师','5-10万 / 年',
   '本市','城关区','未婚','无子女','有房','无车','13800001003','zhang_t',
   '喜欢运动、旅行，作息规律，为人踏实。','本科以上学历，性格开朗。','approved', now() - interval '17 days'),
  ('M260004','male','赵某某','赵先生',1985,172,'本科','企业主管','20-50万 / 年',
   '本市','经开区','离异','有子女，不随本人生活','有房','有车','13800001004','zhao_85',
   '性格成熟，工作负责，喜欢下厨和跑步。','能相互理解、性格稳定。','approved', now() - interval '11 days'),
  ('F260001','female','刘某某','刘女士',1993,165,'本科','会计师','10-20万 / 年',
   '本市','高新区','未婚','无子女','有房','无车','13900002001','liu_93',
   '性格温和，喜欢烘焙和看书，希望能遇到三观契合的人。','为人真诚，有责任心，工作稳定。','approved', now() - interval '25 days'),
  ('F260002','female','陈某某','陈女士',1995,162,'硕士','医生','20-50万 / 年',
   '本市','政务区','未婚','无子女','无房','有车','13900002002','chen_95',
   '工作较忙但生活有条理，喜欢健身和旅行。','本科及以上，成熟稳重，尊重彼此工作。','approved', now() - interval '19 days'),
  ('F260003','female','杨某某','杨女士',1990,163,'本科','人力资源专员','10-20万 / 年',
   '本市','城关区','未婚','无子女','有房','有车','13900002003','yang_90',
   '开朗热情，喜欢音乐和美食，生活规律。','性格开朗，有家庭责任感。','approved', now() - interval '15 days'),
  ('F260004','female','周某某','周女士',1992,168,'硕士','设计师','20-50万 / 年',
   '本市','经开区','未婚','无子女','有房','无车','13900002004','zhou_92',
   '审美在线，安静温和，喜欢阅读和布置家居。','有共同爱好，谈得来最重要。','approved', now() - interval '9 days'),
  ('M260005','male','孙某某','孙先生',1996,176,'本科','财务人员','5-10万 / 年',
   '本市','城关区','未婚','无子女','有房','有车','13800001005','sun_96',
   '性格随和，喜欢羽毛球和电影。','善良，能相互体谅。','pending', now() - interval '2 days'),
  ('F260005','female','吴某某','吴女士',1994,160,'本科','幼师','5-10万 / 年',
   '本市','高新区','未婚','无子女','无房','无车','13900002005','wu_94',
   '喜欢小孩，性格温和有耐心。','成熟稳重，顾家。','pending', now() - interval '1 days');

insert into public.notices (category, title, content, is_top, published_at)
values
  ('公告','关于开展2026年下半年相亲联谊活动的通知',
   '为服务广大单身青年婚恋需求，千缘婚恋服务中心拟于10月下旬举办“缘定金秋”相亲联谊活动，即日起开始报名。
报名条件：本平台已完成实名登记并通过审核的会员。
报名方式：致电服务热线或到服务大厅现场登记。
活动名额120人，报满即止。', true, now() - interval '11 days'),
  ('公告','关于会员资料审核时限的说明',
   '会员在线提交资料后，工作人员将在3个工作日内完成审核。
审核内容包括：信息完整性、真实性核验。
审核通过后，除真实姓名、完整手机号、微信号以外的资料将在平台公开展示。', false, now() - interval '18 days'),
  ('提示','防骗提示：警惕以婚恋名义的诈骗行为',
   '本平台不向会员收取任何费用，工作人员不会以任何理由要求转账。
请勿向陌生人转账、投资，涉及钱财一律谨慎核实。
如遇可疑情况，请立即致电服务热线举报。', true, now() - interval '26 days'),
  ('公告','会员信息填写规范（避免审核不通过）',
   '一、姓名、手机号须真实有效；
二、出生年份、身高、学历、职业为必填项；
三、自我介绍不少于30字，择偶要求请具体明确；
四、照片建议使用近期生活照，避免模糊、遮挡或过度修图。', false, now() - interval '4 days'),
  ('公告','服务大厅窗口调整公告',
   '自9月起，婚恋服务窗口调整为每周二、周四全天受理现场登记与资料核验，其他时间可通过本站线上提交。
给您带来的不便敬请谅解。', false, now() - interval '8 days');

-- ============================================================================
--  6. 管理员账号
--  不要用 SQL 直接插入管理员（密码需要 Auth 加密）。请使用控制台：
--     Authentication → Users → Add user → 填写邮箱与密码 → 勾选 Auto Confirm
--  然后用该邮箱 + 密码在 /admin.html 登录，即可查看与审核全部资料。
-- ============================================================================
