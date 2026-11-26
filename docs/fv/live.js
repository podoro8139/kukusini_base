const { chromium } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const [dev,vp] of [['pc',{width:1440,height:860}],['sp',{width:390,height:844}]]) {
    const ctx = await b.newContext({ locale:'ja-JP', timezoneId:'Asia/Tokyo', viewport: vp, deviceScaleFactor: 2, isMobile: dev==='sp', hasTouch: dev==='sp',
      userAgent: dev==='sp' ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' : undefined });
    const p = await ctx.newPage();
    await p.goto('https://shop.kukusini.com/', {waitUntil:'networkidle', timeout:60000}).catch(e=>console.log('goto',e.message));
    await p.waitForTimeout(2000); const btn = p.getByText('Continue to shop'); if (await btn.count()) { await btn.first().click().catch(()=>{}); await p.waitForTimeout(1200); }
    await p.screenshot({ path: `${process.argv[2]}/NOW-${dev}.jpg`, type:'jpeg', quality:80 });
    await ctx.close();
  }
  await b.close(); })();
