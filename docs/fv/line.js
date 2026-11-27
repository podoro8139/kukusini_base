const { chromium } = require('playwright');
const LINE = process.argv[4] || '淡路どりでつくる、犬の無添加おやつ';
(async () => { const b = await chromium.launch(); const [file,out]=process.argv.slice(2);
 for (const [dev,vp] of [['pc',{width:1440,height:860}],['sp',{width:390,height:844}]]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: dev==='sp', hasTouch: dev==='sp' });
  const p = await ctx.newPage(); await p.goto('file://'+file); await p.waitForTimeout(700);
  await p.evaluate((t)=>{ const eb=document.querySelector('.kk-hero-eb'); eb.textContent=t; eb.classList.add('mk-line');
    if(window.kkMv){window.kkMv.autoplay.stop(); window.kkMv.slideToLoop(0,0);} window.scrollTo(0,0); }, LINE);
  await p.addStyleTag({content:`body > div:first-child[style*="f3e6da"]{display:none}
    .kk-hero-eb.mk-line{display:block!important;font-family:var(--kk-sans)!important;text-transform:none!important;letter-spacing:.1em!important;font-weight:500}
    @media(min-width:900px){.kk-hero-eb.mk-line{color:#fff!important;font-size:15px!important;margin:0 0 14px!important;text-shadow:0 1px 8px rgba(0,0,0,.45)}}
    @media(max-width:899px){.kk-hero-eb.mk-line{font-size:12.5px!important;margin:0 0 10px!important}}`});
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/LINE-${dev}.jpg`, type:'jpeg', quality:82 }); await ctx.close(); }
 await b.close(); })();
