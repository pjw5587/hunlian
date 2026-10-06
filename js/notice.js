/* 公告通知页：左侧列表 + 右侧内容 */
(function () {
  'use strict';

  renderShell('notice');

  var list = [];
  var nav = document.getElementById('notice-nav');
  var article = document.getElementById('notice-article');

  function renderArticle(item) {
    if (!item) {
      article.innerHTML = '<div class="empty-box" style="border:0"><strong>暂无公告</strong>请稍后再来查看。</div>';
      return;
    }
    document.title = item.title + ' - ' + CFG.SITE_NAME;
    var paras = String(item.content || '').split('\n').filter(function (p) { return p.trim(); })
      .map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    article.innerHTML =
      '<h1>' + esc(item.title) + '</h1>' +
      '<div class="article-meta">' +
      '  <span class="tag">' + esc(item.category || '公告') + '</span>' +
      '  发布日期：' + fmtDate(item.published_at) +
      '</div>' + paras +
      '<p style="margin-top:26px;color:#888;font-size:.875rem">' +
      '　　' + esc(CFG.RUN_ORG) + '<br>' +
      '　　' + fmtDate(item.published_at) +
      '</p>' +
      '<div style="margin-top:22px"><a class="btn btn-ghost btn-sm" href="index.html">返回首页</a> ' +
      '<a class="btn btn-sm" href="register.html">我要登记报名</a></div>';
  }

  function renderNav(activeId) {
    nav.innerHTML = list.map(function (n) {
      return '<a href="notice.html?id=' + encodeURIComponent(n.id) + '"' +
        (String(n.id) === String(activeId) ? ' class="active"' : '') + '>' +
        esc(n.title) + '</a>';
    }).join('') || '<div style="padding:16px;color:#999;font-size:.875rem">暂无公告</div>';
  }

  Data.listNotices(50).then(function (rows) {
    list = rows || [];
    var id = getQuery('id');
    var current = list.filter(function (n) { return String(n.id) === String(id); })[0] || list[0];
    renderNav(current && current.id);
    renderArticle(current);
  }).catch(function (err) {
    nav.innerHTML = '<div style="padding:16px;color:#a01f24;font-size:.875rem">加载失败</div>';
    article.innerHTML = '<div class="empty-box" style="border:0"><strong>公告加载失败</strong>' +
      esc(err.message || String(err)) +
      '<br><br>请确认 js/config.js 中的 Supabase 配置正确，且已执行 sql/schema.sql。</div>';
  });
})();
