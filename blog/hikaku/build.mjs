// 商品比較ブログ用の画像を作る：node blog/hikaku/build.mjs
// BASE のブログ編集には表が無いので、比較表は画像にして「画像」ボタンで貼る。
// 数字・名前・価格を変えたら下の ITEMS を直して再実行 → img/ の PNG を貼り直す。
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'img');
const dataUri = f => 'data:image/' + (f.endsWith('.png') ? 'png' : 'jpeg') + ';base64,' + fs.readFileSync(f).toString('base64');

// 出典：data/products.csv（硬さ・香りは南さんの実感値 ☆1〜5）。表示名はサイトの「選び方」と同じ
const ITEMS = [
  { g: 'soft',  name: 'ささみ',        hard: 1, aroma: 4, who: '全犬種。迷ったらまずこれ', pop: true },
  { g: 'soft',  name: 'むね',          hard: 2, aroma: 2, who: '全犬種。ささみが合わない子にも' },
  { g: 'soft',  name: 'きも（レバー）', hard: 1, aroma: 5, who: '小型犬・食いムラのある子' },
  { g: 'soft',  name: '鶏頭',          hard: 2, aroma: 1, who: '噛むのが好きな子（小型犬も）' },
  { g: 'chew',  name: '砂肝',          hard: 3, aroma: 3, who: '噛みごたえ好き・ダイエット中' },
  { g: 'chew',  name: '軟骨入りセセリ', hard: 3, aroma: 2, who: '小型犬・カルシウムを摂りたい子', dx: 24 },
  { g: 'chew',  name: '手羽先',        hard: 4, aroma: 1, who: '骨が好きな5kg以上の子' },
  { g: 'chew',  name: '鶏足',          hard: 5, aroma: 1, who: '硬いもの好きの大型犬' },
  { g: 'meal',  name: 'ささみふりかけ', hard: 0, aroma: 5, who: 'シニア・食の細い子' },
];
const GROUPS = {
  soft: { label: 'やわらかめ', sub: '手で割れる。はじめてやシニアにも' },
  chew: { label: '噛みごたえ', sub: '噛むのが好きな子に' },
  meal: { label: 'ごはんにかける', sub: '食が細い子・水分補給に' },
};

const FONT = 'https://cdn.jsdelivr.net/npm/@fontsource';
const BASE_CSS = `
@font-face { font-family: NS; font-weight: 400; src: url(${FONT}/noto-sans-jp@5.0.19/files/noto-sans-jp-japanese-400-normal.woff2); }
@font-face { font-family: NS; font-weight: 700; src: url(${FONT}/noto-sans-jp@5.0.19/files/noto-sans-jp-japanese-700-normal.woff2); }
@font-face { font-family: MC; font-weight: 700; src: url(${FONT}/shippori-mincho@5.0.15/files/shippori-mincho-japanese-700-normal.woff2); }
:root { --bg: #f7f5f0; --paper: #fffdf9; --ink: #2a302b; --muted: #6f756f; --line: #ddd8cc;
  --green: #2f4a3a; --green-soft: #e8ece6; --kraft: #b98d5f; --kraft-soft: #f3ebe1; }
* { box-sizing: border-box; margin: 0; padding: 0; }
body { width: 1080px; background: var(--bg); color: var(--ink); font-family: NS, sans-serif; }
.wrap { padding: 64px 60px 56px; }
.eyebrow { font-size: 22px; letter-spacing: .2em; color: var(--kraft); }
h1 { font-family: MC, serif; font-weight: 700; font-size: 54px; letter-spacing: .02em; margin-top: 10px; line-height: 1.4; }
.lead { font-size: 25px; color: var(--muted); margin-top: 14px; line-height: 1.7; }
.foot { font-size: 21px; color: var(--muted); margin-top: 28px; line-height: 1.7; }
.brand { font-family: MC, serif; font-size: 24px; letter-spacing: .25em; color: var(--green); text-align: right; margin-top: 18px; }
.c-soft { --c: var(--green); --cs: var(--green-soft); }
.c-chew { --c: var(--kraft); --cs: var(--kraft-soft); }
.c-meal { --c: #7a6a3a; --cs: #efe9d6; }
`;

const dots = (n, c = 'var(--c)') => n === 0 ? '<span class="na">粉末</span>' :
  '<span class="dots">' + [1,2,3,4,5].map(i => `<i style="background:${i <= n ? c : 'transparent'};border-color:${c}"></i>`).join('') + '</span>';

// ⓪ 記事の最初に置く「選び方」画像（パッケージ写真入り）
// 写真は wireframes/mock/img/lineup.jpg から切り出したもの（blog/hikaku/src/pkg_*.jpg）
const FEATURED = [
  { id: 'sasami',   name: 'ささみ',        tag: '初めての1袋に',   accent: '#f2c230', bar: '全犬種 / トッピングにも' },
  { id: 'mune',     name: 'むね',          tag: 'やさしい味わい',   accent: '#ec8fa3', bar: 'ささみが合わない子にも' },
  { id: 'tebasaki', name: '手羽先',        tag: '骨が好きな子に',   accent: '#c5d93a', bar: '5kg以上 / パリパリ食感' },
  { id: 'neck',     name: '軟骨入りセセリ', sub: 'ネック', tag: 'ザクザク食感', accent: '#8cc37e', bar: '小型犬 / カルシウム / しつけ用にも' },
  { id: 'furikake', name: 'ささみふりかけ', tag: 'ごはんにプラス',   accent: '#f07a45', bar: 'シニア / 食の細い子 / 水分補給に' },
];
const PKG = { sasami: 'ささみ', mune: 'むね', tebasaki: '手羽先', neck: '軟骨入りセセリ', furikake: 'ささみふりかけ' };
const stars = n => n === 0 ? '<span class="pw">粉末</span>' :
  '<span class="st">' + [1,2,3,4,5].map(i => `<i class="${i <= n ? 'on' : ''}">★</i>`).join('') + '</span>';

function heroHtml() {
  const card = f => {
    const it = ITEMS.find(i => i.name === PKG[f.id]);
    return `<div class="card" style="--a:${f.accent}">
      <p class="tag">${f.tag}</p>
      <h2>${f.name}${f.sub ? `<small>（${f.sub}）</small>` : ''}${it.pop ? '<em>人気No.1</em>' : ''}</h2>
      <div class="body">
        <img src="${dataUri(path.join(DIR, 'src', 'pkg_' + f.id + '.jpg'))}" alt="">
        <dl><dt>かたさ</dt><dd>${stars(it.hard)}</dd><dt>香り</dt><dd>${stars(it.aroma)}</dd></dl>
      </div>
      <p class="bar">${f.bar}</p>
    </div>`;
  };
  return `<style>${BASE_CSS}
  body { background: #f4efe6; }
  .wrap { padding: 56px 48px 48px; }
  .logo { display: block; height: 58px; margin: 0 auto; }
  .kicker { text-align: center; font-size: 30px; font-weight: 700; color: var(--kraft); margin-top: 26px; letter-spacing: .1em; }
  h1 { text-align: center; font-size: 60px; margin-top: 4px; }
  h1 span { background: linear-gradient(transparent 68%, #f6dc8a 68%); padding: 0 6px; }
  .lead { text-align: center; margin-top: 10px; }
  .how { display: flex; align-items: center; gap: 24px; background: var(--paper); border-radius: 18px; padding: 20px 28px; margin-top: 34px; }
  .how b { background: #f1e2d0; color: #8a5a2b; font-size: 22px; padding: 12px 18px; border-radius: 10px; white-space: nowrap; }
  .how p { font-size: 22px; line-height: 1.6; flex: 1; } .how p strong { font-size: 25px; }
  .how p + p { border-left: 1px solid var(--line); padding-left: 24px; }
  .grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 20px; margin-top: 28px; }
  .card { grid-column: span 2; background: var(--paper); border-radius: 22px; padding: 22px 20px 20px; display: flex; flex-direction: column; align-items: center;
    box-shadow: 0 3px 0 rgba(120, 90, 50, .08); }
  .card:nth-child(n+4) { grid-column: span 3; }
  .tag { background: color-mix(in srgb, var(--a) 35%, #fff); font-weight: 700; font-size: 22px; padding: 5px 20px; border-radius: 999px; }
  .card h2 { font-size: 40px; font-weight: 700; margin-top: 10px; letter-spacing: .04em; white-space: nowrap; text-align: center; line-height: 1.3; }
  .card h2 small { font-size: 20px; font-weight: 400; color: var(--muted); }
  .card h2 em { display: block; font-style: normal; font-size: 18px; color: #8a5a2b; letter-spacing: .1em; }
  .body { display: flex; gap: 14px; align-items: center; margin-top: 12px; width: 100%; justify-content: center; }
  .body img { width: 132px; border-radius: 6px; }
  .card:nth-child(n+4) .body img { width: 150px; }
  dl { font-size: 22px; } dt { font-weight: 700; } dd { margin: 2px 0 12px; }
  .st { font-size: 27px; letter-spacing: -2px; color: #e2dbcd; } .st .on { color: #e0a526; font-style: normal; } .st i { font-style: normal; }
  .pw { font-size: 21px; color: var(--muted); }
  .bar { margin-top: auto; width: 100%; text-align: center; background: color-mix(in srgb, var(--a) 22%, #fff); border-radius: 12px; padding: 12px 10px; font-size: 21px; line-height: 1.5; font-weight: 700; }
  .body { margin-bottom: 14px; }
  .pick { margin-top: 30px; background: #ebe0cf; border-radius: 22px; padding: 26px 24px 24px; }
  .pick h3 { text-align: center; font-size: 32px; color: #6b4a2a; letter-spacing: .1em; }
  .tiles { display: grid; grid-template-columns: repeat(2, 1fr); gap: 14px; margin-top: 18px; }
  .tiles p { background: var(--paper); border-radius: 14px; padding: 16px 22px; font-size: 23px; line-height: 1.5; }
  .tiles b { display: block; font-size: 30px; color: var(--green); }
  .more { text-align: center; font-size: 22px; margin-top: 24px; line-height: 1.7; }
  .more b { color: var(--green); }
  .foot { text-align: center; font-size: 19px; margin-top: 10px; }
  </style>
  <div class="wrap">
    <img class="logo" src="${dataUri(path.join(DIR, '../../wireframes/mock/img/logo.png'))}" alt="kukusini">
    <p class="kicker">どれにする？</p>
    <h1><span>淡路どりジャーキーの選び方</span></h1>
    <p class="lead">かたさと香りで、うちの子に合う1袋を。</p>
    <div class="how"><b>見方</b>
      <p><strong>★ かたさ</strong><br>多いほどかたく、噛みごたえあり</p>
      <p><strong>★ 香り</strong><br>多いほど鶏の香りが強い</p>
    </div>
    <div class="grid">${FEATURED.map(card).join('')}</div>
    <div class="pick"><h3>こんな子には、これ</h3>
      <div class="tiles">
        <p>はじめてなら<b>→ ささみ</b></p>
        <p>噛むのが好きなら<b>→ 手羽先</b></p>
        <p>食が細くなってきたら<b>→ ささみふりかけ</b></p>
        <p>香りの強いものが好きなら<b>→ きも（レバー）</b></p>
      </div>
    </div>
    <p class="more">このほか <b>きも（レバー）・砂肝・鶏足・鶏頭</b> も。<br>全9種の比較は、記事の下の早見表で。</p>
    <p class="foot">※★の数は作り手の実感による5段階です。</p>
  </div>`;
}

// ① かたさ × 香り のマップ
function mapHtml() {
  const W = 960, H = 760, pad = { l: 120, r: 20, t: 20, b: 70 };
  const cw = (W - pad.l - pad.r) / 5, ch = (H - pad.t - pad.b) / 5;
  const cx = h => pad.l + cw * (h - .5), cy = a => pad.t + ch * (5.5 - a);
  const pts = ITEMS.filter(i => i.hard > 0).map(i => `
    <div class="pt c-${i.g}" style="left:${cx(i.hard) + (i.dx || 0)}px;top:${cy(i.aroma)}px">${i.name}${i.pop ? '<b>人気No.1</b>' : ''}</div>`).join('');
  const grid = [...Array(6)].map((_, k) => `
    <div class="vl" style="left:${pad.l + cw * k}px;top:${pad.t}px;height:${ch * 5}px"></div>
    <div class="hl" style="top:${pad.t + ch * k}px;left:${pad.l}px;width:${cw * 5}px"></div>`).join('');
  const meal = ITEMS.find(i => i.g === 'meal');
  return `<style>${BASE_CSS}
  .map { position: relative; width: ${W}px; height: ${H}px; margin-top: 40px; background: var(--paper); border-radius: 8px; }
  .vl, .hl { position: absolute; background: var(--line); } .vl { width: 1px; } .hl { height: 1px; }
  .pt { position: absolute; transform: translate(-50%, -50%); background: var(--c); color: #fff; font-weight: 700; font-size: 25px;
    padding: 9px 18px; border-radius: 999px; white-space: nowrap; box-shadow: 0 2px 0 rgba(0,0,0,.08); text-align: center; line-height: 1.3; }
  .pt b { display: block; font-size: 17px; font-weight: 400; letter-spacing: .05em; opacity: .9; }
  .ax { position: absolute; font-size: 22px; color: var(--muted); }
  .ax b { color: var(--ink); font-weight: 700; }
  .legend { display: flex; gap: 28px; margin-top: 26px; font-size: 23px; }
  .legend span::before { content: ""; display: inline-block; width: 18px; height: 18px; border-radius: 50%; background: var(--c); margin-right: 8px; vertical-align: -2px; }
  .meal { margin-top: 22px; background: var(--cs); border-left: 6px solid var(--c); padding: 16px 22px; font-size: 24px; line-height: 1.6; border-radius: 4px; }
  </style>
  <div class="wrap">
    <p class="eyebrow">CHART</p>
    <h1>かたさと香りで見る、全9種</h1>
    <p class="lead">右へいくほどかたく、上へいくほど香りが強い。</p>
    <div class="map">${grid}${pts}
      <div class="ax" style="left:${pad.l}px;bottom:18px">← <b>やわらかい</b></div>
      <div class="ax" style="right:${pad.r}px;bottom:18px"><b>かたい</b> →</div>
      <div class="ax" style="left:24px;top:${pad.t + 4}px;writing-mode:vertical-rl"><b>香り 強い</b></div>
      <div class="ax" style="left:24px;bottom:${pad.b + 4}px;writing-mode:vertical-rl">ひかえめ</div>
    </div>
    <div class="legend"><span class="c-soft">やわらかめ</span><span class="c-chew">噛みごたえ</span></div>
    <div class="meal c-meal"><b>${meal.name}</b>（香り ${'★'.repeat(meal.aroma)}）はフードにかける粉末タイプです。</div>
    <p class="foot">※かたさ・香りは作り手の実感による5段階です。</p>
    <p class="brand">kukusini</p>
  </div>`;
}

// ② 比較早見表
function tableHtml() {
  const rows = Object.entries(GROUPS).map(([g, G]) => `
    <tr class="gh c-${g}"><th colspan="3"><span>${G.label}</span><small>${G.sub}</small></th></tr>` +
    ITEMS.filter(i => i.g === g).map(i => `
    <tr class="c-${g}">
      <td class="nm">${i.name}${i.pop ? '<em>人気No.1</em>' : ''}<div class="who">${i.who}</div></td>
      <td>${dots(i.hard)}</td><td>${dots(i.aroma)}</td>
    </tr>`).join('')).join('');
  return `<style>${BASE_CSS}
  table { width: 100%; border-collapse: collapse; margin-top: 36px; background: var(--paper); font-size: 25px; }
  thead th { font-size: 21px; color: var(--muted); font-weight: 400; text-align: left; padding: 16px 14px; border-bottom: 2px solid var(--ink); background: var(--bg); }
  td { padding: 20px 14px; border-bottom: 1px solid var(--line); vertical-align: middle; }
  .gh th { text-align: left; background: var(--cs); padding: 14px 18px; border-left: 8px solid var(--c); }
  .gh span { font-family: MC, serif; font-size: 30px; color: var(--c); letter-spacing: .03em; }
  .gh small { font-size: 20px; color: var(--muted); font-weight: 400; margin-left: 16px; }
  .nm { font-weight: 700; font-size: 29px; width: 52%; }
  .nm em { font-style: normal; font-size: 17px; font-weight: 700; color: #fff; background: var(--c); padding: 2px 10px; border-radius: 3px; margin-left: 10px; vertical-align: 4px; }
  .who { font-weight: 400; font-size: 20px; color: var(--muted); margin-top: 4px; }
  .dots { display: inline-flex; gap: 5px; } .dots i { width: 19px; height: 19px; border-radius: 50%; border: 2px solid; display: block; }
  .na { font-size: 21px; color: var(--muted); }
  .sz { font-size: 21px; line-height: 1.6; white-space: nowrap; }
  </style>
  <div class="wrap">
    <p class="eyebrow">COMPARISON</p>
    <h1>全9種 比較早見表</h1>
    <p class="lead">迷ったら、まずは人気No.1のささみから。<br>内容量・価格は各商品ページでご確認ください。</p>
    <table><thead><tr><th>商品・こんな子に</th><th>かたさ</th><th>香り</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="foot">※かたさ・香りは作り手の実感による5段階です。</p>
    <p class="brand">kukusini</p>
  </div>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 800 }, deviceScaleFactor: 1 });
for (const [file, html] of [['00_hero.png', heroHtml()], ['01_map.png', mapHtml()], ['02_table.png', tableHtml()]]) {
  await page.setContent(`<!doctype html><meta charset="utf-8"><body>${html}</body>`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, file), fullPage: true });
  console.log('wrote', file);
}
await browser.close();
