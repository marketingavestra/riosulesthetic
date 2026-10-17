"""Static safeguards for layered CTA motion; rendered checks live in the JS peer."""
from pathlib import Path
from html.parser import HTMLParser
import re

root = Path(__file__).resolve().parents[1]
css = (root / 'dist/assets/background.css').read_text()

class Buttons(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.whatsapp = 0
        self.site = 0
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        classes = attrs.get('class', '').split()
        if 'button-whatsapp' in classes:
            assert tag == 'a'
            assert 'whatsapp-depth' in self.stack[-1][1].get('class', '').split()
            assert attrs['href'] == 'https://wa.me/message/CLLCSPVDWHQMJ1'
            self.whatsapp += 1
        if 'button-site' in classes:
            assert tag == 'a' and 'button-blue' in classes
            assert attrs['href'] == 'https://www.riosuldistribuidora.com.br'
            self.site += 1
        if tag not in {'meta', 'link', 'img', 'source', 'br', 'hr', 'input'}:
            self.stack.append((tag, attrs))
    def handle_endtag(self, tag):
        if self.stack and self.stack[-1][0] == tag:
            self.stack.pop()

for name, sites in [('index.html', 1), ('site/index.html', 0)]:
    parser = Buttons()
    parser.feed((root / 'dist' / name).read_text())
    assert parser.whatsapp == 1
    assert parser.site == sites
assert 'animation: whatsapp-depth 3s ease-in-out infinite' in css
assert 'animation: whatsapp-pulse 3s ease-in-out infinite' in css
assert 'animation: whatsapp-sheen 4.5s ease-in-out infinite' in css
assert 'animation: site-glow 3s ease-in-out infinite' in css
assert '50% { transform: scale(1.02); box-shadow:' in css
assert '.whatsapp-depth { animation: none; transform: none; box-shadow: none; }' in css
assert '.button-site::before { animation: none; opacity: .18; }' in css
assert '.button-whatsapp::before, .button-whatsapp::after { animation: none; }' in css
assert '.button-whatsapp, .button-site { animation: none !important; opacity: 1;' in css
for pseudo in ['.button-site::before', '.button-whatsapp::before,\n.button-whatsapp::after']:
    block = css.split(pseudo + ' {', 1)[1].split('}', 1)[0]
    assert 'pointer-events: none' in block
# The perpetual transform belongs only to the wrapper, not to the link's
# existing entry/press transform or independent WAAPI translate/rotate/scale.
assert 'animation: whatsapp-depth' not in css.split('.glass-button.button-whatsapp {', 1)[1].split('}', 1)[0]
print('PASS: isolated 1.02 depth, synchronized green pulse, preserved sheen, scoped blue glow and reduced motion')
