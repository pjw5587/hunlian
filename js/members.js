/* 会员列表页：筛选、分页、详情弹窗 */
(function () {
  'use strict';

  var state = {
    gender: getQuery('gender') || 'all',
    age: 'all',
    education: '',
    q: getQuery('q') || '',
    page: 1
  };

  renderShell('members');

  var AGE_RANGE = {
    '18-25': [18, 25], '26-30': [26, 30], '31-35': [31, 35],
    '36-40': [36, 40], '41-99': [41, 99]
  };

  function titleOf() {
    if (state.gender === 'male') return '男嘉宾信息';
    if (state.gender === 'female') return '女嘉宾信息';
    return '会员信息';
  }

  function syncUi() {
    var t = titleOf();
    document.getElementById('page-title').textContent = t;
    document.getElementById('crumb-current').textContent = t;
    document.title = t + ' - ' + CFG.SITE_NAME;

    [].forEach.call(document.querySelectorAll('.chip[data-g]'), function (b) {
      b.classList.toggle('active', b.dataset.g === state.gender);
    });
    [].forEach.call(document.querySelectorAll('.chip[data-age]'), function (b) {
      b.classList.toggle('active', b.dataset.age === state.age);
    });
    document.getElementById('f-edu').value = state.education;
    document.getElementById('f-kw').value = state.q;
  }

  function currentOpt() {
    var r = AGE_RANGE[state.age];
    return {
      gender: state.gender,
      education: state.education,
      q: state.q,
      ageMin: r ? r[0] : null,
      ageMax: r ? r[1] : null,
      page: state.page,
      pageSize: CFG.PAGE_SIZE || 12
    };
  }

  function load() {
    var box = document.getElementById('member-list');
    box.innerHTML = '<div class="loading"><div class="spinner"></div>会员资料加载中…</div>';
    document.getElementById('result-count').textContent = '资料加载中…';

    Data.listMembers(currentOpt()).then(function (res) {
      window.__memberCache = res.list;
      if (!res.list.length) {
        box.innerHTML = '<div class="empty-box"><strong>暂无符合条件的会员资料</strong>' +
          '请调整筛选条件后重试，或前往 <a href="register.html">登记报名</a> 成为会员。</div>';
        document.getElementById('result-count').textContent = '共 0 位会员';
        document.getElementById('pager').innerHTML = '';
        return;
      }
      box.innerHTML = '<div class="member-grid">' + res.list.map(window.memberCardHtml).join('') + '</div>';
      document.getElementById('result-count').textContent =
        '共 ' + res.total + ' 位会员' + (res.demo ? '（演示数据）' : '');
      renderPager(res.total);
    }).catch(function (err) {
      box.innerHTML = '<div class="empty-box"><strong>资料加载失败</strong>' + esc(err.message || String(err)) +
        '<br><br>请确认 js/config.js 中的 Supabase 地址与 anon key 填写正确，并已在数据库中执行 sql/schema.sql。</div>';
      document.getElementById('result-count').textContent = '加载失败';
    });
  }

  function renderPager(total) {
    var size = CFG.PAGE_SIZE || 12;
    var pages = Math.max(1, Math.ceil(total / size));
    var box = document.getElementById('pager');
    if (pages <= 1) { box.innerHTML = ''; return; }

    var html = '<button type="button" data-p="' + (state.page - 1) + '"' +
      (state.page <= 1 ? ' disabled' : '') + '>上一页</button>';
    for (var i = 1; i <= pages; i++) {
      if (pages > 9 && i > 3 && i < pages - 2 && Math.abs(i - state.page) > 1) {
        if (i === 4) html += '<span class="pager-info">…</span>';
        continue;
      }
      html += '<button type="button" data-p="' + i + '"' + (i === state.page ? ' class="active"' : '') + '>' + i + '</button>';
    }
    html += '<button type="button" data-p="' + (state.page + 1) + '"' +
      (state.page >= pages ? ' disabled' : '') + '>下一页</button>';
    html += '<span class="pager-info">第 ' + state.page + ' / ' + pages + ' 页</span>';
    box.innerHTML = html;

    [].forEach.call(box.querySelectorAll('button[data-p]'), function (b) {
      b.onclick = function () {
        var p = parseInt(b.dataset.p, 10);
        if (!p || p === state.page) return;
        state.page = p;
        load();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    });
  }

  /* ---------------- 事件绑定 ---------------- */
  [].forEach.call(document.querySelectorAll('.chip[data-g]'), function (b) {
    b.onclick = function () {
      state.gender = b.dataset.g;
      state.page = 1;
      syncUi();
      load();
      var url = 'members.html?gender=' + state.gender;
      history.replaceState(null, '', url);
    };
  });

  [].forEach.call(document.querySelectorAll('.chip[data-age]'), function (b) {
    b.onclick = function () { state.age = b.dataset.age; state.page = 1; syncUi(); load(); };
  });

  document.getElementById('f-edu').onchange = function (e) {
    state.education = e.target.value; state.page = 1; load();
  };
  document.getElementById('f-apply').onclick = function () {
    state.q = document.getElementById('f-kw').value.trim();
    state.page = 1; load();
  };
  document.getElementById('f-kw').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') { document.getElementById('f-apply').click(); }
  });
  document.getElementById('f-reset').onclick = function () {
    state.gender = 'all'; state.age = 'all'; state.education = ''; state.q = ''; state.page = 1;
    syncUi(); load();
    history.replaceState(null, '', 'members.html');
  };

  syncUi();
  load();
})();
