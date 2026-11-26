/* 原稿確認用：見本ページの文章に番号、写真に写真名の札を付ける。
   番号の付け方はページの並び順で決まるので、テンプレートの文章を足したり消したりすると番号がずれる。
   そのときは genko/build.py を実行し直して、シートも作り直すこと。 */
(function () {
  'use strict';
  var PAGE = document.body.getAttribute('data-gk-page') || 'top';
  var PREFIX = { top: 'T', about: 'A', item: 'S', contact: 'Q' }[PAGE];
  var PAGE_NAME = { top: 'トップ', about: 'About', item: '商品ページ（全商品共通）', contact: 'お問い合わせ' }[PAGE];

  // 文章の番号を付けない場所（BASE の管理画面で入れる文章・商品ごとに変わる部分・自動で作る部分）
  var SKIP = [
    '.gk-ui', 'script', 'style', 'noscript', 'select', 'option', '[hidden]',
    '.kk-card', '.kk-chips', '.kk-lbls', '.kuku-related-card',
    '#kuku-custom-content', '.itemdetail .item', '.purchase', '#itemSelect',
    '.kk-intro', '.kk-help b[data-dyn]', '.kk-soldout', '#max_page', '#next_page', '.itemupper'
  ].join(',');

  // 写真の枠：[場所, 写真名の頭, 何の写真か]
  var PHOTO_RULES = [
    ['.kk-logo img, .kk-flogo', '共通_ロゴ', function () { return 'ロゴ（ヘッダーとフッターの両方に使う）。元データ（PNG・背景が透明なもの）があればそれを'; }],
    ['.kk-hero-img img', 'トップ_メイン', function () { return 'サイトを開いて最初に見える写真。商品が並んだ写真、または愛犬が食べている写真'; }],
    ['.kk-bn img', 'トップ_バナー', function (img) { return 'バナー「' + txt(img.closest('.kk-bn').querySelector('b')) + '」の写真'; }],
    ['.kk-craft-card img', 'トップ_こだわり', function (img) { return '「' + txt(img.closest('.kk-craft-card').querySelector('h3')) + '」に合う写真'; }],
    ['.kk-grp img', 'トップ_選び方', function (img) { return '「' + txt(img.closest('.kk-grp').querySelector('h3')) + '」グループの商品の写真'; }],
    ['.kk-a-mv', 'about_メイン', function () { return 'Aboutページの最初の写真。淡路島の風景など'; }],
    ['.kk-photos3 img', 'about_つくり方', function (img) { return img.getAttribute('alt') || ''; }],
    ['.kk-about-bn img', '商品_つくり方バナー', function (img) { return '商品ページの下にある「つくり方」へのバナー。' + (img.getAttribute('alt') || ''); }]
  ];

  function txt(el) { return el ? ownText(el, true).replace(/\s+/g, ' ').trim() : ''; }

  // その要素のすぐ下にある文字だけ（子の span などは別の番号にする）。<br> は改行
  function ownText(el, deep) {
    var s = '';
    el.childNodes.forEach(function (n) {
      if (n.nodeType === 3) s += n.nodeValue;
      else if (n.nodeName === 'BR') s += '\n';
      else if (deep && n.nodeType === 1 && !n.classList.contains('gk-no')) s += ownText(n, true);
    });
    return s;
  }
  function clean(s) {
    return s.split('\n').map(function (l) { return l.replace(/\s+/g, ' ').trim(); }).filter(Boolean).join('\n');
  }

  var EYEBROW = {
    'Our Story': 'こだわり', 'How to Choose': '選び方', 'Items': '商品一覧', 'Voices': 'お客さまの声', 'FAQ': 'よくある質問',
    'Our Belief': '想い', 'Awaji-dori': '淡路どりのこと', 'How We Make': 'つくり方', 'Safety': '安心のために',
    'Shopping Guide': 'お買い物について', 'Contact': 'お問い合わせ'
  };

  function sectionName(el) {
    if (el.closest('header.kk-header')) return 'ヘッダー（メニュー）';
    if (el.closest('footer.kk-footer')) return 'フッター';
    if (el.closest('.kk-hero, .kk-a-hero')) return 'メイン';
    if (el.closest('.kk-biz')) return '卸・取材のご案内';
    if (el.closest('.kk-lower')) return '与えるときの注意・案内';
    if (el.closest('.kk-about-bn')) return 'つくり方へのバナー';
    if (el.closest('.kuku-item-extras')) return 'ほかの商品';
    if (el.closest('.kuku-detail-fold')) return 'こだわりの折りたたみ';
    if (el.closest('.itemdetail')) return '商品情報';
    var sec = el.closest('section');
    var eb = sec && sec.querySelector('.kk-eyebrow');
    var key = eb && txt(eb);
    if (key && EYEBROW[key]) return EYEBROW[key];
    var h = sec && sec.querySelector('h2');
    if (h) return txt(h);
    if (el.closest('.kk-help')) return 'お知らせ';
    return 'その他';
  }

  function kindOf(el) {
    var t = el.tagName;
    if (el.classList.contains('kk-eyebrow')) return '英字の小見出し';
    if (el.classList.contains('kk-catch') || t === 'H1' || t === 'H2') return '見出し';
    if (t === 'H3' || (t === 'B' && el.parentElement.tagName !== 'A')) return '小見出し';
    if (t === 'SUMMARY') return '質問';
    if (t === 'A' || el.closest('a, button')) return 'ボタン・リンク';
    if (el.classList.contains('kk-tag') || el.classList.contains('kk-pop') || t === 'SMALL') return 'ラベル・補足';
    if (t === 'LI') return '箇条書き';
    return '本文';
  }

  var texts = [], photos = [];

  function collect() {
    // 閉じている「よくある質問」も開いて見せる
    document.querySelectorAll('details').forEach(function (d) { d.open = true; });
    // お知らせのブログ記事タイトルはBASEのブログから自動で入るので除く
    document.querySelectorAll('.kk-help b').forEach(function (b) {
      if (b.closest('.kk-help').getAttribute('href') === '' || /お知らせ/.test(ownText(b.closest('.kk-help')))) b.setAttribute('data-dyn', '');
    });

    var counters = { C: 0 };
    counters[PREFIX] = 0;
    var units = [];
    var all = document.body.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.closest(SKIP)) continue;
      var s = clean(ownText(el, false));
      if (!s || /^[\s›→〉>・…|｜]+$/.test(s)) continue;
      var first = null;
      el.childNodes.forEach(function (n) { if (!first && n.nodeType === 3 && n.nodeValue.trim()) first = n; });
      units.push({ el: el, s: s, node: first });
    }
    // 画面で読む順（文字が出てくる順）に番号を振る
    units.sort(function (a, b) { return a.node.compareDocumentPosition(b.node) & 4 ? -1 : 1; });
    for (var j = 0; j < units.length; j++) {
      var el = units[j].el, s = units[j].s;
      var common = !!el.closest('header.kk-header, footer.kk-footer');
      var p = common ? 'C' : PREFIX;
      counters[p]++;
      var id = p + '-' + (counters[p] < 10 ? '0' : '') + counters[p];
      texts.push({ id: id, common: common, page: common ? '全ページ共通' : PAGE_NAME,
                   section: sectionName(el), kind: kindOf(el), text: s, el: el, node: units[j].node });
    }

    var seen = {};
    PHOTO_RULES.forEach(function (r) {
      var n = 0;
      document.querySelectorAll(r[0]).forEach(function (img) {
        if (img.closest(SKIP)) return;
        var name = r[1] === '共通_ロゴ' ? r[1] : r[1] + (++n);
        var first = !seen[name];
        seen[name] = true;
        photos.push({ name: name, first: first, page: r[1] === '共通_ロゴ' ? '全ページ共通' : PAGE_NAME,
                      section: sectionName(img), hint: r[2](img), el: img });
      });
    });
  }

  function badges() {
    texts.forEach(function (t) {
      var b = document.createElement('span');
      b.className = 'gk-ui gk-no' + (t.common ? ' gk-common' : '');
      b.textContent = t.id;
      b.id = t.id;
      t.el.insertBefore(b, t.node);
      t.el.classList.add('gk-t');
    });
    var layer = document.createElement('div');
    layer.className = 'gk-ui gk-layer';
    document.body.appendChild(layer);
    photos.forEach(function (p) {
      var b = document.createElement('span');
      b.className = 'gk-ui gk-ph';
      b.textContent = '写真 ' + p.name;
      if (p.first) b.id = p.name;
      layer.appendChild(b);
      p.badge = b;
      p.el.classList.add('gk-img');
      if (p.first) p.el.setAttribute('data-gk-ph', p.name);
    });
    place();
  }

  function place() {
    photos.forEach(function (p) {
      var r = p.el.getBoundingClientRect();
      var hide = r.width < 2 || r.height < 2;
      p.badge.style.display = hide ? 'none' : '';
      p.badge.style.left = (r.left + window.scrollX + 6) + 'px';
      // 小さい写真は札が文章に重なるので、写真のすぐ下に出す
      var small = r.width < 160;
      p.badge.classList.toggle('gk-ph-s', small);
      p.badge.style.left = (r.left + window.scrollX + (small ? 0 : 6)) + 'px';
      p.badge.style.top = (small ? r.bottom + window.scrollY + 2 : r.top + window.scrollY + 6) + 'px';
    });
  }

  function focusHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    if (!id) return;
    var b = document.getElementById(id);
    if (!b) return;
    var t = texts.filter(function (x) { return x.id === id; })[0];
    var p = photos.filter(function (x) { return x.name === id; })[0];
    var target = t ? t.el : p ? p.el : b;
    target.scrollIntoView({ block: 'center' });
    target.classList.remove('gk-flash'); void target.offsetWidth; target.classList.add('gk-flash');
  }

  function toolbar() {
    var bar = document.createElement('div');
    bar.className = 'gk-ui gk-bar';
    var links = [['top', 'トップ'], ['about', 'About'], ['item', '商品ページ'], ['contact', 'お問い合わせ']].map(function (x) {
      return '<a href="' + x[0] + '.html"' + (x[0] === PAGE ? ' aria-current="page"' : '') + '>' + x[1] + '</a>';
    }).join('');
    bar.innerHTML = '<div class="gk-row"><b>原稿確認用の見本</b><span class="gk-key"><i class="gk-k1">T-01</i>文章の番号 → シート「文章」</span>' +
      '<span class="gk-key"><i class="gk-k2">写真</i>写真名 → シート「写真」</span><nav>' + links + '</nav>' +
      '<button type="button" id="gk-toggle">番号を隠す</button></div>' +
      (PAGE === 'item' ? '<div class="gk-row gk-note">商品名・価格・短い説明・「この商品について」の表は商品ごとに違うので、番号はありません。シート「商品説明」に9商品ぶん書いてください。見本の写真は「ささみ」です。</div>' : '');
    document.body.insertBefore(bar, document.body.firstChild);
    document.getElementById('gk-toggle').addEventListener('click', function () {
      var off = document.documentElement.classList.toggle('gk-off');
      this.textContent = off ? '番号を出す' : '番号を隠す';
    });
  }

  function start() {
    collect();
    toolbar();
    badges();
    window.addEventListener('resize', place);
    window.addEventListener('hashchange', focusHash);
    document.querySelectorAll('img').forEach(function (i) { i.addEventListener('load', place); });
    setInterval(place, 1000);
    setTimeout(focusHash, 300);
    // シートを作るときに読む一覧
    window.__GK = {
      texts: texts.map(function (t) { return { id: t.id, common: t.common, page: t.page, section: t.section, kind: t.kind, text: t.text }; }),
      photos: photos.map(function (p) {
        var r = p.el.getBoundingClientRect();
        return { name: p.name, first: p.first, page: p.page, section: p.section, hint: p.hint,
                 w: Math.round(r.width), h: Math.round(r.height), src: p.el.getAttribute('src') };
      })
    };
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
