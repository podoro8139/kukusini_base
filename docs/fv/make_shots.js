const { chromium } = require('playwright');
const T = '.kk-hero > .kk-in:first-child';
const BAN = 'body > div:first-child[style*="f3e6da"]{display:none}';
// PC（900px以上）の共通リセット：いまの「重ねたカード」をいったん外す
const PCR = `${T}{background:none!important;box-shadow:none!important;border-radius:0!important;max-width:none!important;padding:0!important;margin:0!important}`;
// スマホ：.kk-hero をグリッドにして、写真とキャッチを重ねられるようにする
const SPG = `.kk-hero{padding-top:0!important;display:grid!important;grid-template-columns:minmax(0,1fr)}
 .kk-hero>*{min-width:0} .kk-hero>.kk-hero-img{grid-row:1;grid-column:1;margin-top:0!important;width:100%;overflow:hidden}
 .kk-hero>.kk-in:not(:first-child){grid-row:2;grid-column:1}
 .kk-banners{margin-top:14px!important;gap:10px!important} .kk-bn{padding:8px!important;grid-template-columns:64px minmax(0,1fr) 12px!important;gap:12px!important}
 .kk-bn img{width:64px!important;height:64px!important} .kk-bn b{font-size:16px!important}`;
const SPOVER = `${T}{grid-row:1;grid-column:1;z-index:2;padding:0!important;margin:0!important}`;
const SH = 'text-shadow:0 2px 10px rgba(0,0,0,.4)';
const V = {
 A: { pc: PCR + `@media(min-width:900px){
   .kk-hero{grid-template-columns:minmax(0,1.6fr) minmax(400px,1fr)!important;max-width:1200px;margin:28px auto 0;padding:0 24px!important;box-sizing:border-box}
   .kk-hero>.kk-hero-img{grid-column:1!important;grid-row:1!important;margin:0!important} .kk-hero-img img{height:clamp(340px,calc(100vh - 300px),560px)!important;border-radius:4px}
   ${T}{grid-column:2!important;grid-row:1!important;justify-self:stretch!important;align-self:center!important;padding:0 clamp(28px,4vw,64px)!important;text-align:left}
   ${T} .kk-catch{white-space:nowrap;font-size:clamp(22px,2vw,30px)!important}
   .kk-hero>.kk-in:not(:first-child){grid-column:1/-1!important}}`,
   sp: SPG + `.kk-hero>.kk-hero-img{grid-row:1} ${T}{grid-row:2;grid-column:1;padding:22px 20px 0!important;text-align:left}
   ${T} .kk-catch{font-size:24px!important;margin-bottom:8px!important} ${T} .kk-hero-lead{font-size:13px!important}
   .kk-hero>.kk-in:not(:first-child){grid-row:3} .kk-hero-img img{aspect-ratio:auto!important;height:300px!important}` },
 D: { pc: PCR + `.kk-mv::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,rgba(20,24,20,.55) 0%,rgba(20,24,20,.25) 40%,rgba(20,24,20,0) 65%)}
   @media(min-width:900px){${T}{justify-self:start!important;align-self:end!important;margin:0 0 64px clamp(32px,7vw,120px)!important;color:#fff;text-align:left}
   ${T} .kk-catch{font-size:clamp(32px,3.2vw,48px)!important;white-space:nowrap;${SH}} ${T} .kk-hero-lead{color:#fff!important;${SH}}}`,
   sp: SPG + SPOVER + `.kk-mv::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(0deg,rgba(20,24,20,.6) 0%,rgba(20,24,20,.2) 45%,rgba(20,24,20,0) 70%)}
   .kk-hero-img img{aspect-ratio:auto!important;height:470px!important} ${T}{align-self:end;padding:0 20px 34px!important;color:#fff;text-align:left}
   ${T} .kk-catch{font-size:26px!important;margin-bottom:8px!important;${SH}} ${T} .kk-hero-lead{color:#fff!important;font-size:13px!important;${SH}} .kk-mv .swiper-pagination{bottom:10px!important}` },
 E: { pc: PCR + `@media(min-width:900px){${T}{justify-self:start!important;align-self:stretch!important;width:min(48%,820px);display:flex;flex-direction:column;justify-content:center;
   padding:0 12% 0 clamp(32px,6vw,110px)!important;background:rgba(47,74,58,.78)!important;color:#fff;clip-path:polygon(0 0,100% 0,72% 100%,0 100%);text-align:left}
   ${T} .kk-catch{font-size:clamp(30px,3vw,44px)!important;white-space:nowrap} ${T} .kk-hero-lead{color:rgba(255,255,255,.9)!important;max-width:24em}}`,
   sp: SPG + SPOVER + `.kk-hero-img img{aspect-ratio:auto!important;height:470px!important}
   ${T}{align-self:end;padding:46px 20px 30px!important;background:rgba(47,74,58,.8)!important;color:#fff;text-align:left;clip-path:polygon(0 18%,100% 0,100% 100%,0 100%)}
   ${T} .kk-catch{font-size:24px!important;margin-bottom:8px!important} ${T} .kk-hero-lead{color:rgba(255,255,255,.9)!important;font-size:13px!important} .kk-mv .swiper-pagination{display:none}` },
 F: { pc: PCR + `.kk-mv::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(270deg,rgba(20,24,20,.5) 0%,rgba(20,24,20,.15) 30%,rgba(20,24,20,0) 45%)}
   @media(min-width:900px){${T}{justify-self:end!important;align-self:center!important;margin-right:clamp(40px,8vw,140px)!important;color:#fff;writing-mode:vertical-rl;height:clamp(300px,calc(100vh - 380px),460px)}
   ${T} .kk-catch{font-size:clamp(30px,2.8vw,42px)!important;letter-spacing:.24em!important;margin:0!important;${SH}} ${T} .kk-hero-lead{display:none!important}}`,
   sp: SPG + SPOVER + `.kk-mv::after{content:"";position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(270deg,rgba(20,24,20,.55) 0%,rgba(20,24,20,0) 45%)}
   .kk-hero-img img{aspect-ratio:auto!important;height:470px!important} ${T}{justify-self:end;align-self:start;margin:28px 18px 0 0!important;color:#fff;writing-mode:vertical-rl;height:360px}
   ${T} .kk-catch{font-size:27px!important;letter-spacing:.2em!important;margin:0!important;${SH}} ${T} .kk-hero-lead{display:none!important}` },
 G: { pc: PCR + `@media(min-width:900px){.kk-hero>.kk-hero-img{width:68%!important;justify-self:end!important;margin:24px 0 0 auto!important}
   .kk-hero-img img{height:clamp(340px,calc(100vh - 290px),600px)!important}
   ${T}{justify-self:start!important;align-self:center!important;margin-left:max(24px,calc((100% - 1200px)/2))!important;padding:44px 52px!important;background:var(--kk-paper)!important;box-shadow:0 10px 40px rgba(40,36,28,.14)!important;border-radius:2px!important;max-width:520px!important;text-align:left}
   ${T} .kk-catch{font-size:clamp(26px,2.4vw,36px)!important;white-space:nowrap}}`,
   sp: SPG + `.kk-hero>.kk-hero-img{width:88%!important;justify-self:end;margin-top:16px!important} .kk-hero-img img{aspect-ratio:auto!important;height:380px!important}
   ${T}{grid-row:1;grid-column:1;z-index:2;align-self:end;justify-self:start;margin:0 0 -40px 16px!important;padding:20px 22px!important;background:var(--kk-paper);box-shadow:0 8px 28px rgba(40,36,28,.16);text-align:left;max-width:350px}
   ${T} .kk-catch{font-size:20px!important;margin-bottom:6px!important;white-space:nowrap} ${T} .kk-hero-lead{font-size:12px!important;line-height:1.8}
   .kk-hero>.kk-in:not(:first-child){padding-top:40px} .kk-mv .swiper-pagination{display:none}` },
 H: { pc: PCR + `.kk-mv .swiper-wrapper{transform:none!important;display:grid!important;grid-template-columns:1fr 1.25fr 1fr;gap:10px}
   .kk-mv .swiper-slide{width:auto!important;margin:0!important} .kk-mv .swiper-pagination,.kk-mv .swiper-button-prev,.kk-mv .swiper-button-next{display:none!important}
   @media(min-width:900px){.kk-hero>.kk-hero-img{padding:0 10px;box-sizing:border-box} .kk-hero-img img{height:clamp(320px,calc(100vh - 300px),560px)!important;border-radius:3px}
   ${T}{justify-self:center!important;align-self:center!important;padding:30px 48px!important;background:rgba(255,253,249,.92)!important;box-shadow:0 8px 32px rgba(40,36,28,.18)!important;text-align:center!important}
   ${T} .kk-catch{font-size:clamp(26px,2.4vw,36px)!important;white-space:nowrap}}`,
   sp: SPG + SPOVER + `.kk-mv .swiper-wrapper{transform:none!important;display:grid!important;grid-template-columns:1fr 1fr;grid-template-rows:280px 150px;gap:6px}
   .kk-mv .swiper-slide{width:auto!important;margin:0!important} .kk-mv .swiper-slide:first-child{grid-column:1/-1}
   .kk-mv .swiper-pagination,.kk-mv .swiper-button-prev,.kk-mv .swiper-button-next{display:none!important} .kk-hero-img img{aspect-ratio:auto!important;height:100%!important}
   ${T}{align-self:start;justify-self:center;margin-top:206px!important;padding:16px 20px!important;background:rgba(255,253,249,.94);box-shadow:0 6px 24px rgba(40,36,28,.2);text-align:center}
   ${T} .kk-catch{font-size:20px!important;margin:0!important} ${T} .kk-hero-lead{display:none!important}` },
 BS: { js: `const h=document.querySelector('.kk-hero'); const d=document.createElement('div'); d.className='mk-small'; d.innerHTML='<img src="img/sasami.jpg" alt="">'; h.appendChild(d);`,
   pc: PCR + `@media(min-width:900px){
   .kk-hero{grid-template-columns:minmax(360px,1fr) minmax(0,1.75fr)!important;max-width:1240px;margin:26px auto 0;padding:0 24px!important;box-sizing:border-box;column-gap:48px}
   .kk-hero>.kk-hero-img{grid-column:2!important;grid-row:1!important;margin:0!important} .kk-hero-img img{height:clamp(340px,calc(100vh - 320px),540px)!important;border-radius:2px}
   ${T}{grid-column:1!important;grid-row:1!important;justify-self:stretch!important;align-self:start!important;margin-top:clamp(40px,8vh,90px)!important;text-align:left}
   ${T} .kk-catch{font-size:clamp(26px,2.5vw,36px)!important;white-space:nowrap}
   .mk-small{grid-column:2;grid-row:1;z-index:3;align-self:end;justify-self:start;width:28%;margin:0 0 -22px -12%;background:var(--kk-paper);padding:8px;box-shadow:0 8px 24px rgba(40,36,28,.14)}
   .mk-small img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}
   .kk-hero>.kk-in:not(:first-child){grid-column:1/-1!important;grid-row:2!important} .kk-banners{margin-top:58px!important}}`,
   sp: SPG + `${T}{grid-row:1;padding:26px 20px 18px!important;text-align:left} ${T} .kk-catch{font-size:24px!important;margin-bottom:8px!important} ${T} .kk-hero-lead{font-size:13px!important}
   .kk-hero>.kk-hero-img{grid-row:2;width:84%!important;justify-self:end} .kk-hero-img img{aspect-ratio:auto!important;height:300px!important}
   .mk-small{grid-row:2;grid-column:1;z-index:3;align-self:end;justify-self:start;width:42%;margin:0 0 -26px 16px;background:var(--kk-paper);padding:5px;box-shadow:0 6px 18px rgba(40,36,28,.16)}
   .mk-small img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover} .kk-hero>.kk-in:not(:first-child){grid-row:3;padding-top:40px} .kk-mv .swiper-pagination{display:none}` },
 FR: { js: `const t=document.querySelector('.kk-hero > .kk-in:first-child'); const e=document.createElement('p'); e.className='kk-eyebrow mk-eb'; e.textContent='Natural dog treats'; t.insertBefore(e,t.firstChild); const r=document.createElement('span'); r.className='mk-rule'; t.insertBefore(r, t.querySelector('.kk-hero-lead'));`,
   pc: PCR + `@media(min-width:900px){
   .kk-hero{grid-template-columns:minmax(0,1fr) minmax(0,1.3fr)!important;max-width:1180px;margin:36px auto 0;padding:0 24px!important;box-sizing:border-box;column-gap:0}
   .kk-hero::before{content:"";grid-row:1;grid-column:1/-1;border:1px solid #c9c2b2;margin:-20px;pointer-events:none}
   .kk-hero>.kk-hero-img{grid-column:2!important;grid-row:1!important;margin:0!important} .kk-hero-img img{height:clamp(320px,calc(100vh - 340px),500px)!important}
   ${T}{grid-column:1!important;grid-row:1!important;justify-self:stretch!important;align-self:center!important;padding:0 40px 0 36px!important;text-align:left}
   ${T} .mk-eb{margin:0 0 18px!important;letter-spacing:.2em} ${T} .kk-catch{font-size:clamp(24px,2.3vw,32px)!important;white-space:nowrap;margin-bottom:22px!important}
   .mk-rule{display:block;width:40px;height:1px;background:#a6a18d;margin:0 0 20px} ${T} .kk-hero-lead{font-size:13.5px!important}
   .kk-hero>.kk-in:not(:first-child){grid-column:1/-1!important;grid-row:2!important} .kk-banners{margin-top:44px!important}}`,
   sp: SPG + `.kk-hero{margin:14px 14px 0!important;width:auto!important} .kk-hero::before{content:"";grid-row:1/span 2;grid-column:1;border:1px solid #c9c2b2;pointer-events:none}
   .kk-hero>.kk-hero-img{grid-row:2;padding:0 14px 14px;box-sizing:border-box} .kk-hero-img img{aspect-ratio:auto!important;height:280px!important}
   ${T}{grid-row:1;grid-column:1;padding:24px 22px 18px!important;text-align:left} ${T} .mk-eb{margin:0 0 10px!important;letter-spacing:.18em;font-size:11px}
   ${T} .kk-catch{font-size:22px!important;margin-bottom:12px!important} .mk-rule{display:block;width:32px;height:1px;background:#a6a18d;margin:0 0 12px} ${T} .kk-hero-lead{font-size:12.5px!important}
   .kk-hero>.kk-in:not(:first-child){grid-row:3;padding:0!important} .kk-banners{margin-top:16px!important} .kk-mv .swiper-pagination{display:none}` },
 BN: { js: `document.querySelector('.kk-hero > .kk-in:first-child').appendChild(document.querySelector('.kk-banners'));`,
   pc: PCR + `@media(min-width:900px){
   .kk-hero{grid-template-columns:minmax(400px,1fr) minmax(0,1.45fr)!important;max-width:1280px;margin:24px auto 0;padding:0 24px!important;box-sizing:border-box;column-gap:56px}
   .kk-hero>.kk-hero-img{grid-column:2!important;grid-row:1!important;margin:0!important} .kk-hero-img img{height:clamp(400px,calc(100vh - 140px),660px)!important;border-radius:2px}
   ${T}{grid-column:1!important;grid-row:1!important;justify-self:stretch!important;align-self:center!important;text-align:left}
   ${T} .kk-catch{font-size:clamp(26px,2.5vw,36px)!important;white-space:nowrap} ${T} .kk-hero-lead{margin-bottom:30px!important}
   ${T} .kk-banners{display:flex!important;flex-direction:column;gap:12px!important;margin:0!important;max-width:420px}
   ${T} .kk-bn{grid-template-columns:minmax(0,1fr) 16px!important;padding:14px 20px!important;box-shadow:none!important;border-radius:2px!important;border:1px solid var(--kk-green)!important}
   ${T} .kk-bn img{display:none!important} ${T} .kk-bn:first-child{background:var(--kk-green)!important;color:#fff!important} ${T} .kk-bn:first-child *{color:#fff!important}
   ${T} .kk-bn:first-child .kk-tag{background:rgba(255,255,255,.18)!important} ${T} .kk-bn b{font-size:17px!important}
   .kk-hero>.kk-in:not(:first-child){display:none}}`,
   sp: SPG + `.kk-hero>.kk-hero-img{grid-row:1} .kk-hero-img img{aspect-ratio:auto!important;height:330px!important}
   ${T}{grid-row:2;padding:22px 20px 0!important;text-align:left} ${T} .kk-catch{font-size:23px!important;margin-bottom:6px!important} ${T} .kk-hero-lead{font-size:12.5px!important;margin-bottom:16px!important}
   ${T} .kk-banners{display:flex!important;flex-direction:column;gap:10px!important;margin:0!important}
   ${T} .kk-bn{grid-template-columns:minmax(0,1fr) 12px!important;padding:11px 16px!important;box-shadow:none!important;border-radius:2px!important;border:1px solid var(--kk-green)!important}
   ${T} .kk-bn img{display:none!important} ${T} .kk-bn:first-child{background:var(--kk-green)!important} ${T} .kk-bn:first-child *{color:#fff!important}
   ${T} .kk-bn:first-child .kk-tag{background:rgba(255,255,255,.18)!important} ${T} .kk-bn b{font-size:16px!important} .kk-hero>.kk-in:not(:first-child){display:none} .kk-mv .swiper-pagination{bottom:8px!important}` },
 C: { pc: '', sp: '' },
 P: { pc: `@media(min-width:900px){.kk-hero{display:block!important;padding-top:72px!important;text-align:center}
   ${T}{background:none!important;box-shadow:none!important;max-width:none!important;margin:0 auto!important;padding:0 24px!important;text-align:center!important;width:auto!important}
   ${T} .kk-catch{font-size:clamp(26px,4.4vw,44px)!important;white-space:normal!important;margin:0 0 20px!important} ${T} .kk-hero-lead{font-size:14.5px!important}
   .kk-hero-img{margin-top:40px!important} .kk-hero-img img{height:auto!important;aspect-ratio:16/7!important}
   .kk-banners{margin-top:-36px!important}}`, sp: '' },
};
(async () => {
  const b = await chromium.launch(); const [file,out]=process.argv.slice(2);
  for (const [k,v] of Object.entries(V)) { if (process.argv[4] && !process.argv[4].split(',').includes(k)) continue;
    for (const [dev,vp,css] of [['pc',{width:1440,height:860},v.pc],['sp',{width:390,height:844},v.sp]]) {
      const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 2, isMobile: dev==='sp', hasTouch: dev==='sp' });
      const p = await ctx.newPage();
      await p.goto('file://'+file); await p.waitForTimeout(700);
      if (v.js) await p.evaluate(v.js);
      await p.addStyleTag({content: (dev==='sp' ? `@media(max-width:899px){${css}}` : css) + BAN});
      await p.evaluate(()=>{ if(window.kkMv){ window.kkMv.autoplay.stop(); window.kkMv.update(); window.kkMv.slideToLoop(0,0);} window.scrollTo(0,0); });
      await p.waitForTimeout(500);
      await p.screenshot({ path: `${out}/${k}-${dev}.jpg`, type:'jpeg', quality: 80 });
      await ctx.close();
    }
  }
  await b.close();
})();
