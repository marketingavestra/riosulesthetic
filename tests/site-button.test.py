"""Regression checks for the external-site button and creator credit."""
from pathlib import Path
from html.parser import HTMLParser
from PIL import Image

root = Path(__file__).resolve().parents[1]

class Links(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.current = None
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'a':
            self.current = {'attrs': attrs, 'text': '', 'images': []}
            self.links.append(self.current)
        elif tag == 'img' and self.current is not None:
            self.current['images'].append(attrs)
    def handle_endtag(self, tag):
        if tag == 'a':
            self.current = None
    def handle_data(self, data):
        if self.current is not None:
            self.current['text'] += data

page = Links()
page.feed((root / 'dist/index.html').read_text())
buttons = [link for link in page.links if link['text'].strip() == 'Acessar Site']
assert len(buttons) == 1
button = buttons[0]
assert button['attrs']['href'] == 'https://www.riosuldistribuidora.com.br'
assert button['attrs']['target'] == '_blank'
assert {'noopener', 'noreferrer'} <= set(button['attrs']['rel'].split())
assert {'glass-button', 'button-blue'} <= set(button['attrs']['class'].split())
assert button['images'][0]['src'] == '/assets/riosul-site-logo.png'
index = page.links.index(button)
assert page.links[index - 1]['attrs']['href'] == '/site/'
assert page.links[index + 1]['attrs']['href'] == 'https://share.google/45jjaRNx1excqUhPe'
assert Image.open(root / 'dist/assets/riosul-site-logo.png').size == (318, 318)
for path in ('dist/index.html', 'dist/site/index.html'):
    parser = Links()
    parser.feed((root / path).read_text())
    creators = [link for link in parser.links if link['text'].strip() == '@mateus_npu']
    assert len(creators) == 1
    assert creators[0]['attrs']['href'] == 'https://www.instagram.com/mateus_npu/'
    assert '@mateusmachadoprod' not in (root / path).read_text()
print('PASS: external-site button, supplied logo, placement and creator credit on both routes')
