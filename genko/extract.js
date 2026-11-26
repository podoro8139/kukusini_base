// 見本ページを開いて、番号の一覧と写真枠の切り抜きを取り出す（genko/build.py から呼ぶ）
// 使い方: node genko/extract.js <genkoのフォルダ> <出力JSON> <切り抜きの出力フォルダ>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const [dir, outJson, shotDir] = process.argv.slice(2);
  fs.mkdirSync(shotDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const result = {};
  for (const name of ['top', 'about', 'item', 'contact']) {
    await page.goto('file://' + path.resolve(dir, name + '.html'));
    await page.waitForFunction(() => window.__GK);
    // 番号の札が写らないように隠してから写真を切り抜く
    await page.evaluate(() => document.documentElement.classList.add('gk-off'));
    const data = await page.evaluate(() => window.__GK);
    for (const p of data.photos) {
      if (!p.first) continue;
      const el = await page.$('[data-gk-ph="' + p.name + '"]');
      const box = el && await el.boundingBox();
      if (!box || box.width < 2) continue;
      await el.screenshot({ path: path.join(shotDir, p.name + '.png') });
    }
    result[name] = data;
  }
  fs.writeFileSync(outJson, JSON.stringify(result, null, 1));
  await browser.close();
})();
