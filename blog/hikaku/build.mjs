// 商品比較ブログ用の画像を作る：node blog/hikaku/build.mjs
// BASE のブログ編集には表が無いので、比較表は画像にして「画像」ボタンで貼る。
// 数字・名前・価格を変えたら下の ITEMS を直して再実行 → img/ の PNG を貼り直す。
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'img');

// 出典：data/products.csv（硬さ・香りは南さんの実感値 ☆1〜5）。表示名はサイトの「選び方」と同じ
const ITEMS = [
  { g: 'soft',  name: 'ささみ',        hard: 1, aroma: 4, who: '全犬種。迷ったらまずこれ', size: ['500g 5,940円', '60g 990円', '35g 770円'], pop: true },
  { g: 'soft',  name: 'むね',          hard: 2, aroma: 2, who: '全犬種。ささみが合わない子にも', size: ['500g 5,940円', '60g 990円', '35g 770円'] },
  { g: 'soft',  name: 'きも（レバー）', hard: 1, aroma: 5, who: '小型犬・食いムラのある子', size: ['35g 990円', '20g 770円'] },
  { g: 'soft',  name: '鶏頭',          hard: 2, aroma: 1, who: '噛むのが好きな子（小型犬も）', size: ['60g 990円'] },
  { g: 'chew',  name: '砂肝',          hard: 3, aroma: 3, who: '噛みごたえ好き・ダイエット中', size: ['35g 990円', '20g 770円'] },
  { g: 'chew',  name: '軟骨入りセセリ', hard: 3, aroma: 2, who: '小型犬・カルシウムを摂りたい子', dx: 24, size: ['60g 990円', '35g 770円'] },
  { g: 'chew',  name: '手羽先',        hard: 4, aroma: 1, who: '骨が好きな5kg以上の子', size: ['60g 990円', '35g 770円'] },
  { g: 'chew',  name: '鶏足',          hard: 5, aroma: 1, who: '硬いもの好きの大型犬', size: ['60g 990円'] },
  { g: 'meal',  name: 'ささみふりかけ', hard: 0, aroma: 5, who: 'シニア・食の細い子', size: ['60g 1,100円', '35g 825円'] },
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
    <tr class="gh c-${g}"><th colspan="4"><span>${G.label}</span><small>${G.sub}</small></th></tr>` +
    ITEMS.filter(i => i.g === g).map(i => `
    <tr class="c-${g}">
      <td class="nm">${i.name}${i.pop ? '<em>人気No.1</em>' : ''}<div class="who">${i.who}</div></td>
      <td>${dots(i.hard)}</td><td>${dots(i.aroma)}</td>
      <td class="sz">${i.size.join('<br>')}</td>
    </tr>`).join('')).join('');
  return `<style>${BASE_CSS}
  table { width: 100%; border-collapse: collapse; margin-top: 36px; background: var(--paper); font-size: 25px; }
  thead th { font-size: 21px; color: var(--muted); font-weight: 400; text-align: left; padding: 16px 14px; border-bottom: 2px solid var(--ink); background: var(--bg); }
  td { padding: 20px 14px; border-bottom: 1px solid var(--line); vertical-align: middle; }
  .gh th { text-align: left; background: var(--cs); padding: 14px 18px; border-left: 8px solid var(--c); }
  .gh span { font-family: MC, serif; font-size: 30px; color: var(--c); letter-spacing: .03em; }
  .gh small { font-size: 20px; color: var(--muted); font-weight: 400; margin-left: 16px; }
  .nm { font-weight: 700; font-size: 29px; width: 40%; }
  .nm em { font-style: normal; font-size: 17px; font-weight: 700; color: #fff; background: var(--c); padding: 2px 10px; border-radius: 3px; margin-left: 10px; vertical-align: 4px; }
  .who { font-weight: 400; font-size: 20px; color: var(--muted); margin-top: 4px; }
  .dots { display: inline-flex; gap: 5px; } .dots i { width: 19px; height: 19px; border-radius: 50%; border: 2px solid; display: block; }
  .na { font-size: 21px; color: var(--muted); }
  .sz { font-size: 21px; line-height: 1.6; white-space: nowrap; }
  </style>
  <div class="wrap">
    <p class="eyebrow">COMPARISON</p>
    <h1>全9種 比較早見表</h1>
    <p class="lead">迷ったら、まずは人気No.1のささみから。</p>
    <table><thead><tr><th>商品・こんな子に</th><th>かたさ</th><th>香り</th><th>内容量・価格</th></tr></thead><tbody>${rows}</tbody></table>
    <p class="foot">※かたさ・香りは作り手の実感による5段階です。<br>※価格は${new Date().getFullYear()}年${new Date().getMonth() + 1}月時点。最新はショップの各商品ページでご確認ください。</p>
    <p class="brand">kukusini</p>
  </div>`;
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 800 }, deviceScaleFactor: 1 });
for (const [file, html] of [['01_map.png', mapHtml()], ['02_table.png', tableHtml()]]) {
  await page.setContent(`<!doctype html><meta charset="utf-8"><body>${html}</body>`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(OUT, file), fullPage: true });
  console.log('wrote', file);
}
await browser.close();
