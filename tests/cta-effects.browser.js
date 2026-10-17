/* Optional bounded rendered checks. Requires Playwright and a system Chromium. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

test('CTA depth, synchronized glow, scoped blue glow and reduced motion on both routes', { timeout: 45000 }, async () => {
  const root = path.resolve(__dirname, '../dist');
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.join(root, pathname.endsWith('/') ? `${pathname}index.html` : pathname);
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    const stream = fs.createReadStream(file);
    stream.on('error', () => { res.statusCode = 404; res.end(); });
    stream.pipe(res);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    const base = `http://127.0.0.1:${server.address().port}`;
    await page.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.abort());
    for (const route of ['/', '/site/']) {
      for (const width of [320, 390, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        await page.goto(base + route, { waitUntil: 'domcontentloaded' });
        await page.locator('.button-whatsapp').scrollIntoViewIfNeeded();
        const result = await page.evaluate(() => {
          const wrapper = document.querySelector('.whatsapp-depth');
          const button = wrapper.querySelector('.button-whatsapp');
          const depth = wrapper.getAnimations().find(a => a.animationName === 'whatsapp-depth');
          const inner = button.getAnimations({ subtree: true }).find(a => a.animationName === 'whatsapp-pulse');
          const sheen = button.getAnimations({ subtree: true }).find(a => a.animationName === 'whatsapp-sheen');
          depth.pause(); inner.pause();
          depth.currentTime = inner.currentTime = 0;
          const minimum = { transform: getComputedStyle(wrapper).transform, shadow: getComputedStyle(wrapper).boxShadow };
          depth.currentTime = inner.currentTime = 1500;
          const maximum = { transform: getComputedStyle(wrapper).transform, shadow: getComputedStyle(wrapper).boxShadow };
          return {
            minimum, maximum,
            duration: depth.effect.getTiming().duration,
            pulseDuration: inner.effect.getTiming().duration,
            sheen: !!sheen,
            overflow: document.documentElement.scrollWidth > innerWidth,
            buttonWidth: button.getBoundingClientRect().width,
            depthWidth: wrapper.getBoundingClientRect().width,
            blue: [...document.querySelectorAll('.button-site')].map(el => ({ text: el.textContent.trim(), animation: getComputedStyle(el, '::before').animationName })),
            untouchedBlue: [...document.querySelectorAll('.button-blue:not(.button-site)')].every(el => getComputedStyle(el, '::before').animationName === 'none')
          };
        });
        assert.equal(result.minimum.transform, 'matrix(1, 0, 0, 1, 0, 0)');
        assert.equal(result.maximum.transform, 'matrix(1.02, 0, 0, 1.02, 0, 0)');
        assert.notEqual(result.minimum.shadow, result.maximum.shadow);
        assert.equal(result.duration, 3000);
        assert.equal(result.pulseDuration, result.duration);
        assert.equal(result.sheen, true);
        assert.equal(result.overflow, false, `${route} at ${width}px`);
        assert.ok(Math.abs(result.depthWidth - result.buttonWidth) < 1);
        assert.equal(result.untouchedBlue, true);
        assert.deepEqual(result.blue, route === '/' ? [{ text: 'Acessar Site', animation: 'site-glow' }] : []);
      }
      // Change the preference during the visit, as well as checking the next load.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      const checkReduced = async () => {
        const reduced = await page.evaluate(() => {
          const wrapper = document.querySelector('.whatsapp-depth');
          const button = wrapper.querySelector('.button-whatsapp');
          return {
            depth: getComputedStyle(wrapper).animationName,
            transform: getComputedStyle(wrapper).transform,
            entrance: getComputedStyle(button).animationName,
            pulse: getComputedStyle(button, '::before').animationName,
            sheen: getComputedStyle(button, '::after').display,
            blue: document.querySelector('.button-site') ? getComputedStyle(document.querySelector('.button-site'), '::before').animationName : 'none'
          };
        });
        assert.deepEqual(reduced, { depth: 'none', transform: 'none', entrance: 'none', pulse: 'none', sheen: 'none', blue: 'none' });
      };
      await checkReduced();
      await page.reload({ waitUntil: 'domcontentloaded' });
      await checkReduced();
      await page.emulateMedia({ reducedMotion: 'no-preference' });
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
