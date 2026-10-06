/* 首页：公告列表 + 数据统计 */
(function () {
  'use strict';

  renderShell('home');

  // ---------- 通知公告（取最新 6 条） ----------
  Data.listNotices(6).then(function (list) {
    var box = document.getElementById('home-notices');
    if (!box) return;
    if (!list.length) {
      box.innerHTML = '<li><div style="padding:24px;text-align:center;color:#999">暂无公告</div></li>';
      return;
    }
    box.innerHTML = list.map(function (n) {
      return '<li><a href="notice.html?id=' + encodeURIComponent(n.id) + '">' +
        '<span class="dot"></span>' +
        '<span class="title">' + esc(n.title) + '</span>' +
        (n.is_top ? '<span class="tag tag-red">置顶</span>' : '') +
        '<span class="date">' + fmtDate(n.published_at) + '</span>' +
        '</a></li>';
    }).join('');
  }).catch(function (err) {
    var box = document.getElementById('home-notices');
    if (box) {
      box.innerHTML = '<li><div style="padding:20px;font-size:.875rem;color:#a01f24">公告加载失败：' +
        esc(err.message || err) + '</div></li>';
    }
  });

  // ---------- 服务数据 ----------
  Data.getStats().then(function (s) {
    var set = function (id, v) { var el = document.getElementById(id); if (el) el.textContent = v; };
    set('stat-total', s.total);
    set('stat-male', s.male);
    set('stat-female', s.female);
  }).catch(function () { /* 统计失败不阻断页面 */ });
})();
