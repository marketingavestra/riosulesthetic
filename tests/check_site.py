"""Static regression checks for the Rio Sul content and shared glass buttons."""
from pathlib import Path
import re
from html.parser import HTMLParser
from PIL import Image

root = Path(__file__).resolve().parents[1]
html = (root / 'dist/site/index.html').read_text()
css = (root / 'dist/assets/background.css').read_text()
assert '<span data-counter="10">10</span> mil' in html
assert '<span data-counter="2">2</span>+' in html
assert 'aria-label="Mais de 2 anos"' in html
assert '>Clientes<' in html and '>Anos de experiência<' in html
assert 'data-counter="98"' in html and '>Satisfação<' in html
assert 'data-counter="500"' not in html
assert '>Fale com uma consultora<' in html
assert 'feedback-title' not in html
assert 'Exemplos de feedback' not in html
assert 'Exemplo ilustrativo' not in html
assert 'Textos ilustrativos' not in html
assert 'data-horizontal' not in html
assert '★' not in html
assert 'rgba(12, 65, 111, .22), rgba(32, 111, 169, .12)' in css
assert 'rgba(10, 102, 61, .50), rgba(22, 149, 83, .40)' in css
assert 'backdrop-filter: blur(16px)' in css
assert 'animation: whatsapp-pulse' in css and 'animation: whatsapp-sheen' in css
assert '.button-whatsapp::before, .button-whatsapp::after { animation: none; }' in css
for page in [root / 'dist/index.html', root / 'dist/site/index.html']:
    text = page.read_text()
    assert '/assets/background.css' in text
    assert 'button-whatsapp' in text
    for asset in re.findall(r'(?:src|href)="(/assets/[^"?#]+)', text):
        assert (root / 'dist' / asset.lstrip('/')).exists(), asset
print('PASS: statistics, removed feedback, CTA, glass styles, motion safeguards and assets')

# Both routes must keep the decorative fixed layer outside clipping wrappers.
class BackgroundParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.backgrounds = 0
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'video-background' in attrs.get('class', '').split():
            assert self.stack[-1] == 'body', self.stack
            self.backgrounds += 1
        if tag not in {'meta', 'link', 'img', 'source', 'br', 'hr', 'input'}:
            self.stack.append(tag)
    def handle_endtag(self, tag):
        if tag in self.stack:
            self.stack = self.stack[:len(self.stack) - 1 - self.stack[::-1].index(tag)]

for page in [root / 'dist/index.html', root / 'dist/site/index.html']:
    text = page.read_text()
    parser = BackgroundParser()
    parser.feed(text)
    assert parser.backgrounds == 1
    assert 'viewport-fit=cover' in text
    assert 'href="/favicon.ico"' in text
    assert 'sizes="32x32" href="/assets/rio-sul-favicon-32.png"' in text
    assert 'sizes="180x180" href="/assets/rio-sul-favicon-180.png"' in text
    assert 'autoplay muted loop playsinline' in text
    assert 'data-video-toggle' not in text
    assert 'Pausar vídeo' not in text

layer = css.split('.video-background {', 1)[1].split('}', 1)[0]
video = css.split('.video-background video {', 1)[1].split('}', 1)[0]
for declaration in ['position: fixed', 'width: 100%', 'height: 100vh', 'height: 100lvh', 'min-height: 100dvh', 'overflow: hidden']:
    assert declaration in layer, declaration
for declaration in ['position: absolute', 'inset: 0', 'width: 100%', 'height: 100%', 'max-width: none', 'object-fit: cover']:
    assert declaration in video, declaration
assert '.video-background video { display: none; }' in css
assert 'overflow-x: hidden' in css
# Check the favicons are faithful deterministic resizes of the button crop.
crop = Image.open(root / 'dist/assets/rio-sul-blue.png').convert('RGB').crop((285, 450, 745, 910))
for size in (32, 180):
    actual = Image.open(root / f'dist/assets/rio-sul-favicon-{size}.png').convert('RGB')
    expected = crop.resize((size, size), Image.Resampling.LANCZOS)
    assert actual.size == (size, size)
    assert actual.tobytes() == expected.tobytes()
assert Image.open(root / 'dist/favicon.ico').ico.sizes() == {(16, 16), (32, 32), (48, 48), (64, 64)}
print('PASS: full-bleed mobile background, body-level layers, motion controls and faithful favicons on both routes')

background_js = (root / 'dist/assets/background.js').read_text()
assert 'video-toggle' not in css and 'toggle' not in background_js
assert 'userPaused' not in background_js and 'updateButton' not in background_js
assert 'motion.matches || document.hidden' in background_js
assert "document.addEventListener('visibilitychange', sync)" in background_js
assert "motion.addEventListener('change', sync)" in background_js
assert 'video.pause()' in background_js and 'showPoster()' in background_js
assert '.video-readability-overlay' in css
print('PASS: hidden video controls removed; reduced motion, tab visibility and fallback preserved')
assert "video.addEventListener('pause', showPoster)" in background_js
assert "video.addEventListener('error', showPoster)" in background_js
