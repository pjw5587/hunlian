/* 后台管理：登录、数据看板、资料审核、公告管理 */
(function () {
  'use strict';

  renderShell('admin');

  var state = {
    view: 'dash',
    status: 'all',
    gender: 'all',
    kw: '',
    page: 1,
    pageSize: 20,
    total: 0,
    rows: [],
    demo: false
  };

  var $ = function (id) { return document.getElementById(id); };

  /* ================= 视图切换 ================= */
  function showLogin() {
    $('login-view').style.display = '';
    $('admin-view').style.display = 'none';
    if (!isConfigured()) {
      var tip = $('login-view').querySelector('.alert');
      tip.className = 'alert alert-danger';
      tip.innerHTML = '尚未配置 Supabase：请在 <b>js/config.js</b> 中填写 SUPABASE_URL 与 SUPABASE_ANON_KEY，' +
        '并在数据库中执行 <b>sql/schema.sql</b> 后再登录。<br><br>' +
        '<button type="button" class="btn btn-grey btn-sm" id="ad-demo">以演示模式预览后台</button>';
      var b = $('ad-demo');
      if (b) b.onclick = enterDemo;
    }
  }

  function showAdmin() {
    $('login-view').style.display = 'none';
    $('admin-view').style.display = '';
    loadDash();
    loadAudit();
  }

  function enterDemo() {
    state.demo = true;
    state.rows = DEMO.profiles.slice();
    showAdmin();
    loadNoticesDemo();
    showToast('演示模式：仅可预览，无法写入真实数据', '');
  }

  function switchView(v) {
    state.view = v;
    ['dash', 'audit', 'notice'].forEach(function (k) {
      $('view-' + k).style.display = (k === v ? '' : 'none');
    });
    [].forEach.call(document.querySelectorAll('.admin-side a[data-view]'), function (a) {
      a.classList.toggle('active', a.dataset.view === v);
    });
    if (v === 'notice') loadNotices();
    if (v === 'dash') loadDash();
  }

  [].forEach.call(document.querySelectorAll('.admin-side a[data-view]'), function (a) {
    a.onclick = function () { switchView(a.dataset.view); };
  });

  /* ================= 登录 / 退出 ================= */
  $('ad-login').onclick = function () {
    var email = $('ad-email').value.trim();
    var pwd = $('ad-password').value;
    if (!email || !pwd) { showToast('请输入邮箱和密码', 'err'); return; }
    if (state.demo) { showAdmin(); return; }

    var btn = $('ad-login');
    btn.disabled = true; btn.textContent = '登录中…';
    Data.adminLogin(email, pwd).then(function () {
      btn.disabled = false; btn.textContent = '登 录';
      $('ad-password').value = '';
      showToast('登录成功', 'ok');
      showAdmin();
    }).catch(function (err) {
      btn.disabled = false; btn.textContent = '登 录';
      showToast('登录失败：' + (err.message || err), 'err');
    });
  };
  $('ad-password').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('ad-login').click(); });

  $('ad-logout').onclick = function () {
    if (state.demo) { state.demo = false; showLogin(); return; }
    Data.adminLogout().then(function () {
      showToast('已退出登录', '');
      showLogin();
    });
  };

  /* ================= 数据看板 ================= */
  function loadDash() {
    $('a-user').textContent = state.demo ? '演示模式' : '已登录';
    $('a-today').textContent = fmtDate(new Date().toISOString()).slice(5);

    if (state.demo) {
      var d = DEMO.profiles;
      var c = function (f) { return d.filter(f).length; };
      setDash(c(function () { return true; }), c(function (p) { return p.status === 'pending'; }),
        c(function (p) { return p.status === 'approved'; }), c(function (p) { return p.status === 'rejected'; }),
        c(function (p) { return p.gender === 'male'; }), c(function (p) { return p.gender === 'female'; }));
      return;
    }
    Data.adminStats().then(function (s) {
      setDash(s.total, s.pending, s.approved, s.rejected, s.male, s.female);
    }).catch(function (err) {
      showToast('统计读取失败：' + (err.message || err), 'err');
    });
  }

  function setDash(total, pending, approved, rejected, male, female) {
    $('a-total').textContent = total;
    $('a-pending').textContent = pending;
    $('a-approved').textContent = approved;
    $('a-rejected').textContent = rejected;
    $('a-male').textContent = male;
    $('a-female').textContent = female;
  }

  /* ================= 资料审核 ================= */
  function loadAudit() {
    if (state.demo) { renderRows(filterDemo()); return; }

    $('a-tbody').innerHTML = '<tr><td colspan="14" style="text-align:center;color:#999">加载中…</td></tr>';
    Data.adminList({
      status: state.status, gender: state.gender, q: state.kw,
      page: state.page, pageSize: state.pageSize
    }).then(function (res) {
      state.rows = res.list;
      state.total = res.total;
      renderRows(res.list, res.total);
    }).catch(function (err) {
      $('a-tbody').innerHTML = '<tr><td colspan="14" style="color:#a01f24">读取失败：' +
        esc(err.message || String(err)) + '（请确认 schema.sql 中的管理端策略已执行，且已用管理员账号登录）</td></tr>';
      $('a-count').textContent = '读取失败';
    });
  }

  function filterDemo() {
    var list = state.rows.length ? state.rows : DEMO.profiles;
    if (state.status !== 'all') list = list.filter(function (p) { return p.status === state.status; });
    if (state.gender !== 'all') list = list.filter(function (p) { return p.gender === state.gender; });
    if (state.kw) {
      var k = state.kw.toLowerCase();
      list = list.filter(function (p) {
        return (p.code + p.display_name + (p.name || '') + p.phone + p.city + p.occupation).toLowerCase().indexOf(k) > -1;
      });
    }
    return list;
  }

  function renderRows(list, total) {
    if (typeof total !== 'number') total = list.length;
    state.total = total;
    $('a-count').textContent = '共 ' + total + ' 条资料' + (state.demo ? '（演示数据）' : '');
    $('a-tbody').innerHTML = list.map(function (p) {
      return '<tr>' +
        '<td>' + esc(p.code || '—') + '</td>' +
        '<td>' + genderText(p.gender) + '</td>' +
        '<td>' + esc(p.display_name || '—') + '</td>' +
        '<td>' + esc(p.name || '—') + '</td>' +
        '<td>' + ageOf(p.birth_year) + '</td>' +
        '<td>' + (p.height || '—') + '</td>' +
        '<td>' + esc(p.education || '—') + '</td>' +
        '<td>' + esc(p.occupation || '—') + '</td>' +
        '<td>' + esc((p.city || '') + (p.district || '')) + '</td>' +
        '<td>' + esc(p.marital_status || '—') + '</td>' +
        '<td>' + esc(p.phone || '—') + '</td>' +
        '<td><span class="tag ' + statusClass(p.status) + '">' + statusText(p.status) + '</span></td>' +
        '<td>' + fmtDateTime(p.created_at) + '</td>' +
        '<td><div class="row-ops">' +
        '  <button type="button" class="btn btn-grey btn-sm" data-act="view" data-id="' + esc(p.id) + '">查看</button>' +
        '  <button type="button" class="btn btn-sm" data-act="approve" data-id="' + esc(p.id) + '">通过</button>' +
        '  <button type="button" class="btn btn-ghost btn-sm" data-act="reject" data-id="' + esc(p.id) + '">驳回</button>' +
        '  <button type="button" class="btn btn-grey btn-sm" data-act="hide" data-id="' + esc(p.id) + '">隐藏</button>' +
        '  <button type="button" class="btn btn-grey btn-sm" data-act="del" data-id="' + esc(p.id) + '">删除</button>' +
        '</div></td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="14" style="text-align:center;color:#999;padding:30px">没有符合条件的资料</td></tr>';

    bindRowOps();
    renderPager(total);
  }

  function bindRowOps() {
    [].forEach.call($('a-tbody').querySelectorAll('button[data-act]'), function (b) {
      b.onclick = function () {
        var id = b.dataset.id;
        var act = b.dataset.act;
        var row = findRow(id);
        if (act === 'view') return openDetail(row);
        if (act === 'approve') return doStatus(id, 'approved', '');
        if (act === 'reject') return rejectFlow(id);
        if (act === 'hide') return doStatus(id, 'hidden', '');
        if (act === 'del') return deleteFlow(id, row);
      };
    });
  }

  function findRow(id) {
    var pool = state.demo ? (DEMO.profiles.concat(state.rows)) : state.rows;
    return pool.filter(function (x) { return String(x.id) === String(id); })[0];
  }

  function renderPager(total) {
    var pages = Math.max(1, Math.ceil(total / state.pageSize));
    var box = $('a-pager');
    if (state.demo || pages <= 1) { box.innerHTML = '<span class="pager-info">共 ' + pages + ' 页</span>'; return; }
    var html = '<button type="button" data-p="' + (state.page - 1) + '"' + (state.page <= 1 ? ' disabled' : '') + '>上一页</button>';
    var from = Math.max(1, state.page - 2), to = Math.min(pages, state.page + 2);
    for (var i = from; i <= to; i++) {
      html += '<button type="button" data-p="' + i + '"' + (i === state.page ? ' class="active"' : '') + '>' + i + '</button>';
    }
    html += '<button type="button" data-p="' + (state.page + 1) + '"' + (state.page >= pages ? ' disabled' : '') + '>下一页</button>';
    html += '<span class="pager-info">第 ' + state.page + ' / ' + pages + ' 页</span>';
    box.innerHTML = html;
    [].forEach.call(box.querySelectorAll('button[data-p]'), function (b) {
      b.onclick = function () {
        var p = parseInt(b.dataset.p, 10);
        if (!p || p === state.page) return;
        state.page = p;
        loadAudit();
      };
    });
  }

  function openDetail(p) {
    if (!p) { showToast('未找到该条资料', 'err'); return; }
    var rows = [
      ['会员编号', p.code], ['状态', statusText(p.status)], ['性别', genderText(p.gender)],
      ['真实姓名', p.name], ['公开称呼', p.display_name],
      ['年龄 / 出生年份', ageOf(p.birth_year) + ' 岁 / ' + (p.birth_year || '—')],
      ['身高 / 体重', (p.height || '—') + ' cm / ' + (p.weight || '—') + ' kg'],
      ['学历', p.education], ['职业', p.occupation], ['收入范围', p.income],
      ['婚姻状况', p.marital_status], ['子女情况', p.has_children],
      ['现居地', (p.city || '') + (p.district || '')], ['户口', p.hukou],
      ['住房 / 车辆', (p.housing || '—') + ' / ' + (p.car || '—')],
      ['手机号', p.phone], ['微信号', p.wechat],
      ['自我介绍', p.self_intro], ['择偶要求', p.mate_expect],
      ['提交时间', fmtDateTime(p.created_at)], ['审核备注', p.audit_note]
    ];
    var html = '<table class="detail-table">' + rows.map(function (r) {
      return '<tr><th>' + esc(r[0]) + '</th><td>' + esc(r[1] === null || r[1] === undefined || r[1] === '' ? '—' : r[1]) + '</td></tr>';
    }).join('') + '</table>';
    if (p.photo_url) {
      html = '<img class="detail-photo" src="' + esc(p.photo_url) + '" alt="会员照片" />' + html;
    }
    showModal('资料详情 · ' + esc(p.code || ''), html,
      '<button type="button" class="btn btn-sm" onclick="window.__adminApprove(\'' + esc(p.id) + '\')">通过</button>' +
      '<button type="button" class="btn btn-ghost btn-sm" onclick="window.__adminReject(\'' + esc(p.id) + '\')">驳回</button>');
  }

  /* 供弹窗按钮调用 */
  window.__adminApprove = function (id) { window.closeModal(); doStatus(id, 'approved', ''); };
  window.__adminReject = function (id) { window.closeModal(); rejectFlow(id); };

  function doStatus(id, status, note) {
    if (state.demo) { showToast('演示模式不可修改数据', 'err'); return; }
    Data.setStatus(id, status, note).then(function () {
      showToast('操作成功：' + statusText(status), 'ok');
      loadAudit();
      loadDash();
    }).catch(function (err) {
      showToast('操作失败：' + (err.message || err), 'err');
    });
  }

  function rejectFlow(id) {
    showModal('驳回资料', '<div class="form-item"><label>驳回原因（会员可见于电话沟通）</label>' +
      '<textarea id="reject-note" style="min-height:90px" placeholder="如：自我介绍不足30字，请补充完善后重新提交"></textarea></div>', '');
    var foot = document.createElement('button');
    foot.type = 'button';
    foot.className = 'btn btn-red btn-sm';
    foot.textContent = '确认驳回';
    foot.onclick = function () {
      var note = ($('reject-note') || {}).value || '';
      window.closeModal();
      doStatus(id, 'rejected', note.trim());
    };
    var footBox = document.querySelector('#global-modal .modal-foot');
    if (footBox) footBox.insertBefore(foot, footBox.firstChild);
  }

  function deleteFlow(id, row) {
    var name = row ? (row.display_name || row.code || '') : '';
    showModal('删除确认',
      '<p style="font-size:.9375rem;line-height:1.9">确定要删除 <b>' + esc(name) + '</b> 的资料吗？<br>' +
      '删除后不可恢复，公开展示的信息也会同步消失，请谨慎操作。</p>', '');
    var foot = document.createElement('button');
    foot.type = 'button';
    foot.className = 'btn btn-red btn-sm';
    foot.textContent = '确认删除';
    foot.onclick = function () {
      window.closeModal();
      if (state.demo) { showToast('演示模式不可修改数据', 'err'); return; }
      Data.removeProfile(id).then(function () {
        showToast('已删除', 'ok');
        loadAudit(); loadDash();
      }).catch(function (err) {
        showToast('删除失败：' + (err.message || err), 'err');
      });
    };
    var footBox = document.querySelector('#global-modal .modal-foot');
    if (footBox) footBox.insertBefore(foot, footBox.firstChild);
  }

  /* 筛选与导出 */
  [].forEach.call(document.querySelectorAll('.chip[data-s]'), function (b) {
    if (b.dataset.s === 'all') b.classList.add('active');
    b.onclick = function () {
      state.status = b.dataset.s; state.page = 1;
      [].forEach.call(document.querySelectorAll('.chip[data-s]'), function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      refresh();
    };
  });
  [].forEach.call(document.querySelectorAll('.chip[data-ag]'), function (b) {
    if (b.dataset.ag === 'all') b.classList.add('active');
    b.onclick = function () {
      state.gender = b.dataset.ag; state.page = 1;
      [].forEach.call(document.querySelectorAll('.chip[data-ag]'), function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      refresh();
    };
  });
  $('a-search').onclick = function () { state.kw = $('a-kw').value.trim(); state.page = 1; refresh(); };
  $('a-kw').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('a-search').click(); });
  $('a-reset').onclick = function () {
    state.status = 'all'; state.gender = 'all'; state.kw = ''; state.page = 1;
    $('a-kw').value = '';
    [].forEach.call(document.querySelectorAll('.chip[data-s]'), function (x) { x.classList.toggle('active', x.dataset.s === 'all'); });
    [].forEach.call(document.querySelectorAll('.chip[data-ag]'), function (x) { x.classList.toggle('active', x.dataset.ag === 'all'); });
    refresh();
  };
  $('a-export').onclick = exportCsv;

  function refresh() {
    if (state.demo) { renderRows(filterDemo()); return; }
    loadAudit();
  }

  function exportCsv() {
    var run = function (list) {
      if (!list.length) { showToast('没有可导出的数据', 'err'); return; }
      var head = ['编号', '状态', '性别', '公开称呼', '真实姓名', '出生年份', '身高', '学历', '职业',
        '现居城市', '区县', '婚姻状况', '子女情况', '住房', '车辆', '手机号', '微信号',
        '自我介绍', '择偶要求', '提交时间'];
      var esc2 = function (v) {
        var s = (v === null || v === undefined) ? '' : String(v);
        return '"' + s.replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
      };
      var lines = [head.join(',')].concat(list.map(function (p) {
        return [p.code, statusText(p.status), genderText(p.gender), p.display_name, p.name, p.birth_year,
          p.height, p.education, p.occupation, p.city, p.district, p.marital_status, p.has_children,
          p.housing, p.car, p.phone, p.wechat, p.self_intro, p.mate_expect, fmtDateTime(p.created_at)]
          .map(esc2).join(',');
      }));
      var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '会员资料_' + fmtDate(new Date().toISOString()) + '.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast('已导出 ' + list.length + ' 条资料', 'ok');
    };

    if (state.demo) { run(filterDemo()); return; }
    Data.adminList({ status: state.status, gender: state.gender, q: state.kw, page: 1, pageSize: 500 })
      .then(function (res) { run(res.list); })
      .catch(function (err) { showToast('导出失败：' + (err.message || err), 'err'); });
  }

  /* ================= 公告管理 ================= */
  function loadNotices() {
    var tb = $('n-tbody');
    if (state.demo) { loadNoticesDemo(); return; }
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#999">加载中…</td></tr>';
    Data.listNotices(100).then(function (list) {
      renderNotices(list);
    }).catch(function (err) {
      tb.innerHTML = '<tr><td colspan="5" style="color:#a01f24">读取失败：' + esc(err.message || String(err)) + '</td></tr>';
    });
  }

  function loadNoticesDemo() { renderNotices(DEMO.notices); }

  function renderNotices(list) {
    var tb = $('n-tbody');
    tb.innerHTML = list.map(function (n) {
      return '<tr>' +
        '<td>' + esc(n.category || '公告') + '</td>' +
        '<td class="wrap-cell">' + esc(n.title) + '</td>' +
        '<td>' + (n.is_top ? '<span class="tag tag-red">置顶</span>' : '—') + '</td>' +
        '<td>' + fmtDateTime(n.published_at || n.created_at) + '</td>' +
        '<td><button type="button" class="btn btn-grey btn-sm" data-nid="' + esc(n.id) + '">删除</button></td>' +
        '</tr>';
    }).join('') || '<tr><td colspan="5" style="text-align:center;color:#999;padding:26px">暂无公告</td></tr>';

    [].forEach.call(tb.querySelectorAll('button[data-nid]'), function (b) {
      b.onclick = function () {
        if (state.demo) { showToast('演示模式不可修改数据', 'err'); return; }
        var id = b.dataset.nid;
        showModal('删除公告', '<p style="font-size:.9375rem">确定删除这条公告吗？删除后前台不再显示。</p>', '');
        var foot = document.createElement('button');
        foot.type = 'button'; foot.className = 'btn btn-red btn-sm'; foot.textContent = '确认删除';
        foot.onclick = function () {
          window.closeModal();
          Data.removeNotice(id).then(function () {
            showToast('已删除', 'ok');
            loadNotices();
          }).catch(function (err) { showToast('删除失败：' + (err.message || err), 'err'); });
        };
        var footBox = document.querySelector('#global-modal .modal-foot');
        if (footBox) footBox.insertBefore(foot, footBox.firstChild);
      };
    });
  }

  $('n-publish').onclick = function () {
    var title = $('n-title').value.trim();
    var content = $('n-content').value.trim();
    if (title.length < 4) { showToast('标题至少 4 个字', 'err'); return; }
    if (content.length < 10) { showToast('正文至少 10 个字', 'err'); return; }
    if (state.demo) { showToast('演示模式不可发布公告', 'err'); return; }

    Data.createNotice({
      category: $('n-category').value,
      title: title,
      content: content,
      is_top: $('n-top').checked,
      published_at: new Date().toISOString()
    }).then(function () {
      showToast('公告已发布', 'ok');
      $('n-title').value = '';
      $('n-content').value = '';
      $('n-top').checked = false;
      loadNotices();
    }).catch(function (err) {
      showToast('发布失败：' + (err.message || err), 'err');
    });
  };

  /* ================= 启动 ================= */
  if (!isConfigured()) {
    showLogin();
  } else {
    Data.currentSession().then(function (session) {
      if (session) { showAdmin(); switchView('dash'); } else { showLogin(); }
    }).catch(function () { showLogin(); });
  }
})();
