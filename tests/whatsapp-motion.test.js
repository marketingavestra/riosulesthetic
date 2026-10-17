const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const readProjectFile = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
const source = readProjectFile('dist/assets/whatsapp-motion.js');

function setup({ mobile = false, reduced = false, observer = true, supported = true } = {}) {
  let now = 0, nextId = 0;
  const timers = new Map(), events = {}, documentEvents = {}, animations = [];
  const queries = {};
  let intersection;
  const rect = { width: 300, height: 60, top: 100, bottom: 160, left: 20, right: 320 };
  const buttonEvents = {};
  const button = {
    getBoundingClientRect: () => rect,
    addEventListener: (type, callback) => { buttonEvents[type] = callback; },
    animate: (frames, options) => {
      const animation = { frames, options, cancelled: false,
        cancel() { this.cancelled = true; this.oncancel?.(); },
        finish() { this.onfinish?.(); }
      };
      animations.push(animation);
      return animation;
    }
  };
  const document = { hidden: false, querySelectorAll: () => [button],
    addEventListener: (type, callback) => { documentEvents[type] = callback; } };
  const window = {
    CSS: { supports: () => supported }, innerHeight: 800, innerWidth: 1200,
    matchMedia: query => queries[query] ||= {
      matches: query.includes('reduced') ? reduced : query.includes('hover: hover') ? !mobile : mobile,
      addEventListener(type, callback) { this.change = callback; }
    },
    setTimeout: (callback, delay) => { const id = ++nextId; timers.set(id, { callback, at: now + delay }); return id; },
    clearTimeout: id => timers.delete(id),
    addEventListener: (type, callback) => { events[type] = callback; }
  };
  function IntersectionObserver(callback) {
    intersection = callback;
    this.observe = () => {};
  }
  if (observer) window.IntersectionObserver = IntersectionObserver;
  vm.runInNewContext(source, { window, document, CSS: window.CSS, IntersectionObserver });
  return {
    animations, timers, queries,
    hover(type = 'mouse') { buttonEvents.pointerenter?.({ pointerType: type }); },
    tick(ms) {
      const until = now + ms;
      while (true) {
        const next = [...timers].sort((a, b) => a[1].at - b[1].at)[0];
        if (!next || next[1].at > until) break;
        now = next[1].at; timers.delete(next[0]); next[1].callback();
      }
      now = until;
    },
    visible(visible) {
      rect.top = visible ? 100 : 900; rect.bottom = rect.top + 60;
      if (observer) intersection([{ target: button, isIntersecting: visible, intersectionRatio: visible ? 1 : 0 }]);
      else events.scroll();
    },
    hidden(value) { document.hidden = value; documentEvents.visibilitychange(); },
    reduce(value) { const query = queries['(prefers-reduced-motion: reduce)']; query.matches = value; query.change(); },
    mode(mobile) {
      const desktop = queries['(hover: hover) and (pointer: fine)'];
      const touch = queries['(hover: none), (pointer: coarse)'];
      desktop.matches = !mobile; touch.matches = mobile; desktop.change(); touch.change();
    },
    page(type) { events[type](); }
  };
}

test('desktop: mouse entry only, no overlap, no timer, independent transforms', () => {
  const app = setup();
  app.tick(16000); assert.equal(app.animations.length, 0);
  app.hover('touch'); assert.equal(app.animations.length, 0);
  app.hover(); app.hover(); assert.equal(app.animations.length, 1);
  const animation = app.animations[0];
  assert.equal(animation.options.duration, 600);
  assert.equal(animation.options.fill, 'none');
  assert.ok(animation.frames.every(frame => !('transform' in frame)));
  animation.finish(); app.hover(); assert.equal(app.animations.length, 2);
  assert.equal(app.timers.size, 0);
});
test('mobile: first at 8 seconds and repeat every 8 seconds, no hover trigger', () => {
  const app = setup({ mobile: true });
  app.hover(); app.tick(7999); assert.equal(app.animations.length, 0);
  app.tick(1); assert.equal(app.animations.length, 1);
  app.animations[0].finish(); app.tick(8000); assert.equal(app.animations.length, 2);
});
for (const observer of [true, false]) {
  test(`offscreen pauses and resumes without a burst (observer: ${observer})`, () => {
    const app = setup({ mobile: true, observer });
    app.tick(8000); app.visible(false);
    assert.ok(app.animations[0].cancelled); assert.equal(app.timers.size, 0);
    app.tick(60000); app.visible(true); app.tick(7999);
    assert.equal(app.animations.length, 1);
    app.tick(1); assert.equal(app.animations.length, 2);
  });
}
test('hidden tab cancels and restarts a fresh 8-second wait', () => {
  const app = setup({ mobile: true });
  app.tick(8000); app.hidden(true); assert.ok(app.animations[0].cancelled);
  app.tick(60000); app.hidden(false); app.tick(7999);
  assert.equal(app.animations.length, 1); app.tick(1); assert.equal(app.animations.length, 2);
});
test('reduced motion on load and runtime changes suppress motion', () => {
  const app = setup({ mobile: true, reduced: true });
  app.tick(16000); assert.equal(app.animations.length, 0);
  app.reduce(false); app.tick(8000); assert.equal(app.animations.length, 1);
  app.reduce(true); assert.ok(app.animations[0].cancelled); assert.equal(app.timers.size, 0);
  app.mode(false); app.hover(); assert.equal(app.animations.length, 1);
});
test('input mode changes and BFCache page lifecycle reset timers', () => {
  const app = setup();
  app.mode(true); app.tick(7999); assert.equal(app.animations.length, 0);
  app.tick(1); assert.equal(app.animations.length, 1);
  app.mode(false); assert.ok(app.animations[0].cancelled); assert.equal(app.timers.size, 0);
  app.mode(true); app.page('pagehide'); app.tick(16000); assert.equal(app.animations.length, 1);
  app.page('pageshow'); app.tick(8000); assert.equal(app.animations.length, 2);
});
test('unsupported individual transforms leave links untouched', () => {
  const app = setup({ supported: false });
  app.hover(); app.tick(16000); assert.equal(app.animations.length, 0); assert.equal(app.timers.size, 0);
});
test('both pages load the shared motion script and retain existing animation hooks', () => {
  for (const page of ['dist/index.html', 'dist/site/index.html']) {
    const html = readProjectFile(page);
    assert.equal(html.match(/src="\/assets\/whatsapp-motion.js"/g).length, 1);
    assert.ok(html.includes('button-whatsapp'));
  }
  const home = readProjectFile('dist/index.html');
  assert.ok(home.includes('animate-fade-up'));
  assert.ok(home.includes('animation-fill-mode:forwards'));
});
