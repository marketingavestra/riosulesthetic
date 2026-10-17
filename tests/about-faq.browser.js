/* Optional bounded rendered regression. Requires Playwright and a launchable Chromium. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const expected = [
  ['Quais são os horários de atendimento?', 'Atendemos de segunda a sexta, das 8h às 18h, e aos sábados das 8h às 12h. Agende uma visita pelo WhatsApp.'],
  ['Quais produtos a Rio Sul vende?', 'Trabalhamos com cosméticos, injetáveis, materiais descartáveis e equipamentos de proteção individual (EPIs). Fale com uma consultora para conhecer as opções.'],
  ['Vocês vendem e alugam tecnologias?', 'Sim. Oferecemos tecnologias para venda e locação. Consulte nossa equipe pelo WhatsApp para saber mais sobre os equipamentos e as condições.'],
  ['Como solicitar informações ou um orçamento?', 'Entre em contato pelo WhatsApp e conte à nossa equipe o que você procura. Uma de nossas consultoras irá ajudar com informações sobre produtos, tecnologias e locação.'],
  ['Vocês entregam para todo o Brasil?', 'Sim! Entregamos em todo o Brasil em até 7 dias úteis. No Rio Grande do Sul, a entrega é feita em até 24 horas.'],
  ['Como funciona o suporte das tecnologias?', 'Oferecemos suporte para as tecnologias, com treinamentos presenciais em todo o Rio Grande do Sul, além de materiais e cursos de apoio.'],
];

test('About link and all six FAQ panels preserve content and keyboard toggling', { timeout: 45000 }, async () => {
  const root = path.resolve(__dirname, '../dist');
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    const file = path.join(root, pathname.endsWith('/') ? `${pathname}index.html` : pathname);
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
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
    for (const width of [320, 390, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      const about = page.getByRole('link', { name: 'Sobre Nós', exact: true });
      assert.equal(await about.getAttribute('href'), '/site/');
      assert.equal(await about.locator('img').getAttribute('src'), '/assets/rio-sul-blue.png');
      await about.click();
      await page.waitForURL(base + '/site/');
      assert.equal(await page.locator('[data-faq]').count(), 6);
      const ids = await page.locator('[id]').evaluateAll(nodes => nodes.map(node => node.id));
      assert.equal(new Set(ids).size, ids.length, 'all IDs must be unique');
      for (const [question, answer] of expected) {
        const button = page.getByRole('button', { name: question, exact: true });
        const id = await button.getAttribute('aria-controls');
        const panel = page.locator(`#${id}`);
        assert.equal(await panel.count(), 1);
        assert.equal((await panel.textContent()).trim(), answer);
        assert.equal(await button.getAttribute('type'), 'button');
        assert.equal(await button.getAttribute('aria-expanded'), 'false');
        assert.equal(await panel.getAttribute('aria-hidden'), 'true');
        await button.focus();
        await page.keyboard.press('Enter');
        assert.equal(await button.getAttribute('aria-expanded'), 'true');
        assert.equal(await panel.getAttribute('aria-hidden'), 'false');
        await page.waitForTimeout(330);
        assert.ok(await panel.evaluate(node => node.clientHeight >= node.scrollHeight), 'answer must not be clipped');
        await page.keyboard.press('Space');
        assert.equal(await button.getAttribute('aria-expanded'), 'false');
        assert.equal(await panel.getAttribute('aria-hidden'), 'true');
        await button.click();
        await button.click();
        assert.equal(await button.getAttribute('aria-expanded'), 'false');
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await page.goBack();
      assert.equal(await page.getByRole('link', { name: 'Sobre Nós', exact: true }).count(), 1);
    }
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
