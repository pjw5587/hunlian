/* ==========================================================================
   公共脚本：站点框架渲染 + Supabase 数据访问 + 通用工具
   依赖：js/config.js、@supabase/supabase-js（通过 <script> 引入）
   ========================================================================== */
(function () {
  'use strict';

  var CFG = window.SITE_CONFIG || {};
  window.CFG = CFG;

  /* ------------------------------------------------------------------
     一、Supabase 客户端
     ------------------------------------------------------------------ */
  var _client = null;

  window.isConfigured = function () {
    return !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY &&
      CFG.SUPABASE_URL.indexOf('your-project-id') === -1 &&
      CFG.SUPABASE_ANON_KEY.indexOf('YOUR_SUPABASE') === -1);
  };

  window.getSb = function () {
    if (!window.isConfigured()) return null;
    if (!_client) {
      if (!window.supabase || !window.supabase.createClient) {
        console.error('[supabase] SDK 未加载，请检查 CDN 引用');
        return null;
      }
      _client = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
    }
    return _client;
  };

  /* ------------------------------------------------------------------
     二、通用工具
     ------------------------------------------------------------------ */
  window.esc = function (s) {
    if (s === null || s === undefined) return '';
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  window.maskPhone = function (p) {
    if (!p) return '—';
    var s = String(p);
    if (s.length < 7) return s.replace(/.(?=.)/g, '*');
    return s.slice(0, 3) + '****' + s.slice(-4);
  };

  window.fmtDate = function (v) {
    if (!v) return '—';
    var d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };

  window.fmtDateTime = function (v) {
    if (!v) return '—';
    var d = new Date(v);
    if (isNaN(d.getTime())) return String(v);
    var p = function (n) { return n < 10 ? '0' + n : '' + n; };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) +
      ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
  };

  window.ageOf = function (birthYear) {
    if (!birthYear) return '—';
    var y = parseInt(birthYear, 10);
    if (!y || y < 1930) return '—';
    var a = new Date().getFullYear() - y;
    return a > 0 ? a : '—';
  };

  window.genderText = function (g) {
    if (g === 'male' || g === '男' || g === 1) return '男';
    if (g === 'female' || g === '女' || g === 2) return '女';
    return '—';
  };

  window.statusText = function (s) {
    return ({ pending: '待审核', approved: '已通过', rejected: '已驳回', hidden: '已隐藏' })[s] || '待审核';
  };

  window.statusClass = function (s) {
    return ({ pending: 'tag-orange', approved: 'tag-green', rejected: 'tag-red', hidden: 'tag-grey' })[s] || 'tag-grey';
  };

  window.getQuery = function (name) {
    var m = new RegExp('[?&]' + name + '=([^&#]*)').exec(window.location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  };

  window.showToast = function (msg, type) {
    var box = document.getElementById('toast-box');
    if (!box) {
      box = document.createElement('div');
      box.id = 'toast-box';
      document.body.appendChild(box);
    }
    var el = document.createElement('div');
    el.className = 'toast ' + (type || '');
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(function () { el.remove(); }, 3200);
  };

  /* ------------------------------------------------------------------
     三、站点框架（顶部条 / 页头 / 导航 / 页脚）
     ------------------------------------------------------------------ */
  var NAV = [
    { key: 'home', text: '首页', href: 'index.html' },
    {
      key: 'members', text: '会员信息', href: 'members.html',
      children: [
        { text: '男嘉宾', href: 'members.html?gender=male' },
        { text: '女嘉宾', href: 'members.html?gender=female' },
        { text: '全部会员', href: 'members.html?gender=all' }
      ]
    },
    { key: 'register', text: '登记报名', href: 'register.html' },
    { key: 'guide', text: '服务指南', href: 'guide.html' },
    { key: 'notice', text: '公告通知', href: 'notice.html' },
    { key: 'about', text: '关于我们', href: 'about.html' },
    { key: 'admin', text: '后台管理', href: 'admin.html' }
  ];

  function fontClass() {
    var v = localStorage.getItem('site-font') || 'normal';
    document.documentElement.classList.remove('font-small', 'font-large');
    if (v === 'small') document.documentElement.classList.add('font-small');
    if (v === 'large') document.documentElement.classList.add('font-large');
    return v;
  }

  function bindFontSwitch() {
    var cur = fontClass();
    var box = document.querySelector('.font-switch');
    if (!box) return;
    [].forEach.call(box.querySelectorAll('button'), function (b) {
      if (b.dataset.size === cur) b.classList.add('active');
      b.onclick = function () {
        localStorage.setItem('site-font', b.dataset.size);
        bindFontSwitch();
      };
    });
  }

  window.renderTopbar = function () {
    var host = document.getElementById('site-topbar');
    if (!host) return;
    host.className = 'topbar';
    host.innerHTML =
      '<div class="wrap">' +
      '  <div class="topbar-left"><span class="flag"></span>欢迎访问' + esc(CFG.SITE_NAME) + '　|　' + esc(CFG.SITE_SUBTITLE) + '</div>' +
      '  <div class="topbar-right">' +
      '    <span class="font-switch">字号：' +
      '      <button type="button" data-size="small">小</button>' +
      '      <button type="button" data-size="normal">中</button>' +
      '      <button type="button" data-size="large">大</button>' +
      '    </span>' +
      '    <a href="guide.html">办事指南</a>' +
      '    <a href="admin.html">管理入口</a>' +
      '  </div>' +
      '</div>';
    bindFontSwitch();
  };

  window.renderHeader = function (activeKey) {
    var host = document.getElementById('site-header');
    if (!host) return;
    var navHtml = NAV.map(function (item) {
      var active = item.key === activeKey ? ' active' : '';
      if (!item.children) {
        return '<a class="nav-item' + active + '" href="' + item.href + '">' + esc(item.text) + '</a>';
      }
      var sub = item.children.map(function (c) {
        return '<a href="' + c.href + '">' + esc(c.text) + '</a>';
      }).join('');
      return '<div class="nav-drop">' +
        '<a class="nav-item' + active + '" href="' + item.href + '">' + esc(item.text) + '</a>' +
        '<div class="nav-drop-menu">' + sub + '</div>' +
        '</div>';
    }).join('');

    host.innerHTML =
      '<div class="site-header">' +
      '  <div class="wrap">' +
      '    <div class="brand">' +
      '      <div class="brand-mark"><strong>千缘</strong>婚恋</div>' +
      '      <div class="brand-text">' +
      '        <h1>' + esc(CFG.SITE_NAME) + '</h1>' +
      '        <p>' + esc(CFG.SITE_SUBTITLE) + '</p>' +
      '      </div>' +
      '    </div>' +
      '    <div class="header-search">' +
      '      <form class="search-form" onsubmit="return window.__doSearch(event)">' +
      '        <input type="text" name="q" placeholder="搜索会员编号 / 职业 / 城市" aria-label="站内搜索" />' +
      '        <button type="submit">搜索</button>' +
      '      </form>' +
      '      <div class="header-tel"><span>服务热线</span><strong>' + esc(CFG.TEL) + '</strong></div>' +
      '    </div>' +
      '  </div>' +
      '</div>' +
      '<nav class="main-nav" aria-label="主导航">' +
      '  <div class="wrap">' +
      '    <button type="button" class="nav-toggle" id="nav-toggle" aria-expanded="false" aria-controls="nav-list">' +
      '      <span class="nav-toggle-bars"><i></i><i></i><i></i></span>' +
      '      <span class="nav-toggle-text">栏目导航</span>' +
      '    </button>' +
      '    <div class="nav-list" id="nav-list">' + navHtml + '</div>' +
      '  </div>' +
      '</nav>';

    bindNavToggle();

    // 演示模式提示
    if (!window.isConfigured() && CFG.DEMO_FALLBACK) {
      var bar = document.createElement('div');
      bar.className = 'demo-bar';
      bar.textContent = '当前为演示数据模式：请在 js/config.js 中填入 Supabase 项目地址与 anon key，即可读取真实数据。';
      host.parentNode.insertBefore(bar, host);
    }
  };

  /* 移动端：导航折叠开关 */
  function bindNavToggle() {
    var tgl = document.getElementById('nav-toggle');
    var nav = tgl && tgl.closest ? tgl.closest('.main-nav') : null;
    if (!tgl || !nav) return;

    var setOpen = function (open) {
      nav.classList.toggle('nav-open', open);
      tgl.setAttribute('aria-expanded', open ? 'true' : 'false');
    };

    tgl.addEventListener('click', function (e) {
      e.stopPropagation();
      setOpen(!nav.classList.contains('nav-open'));
    });

    // 点击菜单内链接后收起
    nav.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('a.nav-item')) setOpen(false);
    });

    // 点击页面其它区域收起
    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('nav-open')) return;
      if (!nav.contains(e.target)) setOpen(false);
    });

    // 回到宽屏时复位
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900) setOpen(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setOpen(false);
    });
  }

  window.renderFooter = function () {
    var host = document.getElementById('site-footer');
    if (!host) return;
    host.className = 'site-footer';
    var links = [
      ['中国政府网', 'http://www.gov.cn'], ['中国民政部', 'https://www.mca.gov.cn'],
      ['全国妇联', 'https://www.women.org.cn'], ['中国社会组织政务服务平台', 'https://chinanpo.mca.gov.cn'],
      ['本站办事指南', 'guide.html'], ['隐私保护声明', 'about.html#privacy']
    ].map(function (l) { return '<a href="' + l[1] + '" rel="noopener" target="_blank">' + l[0] + '</a>'; }).join('');

    host.innerHTML =
      '<div class="footer-links"><div class="wrap">' + links + '</div></div>' +
      '<div class="footer-main"><div class="wrap">' +
      '  <div>' +
      '    <h4>服务单位</h4>' +
      '    <p>单位名称：' + esc(CFG.HOST_ORG) + '</p>' +
      '    <p>办公地址：' + esc(CFG.ADDRESS) + '</p>' +
      '    <p>办公时间：' + esc(CFG.WORK_TIME) + '</p>' +
      '  </div>' +
      '  <div>' +
      '    <h4>联系我们</h4>' +
      '    <p>咨询电话：<a href="tel:' + esc(CFG.TEL) + '">' + esc(CFG.TEL) + '</a></p>' +
      '    <p>电子邮箱：' + esc(CFG.EMAIL) + '</p>' +
      '    <p>现场受理：每周二、周四全天</p>' +
      '  </div>' +
      '  <div>' +
      '    <h4>服务承诺</h4>' +
      '    <p>实名登记 · 资料审核 · 信息脱敏展示</p>' +
      '    <p>所有会员联系方式仅审核人员可查看</p>' +
      '    <p>会员资料统一编号建档，独立管理可溯源</p>' +
      '  </div>' +
      '</div></div>' +
      '<div class="footer-bottom">' +
      '  <div class="wrap">' +
      '    ' + esc(CFG.ICP) + '　|　' + esc(CFG.POLICE_ICP) + '　|　技术支持：' + esc(CFG.RUN_ORG) + '<br>' +
      '    本平台信息由会员本人提供并承诺真实，如有虚假信息请致电 ' + esc(CFG.TEL) + ' 举报' +
      '  </div>' +
      '</div>';
  };

  window.__doSearch = function (e) {
    if (e && e.preventDefault) e.preventDefault();
    var q = (document.querySelector('.search-form input') || {}).value || '';
    window.location.href = 'members.html?gender=all&q=' + encodeURIComponent(q.trim());
    return false;
  };

  window.renderShell = function (activeKey) {
    window.renderTopbar();
    window.renderHeader(activeKey || '');
    window.renderFooter();
  };

  /* ------------------------------------------------------------------
     四、演示数据（未配置 Supabase 时使用，方便先看效果）
     ------------------------------------------------------------------ */
  window.DEMO = {
    profiles: [
      { id: 'd1', code: 'M260001', gender: 'male', display_name: '王先生', birth_year: 1991, height: 178, education: '硕士', occupation: '软件工程师', city: '本市', district: '高新区', marital_status: '未婚', housing: '有房', car: '有车', phone: '13800001001', wechat: 'wang_01', self_intro: '性格稳重，工作稳定，喜欢运动和阅读，希望遇到可以长期相处的另一半。', mate_expect: '年龄相仿，性格温和，有稳定工作，愿在本地长期发展。', status: 'approved', created_at: '2026-08-11T09:20:00Z' },
      { id: 'd2', code: 'M260002', gender: 'male', display_name: '李先生', birth_year: 1988, height: 175, education: '本科', occupation: '公务员', city: '本市', district: '政务区', marital_status: '未婚', housing: '有房', car: '有车', phone: '13800001002', wechat: 'li_88', self_intro: '工作规律，待人真诚，爱好摄影和徒步。', mate_expect: '善良体贴，能共同经营家庭。', status: 'approved', created_at: '2026-08-14T10:05:00Z' },
      { id: 'd3', code: 'M260003', gender: 'male', display_name: '张先生', birth_year: 1993, height: 180, education: '本科', occupation: '中学教师', city: '本市', district: '城关区', marital_status: '未婚', housing: '有房', car: '无车', phone: '13800001003', wechat: 'zhang_t', self_intro: '喜欢运动、旅行，作息规律，为人踏实。', mate_expect: '本科以上学历，性格开朗。', status: 'approved', created_at: '2026-08-20T14:30:00Z' },
      { id: 'd4', code: 'M260004', gender: 'male', display_name: '赵先生', birth_year: 1985, height: 172, education: '本科', occupation: '企业主管', city: '本市', district: '经开区', marital_status: '离异', housing: '有房', car: '有车', phone: '13800001004', wechat: 'zhao_85', self_intro: '性格成熟，工作负责，喜欢下厨和跑步。', mate_expect: '能相互理解、性格稳定。', status: 'approved', created_at: '2026-08-26T08:40:00Z' },
      { id: 'd5', code: 'F260001', gender: 'female', display_name: '刘女士', birth_year: 1993, height: 165, education: '本科', occupation: '会计师', city: '本市', district: '高新区', marital_status: '未婚', housing: '有房', car: '无车', phone: '13900002001', wechat: 'liu_93', self_intro: '性格温和，喜欢烘焙和看书，希望能遇到三观契合的人。', mate_expect: '为人真诚，有责任心，工作稳定。', status: 'approved', created_at: '2026-08-12T11:15:00Z' },
      { id: 'd6', code: 'F260002', gender: 'female', display_name: '陈女士', birth_year: 1995, height: 162, education: '硕士', occupation: '医生', city: '本市', district: '政务区', marital_status: '未婚', housing: '无房', car: '有车', phone: '13900002002', wechat: 'chen_95', self_intro: '工作较忙但生活有条理，喜欢健身和旅行。', mate_expect: '本科及以上，成熟稳重，尊重彼此工作。', status: 'approved', created_at: '2026-08-18T16:20:00Z' },
      { id: 'd7', code: 'F260003', gender: 'female', display_name: '杨女士', birth_year: 1990, height: 163, education: '本科', occupation: '人力资源专员', city: '本市', district: '城关区', marital_status: '未婚', housing: '有房', car: '有车', phone: '13900002003', wechat: 'yang_90', self_intro: '开朗热情，喜欢音乐和美食，生活规律。', mate_expect: '性格开朗，有家庭责任感。', status: 'approved', created_at: '2026-08-22T09:05:00Z' },
      { id: 'd8', code: 'F260004', gender: 'female', display_name: '周女士', birth_year: 1992, height: 168, education: '硕士', occupation: '设计师', city: '本市', district: '经开区', marital_status: '未婚', housing: '有房', car: '无车', phone: '13900002004', wechat: 'zhou_92', self_intro: '审美在线，安静温和，喜欢阅读和布置家居。', mate_expect: '有共同爱好，谈得来最重要。', status: 'approved', created_at: '2026-08-28T13:45:00Z' },
      { id: 'd9', code: 'M260005', gender: 'male', display_name: '孙先生', birth_year: 1996, height: 176, education: '本科', occupation: '财务人员', city: '本市', district: '城关区', marital_status: '未婚', housing: '有房', car: '有车', phone: '13800001005', wechat: 'sun_96', self_intro: '性格随和，喜欢羽毛球和电影。', mate_expect: '善良，能相互体谅。', status: 'pending', created_at: '2026-09-28T10:10:00Z' },
      { id: 'd10', code: 'F260005', gender: 'female', display_name: '吴女士', birth_year: 1994, height: 160, education: '本科', occupation: '幼师', city: '本市', district: '高新区', marital_status: '未婚', housing: '无房', car: '无车', phone: '13900002005', wechat: 'wu_94', self_intro: '喜欢小孩，性格温和有耐心。', mate_expect: '成熟稳重，顾家。', status: 'pending', created_at: '2026-09-30T15:00:00Z' }
    ],
    notices: [
      { id: 'n1', category: '公告', title: '关于开展2026年下半年相亲联谊活动的通知', content: '为服务广大单身青年婚恋需求，千缘婚恋服务中心拟于10月下旬举办“缘定金秋”相亲联谊活动，即日起开始报名。报名条件：本平台已完成实名登记并通过审核的会员；报名方式：致电服务热线或到服务大厅现场登记；活动名额120人，报满即止。', is_top: true, published_at: '2026-09-25T09:00:00Z' },
      { id: 'n2', category: '公告', title: '关于会员资料审核时限的说明', content: '会员在线提交资料后，工作人员将在3个工作日内完成审核。审核内容包括：信息完整性、真实性核验。审核通过后，联系方式以外的资料将在平台公开展示。', is_top: false, published_at: '2026-09-18T10:30:00Z' },
      { id: 'n3', category: '提示', title: '防骗提示：警惕以婚恋名义的诈骗行为', content: '本平台不向会员收取任何费用，工作人员不会以任何理由要求转账。请勿向陌生人转账、投资，涉及钱财一律谨慎核实。如遇可疑情况，请立即致电服务热线举报。', is_top: true, published_at: '2026-09-10T14:00:00Z' },
      { id: 'n4', category: '公告', title: '会员信息填写规范（避免审核不通过）', content: '一、姓名、手机号须真实有效；二、出生年份、身高、学历、职业为必填项；三、自我介绍不少于30字，择偶要求请具体明确；四、照片建议使用近期生活照，避免使用模糊、遮挡或过度修图照片。', is_top: false, published_at: '2026-09-02T11:20:00Z' },
      { id: 'n5', category: '公告', title: '服务大厅窗口调整公告', content: '自9月起，婚恋服务窗口调整为每周二、周四全天受理现场登记与资料核验，其他时间可通过本站线上提交。给您带来的不便敬请谅解。', is_top: false, published_at: '2026-08-29T09:40:00Z' }
    ]
  };

  /* ------------------------------------------------------------------
     五、数据访问层
     公开端（未登录）：只能读到 status = 'approved' 的会员（RLS 保证）
     管理端（Supabase Auth 登录后）：可读写全部数据
     ------------------------------------------------------------------ */
  var DATA_COLS = 'id,code,gender,display_name,birth_year,height,education,occupation,city,district,marital_status,housing,car,phone,wechat,self_intro,mate_expect,photo_url,status,created_at';

  window.Data = {
    /* 会员列表（公开） */
    listMembers: function (opt) {
      opt = opt || {};
      var sb = window.getSb();
      var page = opt.page || 1;
      var size = opt.pageSize || CFG.PAGE_SIZE || 12;

      if (!sb) return Promise.resolve(demoList(opt));

      var q = sb.from('profiles').select(DATA_COLS, { count: 'exact' }).eq('status', 'approved');
      if (opt.gender && opt.gender !== 'all') q = q.eq('gender', opt.gender);
      if (opt.education) q = q.eq('education', opt.education);
      // 年龄 → 出生年份 换算：年龄越大，出生年份越小
      var THIS_YEAR = new Date().getFullYear();
      if (opt.ageMin) q = q.lte('birth_year', THIS_YEAR - opt.ageMin);
      if (opt.ageMax) q = q.gte('birth_year', THIS_YEAR - opt.ageMax);
      if (opt.q) {
        var kw = '%' + opt.q + '%';
        q = q.or('code.ilike.' + kw + ',occupation.ilike.' + kw + ',city.ilike.' + kw + ',display_name.ilike.' + kw);
      }
      q = q.order('created_at', { ascending: false })
        .range((page - 1) * size, page * size - 1);

      return q.then(function (r) {
        if (r.error) throw r.error;
        return { list: r.data || [], total: r.count || 0, demo: false };
      });
    },

    /* 首页统计（公开，仅统计已通过数量） */
    getStats: function () {
      var sb = window.getSb();
      if (!sb) {
        var a = DEMO.profiles;
        return Promise.resolve({
          total: a.filter(function (p) { return p.status === 'approved'; }).length,
          male: a.filter(function (p) { return p.status === 'approved' && p.gender === 'male'; }).length,
          female: a.filter(function (p) { return p.status === 'approved' && p.gender === 'female'; }).length,
          demo: true
        });
      }
      var cnt = function (g) {
        var q = sb.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved');
        if (g) q = q.eq('gender', g);
        return q.then(function (r) { return (r.error ? 0 : r.count) || 0; });
      };
      return Promise.all([cnt(), cnt('male'), cnt('female')]).then(function (a) {
        return { total: a[0], male: a[1], female: a[2], demo: false };
      });
    },

    /* 公告列表 */
    listNotices: function (limit) {
      var sb = window.getSb();
      if (!sb) {
        var list = DEMO.notices.slice(0, limit || DEMO.notices.length);
        return Promise.resolve(list);
      }
      var q = sb.from('notices').select('id,category,title,content,is_top,published_at')
        .order('is_top', { ascending: false })
        .order('published_at', { ascending: false });
      if (limit) q = q.limit(limit);
      return q.then(function (r) {
        if (r.error) throw r.error;
        return r.data || [];
      });
    },

    /* 提交登记资料（公开，写入 status=pending）
       注意：这里刻意不加 .select()，因为匿名端的 RLS 只允许读 status='approved'，
       若带上 RETURNING 会触发 "new row violates row-level security policy" */
    submitProfile: function (payload) {
      var sb = window.getSb();
      if (!sb) return Promise.reject(new Error('尚未配置 Supabase，无法提交。请在 js/config.js 中填写后端信息。'));
      return sb.from('profiles').insert([payload]).then(function (r) {
        if (r.error) throw r.error;
        return { code: payload.code, id: null };
      });
    },

    /* 上传照片到 Storage（公开，匿名上传由 RLS 策略控制） */
    uploadPhoto: function (file) {
      var sb = window.getSb();
      if (!sb) return Promise.reject(new Error('尚未配置 Supabase，无法上传照片。'));
      var ext = (file.name && file.name.split('.').pop()) || 'jpg';
      var path = 'member/' + Date.now() + '_' + Math.random().toString(36).slice(2, 8) + '.' + ext;
      return sb.storage.from(CFG.PHOTO_BUCKET || 'member-photos').upload(path, file, {
        cacheControl: '31536000', upsert: false
      }).then(function (r) {
        if (r.error) throw r.error;
        return sb.storage.from(CFG.PHOTO_BUCKET || 'member-photos').getPublicUrl(path).data.publicUrl;
      });
    },

    /* 公告详情 */
    getNotice: function (id) {
      var sb = window.getSb();
      if (!sb) {
        return Promise.resolve(DEMO.notices.filter(function (n) { return n.id === id; })[0] || null);
      }
      return sb.from('notices').select('*').eq('id', id).single().then(function (r) {
        if (r.error) throw r.error;
        return r.data;
      });
    },

    /* ---------------- 管理端（需登录） ---------------- */
    adminLogin: function (email, password) {
      var sb = window.getSb();
      if (!sb) return Promise.reject(new Error('尚未配置 Supabase。'));
      return sb.auth.signInWithPassword({ email: email, password: password }).then(function (r) {
        if (r.error) throw r.error;
        return r.data.session;
      });
    },
    adminLogout: function () {
      var sb = window.getSb();
      if (!sb) return Promise.resolve();
      return sb.auth.signOut();
    },
    currentSession: function () {
      var sb = window.getSb();
      if (!sb) return Promise.resolve(null);
      return sb.auth.getSession().then(function (r) { return r.data.session || null; });
    },
    adminList: function (opt) {
      opt = opt || {};
      var sb = window.getSb();
      if (!sb) return Promise.reject(new Error('尚未配置 Supabase。'));
      var q = sb.from('profiles').select('*', { count: 'exact' });
      if (opt.gender && opt.gender !== 'all') q = q.eq('gender', opt.gender);
      if (opt.status && opt.status !== 'all') q = q.eq('status', opt.status);
      if (opt.q) {
        var kw = '%' + opt.q + '%';
        q = q.or('code.ilike.' + kw + ',display_name.ilike.' + kw + ',phone.ilike.' + kw + ',city.ilike.' + kw + ',occupation.ilike.' + kw);
      }
      var page = opt.page || 1;
      var size = opt.pageSize || 20;
      q = q.order('created_at', { ascending: false }).range((page - 1) * size, page * size - 1);
      return q.then(function (r) {
        if (r.error) throw r.error;
        return { list: r.data || [], total: r.count || 0 };
      });
    },
    adminStats: function () {
      var sb = window.getSb();
      if (!sb) return Promise.reject(new Error('尚未配置 Supabase。'));
      var one = function (fn) {
        var q = sb.from('profiles').select('id', { count: 'exact', head: true });
        q = fn(q);
        return q.then(function (r) { return (r.error ? 0 : r.count) || 0; });
      };
      return Promise.all([
        one(function (q) { return q; }),
        one(function (q) { return q.eq('status', 'pending'); }),
        one(function (q) { return q.eq('status', 'approved'); }),
        one(function (q) { return q.eq('status', 'rejected'); }),
        one(function (q) { return q.eq('gender', 'male'); }),
        one(function (q) { return q.eq('gender', 'female'); })
      ]).then(function (a) {
        return { total: a[0], pending: a[1], approved: a[2], rejected: a[3], male: a[4], female: a[5] };
      });
    },
    setStatus: function (id, status, note) {
      var sb = window.getSb();
      if (!sb) return Promise.reject(new Error('尚未配置 Supabase。'));
      var patch = { status: status, updated_at: new Date().toISOString() };
      if (note !== undefined) patch.audit_note = note;
      return sb.from('profiles').update(patch).eq('id', id).then(function (r) {
        if (r.error) throw r.error;
        return true;
      });
    },
    removeProfile: function (id) {
      var sb = window.getSb();
      if (!sb) return Promise.reject(new Error('尚未配置 Supabase。'));
      return sb.from('profiles').delete().eq('id', id).then(function (r) {
        if (r.error) throw r.error;
        return true;
      });
    },
    createNotice: function (payload) {
      var sb = window.getSb();
      if (!sb) return Promise.reject(new Error('尚未配置 Supabase。'));
      return sb.from('notices').insert([payload]).then(function (r) {
        if (r.error) throw r.error;
        return true;
      });
    },
    removeNotice: function (id) {
      var sb = window.getSb();
      if (!sb) return Promise.reject(new Error('尚未配置 Supabase。'));
      return sb.from('notices').delete().eq('id', id).then(function (r) {
        if (r.error) throw r.error;
        return true;
      });
    }
  };

  function demoList(opt) {
    var list = DEMO.profiles.filter(function (p) { return p.status === 'approved'; });
    if (opt.gender && opt.gender !== 'all') list = list.filter(function (p) { return p.gender === opt.gender; });
    if (opt.education) list = list.filter(function (p) { return p.education === opt.education; });
    if (opt.q) {
      var k = opt.q.toLowerCase();
      list = list.filter(function (p) {
        return (p.code + p.occupation + p.city + p.display_name).toLowerCase().indexOf(k) > -1;
      });
    }
    var page = opt.page || 1;
    var size = opt.pageSize || CFG.PAGE_SIZE || 12;
    var total = list.length;
    return { list: list.slice((page - 1) * size, page * size), total: total, demo: true };
  }

  /* ------------------------------------------------------------------
     六、会员卡片 / 详情弹窗（多页共用）
     ------------------------------------------------------------------ */
  window.memberCardHtml = function (m) {
    var photo = m.photo_url
      ? '<img src="' + esc(m.photo_url) + '" alt="' + esc(m.display_name) + '生活照" loading="lazy" />'
      : '<div class="ph-avatar">' + esc((m.display_name || '会员').slice(0, 1)) + '</div>';
    return '' +
      '<article class="member-card">' +
      '  <div class="mc-photo">' + photo + '<span class="mc-code">编号 ' + esc(m.code || '—') + '</span></div>' +
      '  <div class="mc-body">' +
      '    <div class="mc-title">' +
      '      <strong>' + esc(m.display_name || '会员') + '</strong>' +
      '      <span class="tag">' + genderText(m.gender) + '</span>' +
      '      <span class="tag tag-grey">' + esc(m.marital_status || '未婚') + '</span>' +
      '    </div>' +
      '    <div class="mc-attrs">' +
      '      <span><b>年龄</b>' + ageOf(m.birth_year) + ' 岁</span>' +
      '      <span><b>身高</b>' + (m.height || '—') + ' cm</span>' +
      '      <span><b>学历</b>' + esc(m.education || '—') + '</span>' +
      '      <span><b>职业</b>' + esc(m.occupation || '—') + '</span>' +
      '      <span><b>现居</b>' + esc((m.city || '') + (m.district || '')) + '</span>' +
      '    </div>' +
      '    <p class="mc-intro">' + esc(m.self_intro || '暂无自我介绍') + '</p>' +
      '    <div class="mc-foot">' +
      '      <span class="mc-contact"><span class="locked">联系方式</span> ' + maskPhone(m.phone) + '</span>' +
      '      <button type="button" class="btn btn-sm" onclick="window.openMemberDetail(\'' + esc(m.id) + '\')">查看详情</button>' +
      '    </div>' +
      '  </div>' +
      '</article>';
  };

  window.openMemberDetail = function (id) {
    var find = function (list) { return list.filter(function (x) { return String(x.id) === String(id); })[0]; };
    var cached = window.__memberCache || [];
    var m = find(cached);
    var done = function (member) {
      if (!member) { showToast('未找到该会员信息', 'err'); return; }
      var rows = [
        ['会员编号', member.code], ['性别', genderText(member.gender)], ['称呼', member.display_name],
        ['年龄', ageOf(member.birth_year) + ' 岁'], ['出生年份', member.birth_year],
        ['身高', (member.height || '—') + ' cm'], ['学历', member.education], ['职业', member.occupation],
        ['现居地', (member.city || '') + (member.district || '')], ['婚姻状况', member.marital_status],
        ['住房情况', member.housing], ['车辆情况', member.car],
        ['联系方式', maskPhone(member.phone) + '（仅审核人员可见完整号码）'],
        ['自我介绍', member.self_intro], ['择偶要求', member.mate_expect]
      ];
      var html = '<table class="detail-table">';
      rows.forEach(function (r) {
        html += '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1] || '—') + '</td></tr>';
      });
      html += '</table>';
      if (member.photo_url) {
        html = '<img class="detail-photo" src="' + esc(member.photo_url) + '" alt="生活照" />' + html;
      }
      showModal('会员详情 · ' + esc(member.code || ''), html, '<p class="form-tip">如对上述会员有意向，请致电 ' + esc(CFG.TEL) + ' 由工作人员协助联系，双方同意后交换联系方式。</p>');
    };

    if (m) { done(m); return; }
    var sb = window.getSb();
    if (!sb) { done(find(DEMO.profiles)); return; }
    sb.from('profiles').select('*').eq('id', id).single().then(function (r) {
      if (r.error) { showToast('读取详情失败：' + r.error.message, 'err'); return; }
      done(r.data);
    });
  };

  window.showModal = function (title, bodyHtml, footHtml) {
    window.closeModal();
    var mask = document.createElement('div');
    mask.className = 'modal-mask';
    mask.id = 'global-modal';
    mask.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(title) + '">' +
      '  <div class="modal-head"><h3>' + title + '</h3>' +
      '    <button type="button" class="modal-close" onclick="window.closeModal()" aria-label="关闭">×</button></div>' +
      '  <div class="modal-body">' + bodyHtml + '</div>' +
      '  <div class="modal-foot">' + (footHtml || '') +
      '    <button type="button" class="btn btn-grey btn-sm" onclick="window.closeModal()">关闭</button></div>' +
      '</div>';
    mask.addEventListener('click', function (e) { if (e.target === mask) window.closeModal(); });
    document.body.appendChild(mask);
    document.body.style.overflow = 'hidden';
  };

  window.closeModal = function () {
    var el = document.getElementById('global-modal');
    if (el) el.remove();
    document.body.style.overflow = '';
  };

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') window.closeModal();
  });
})();
