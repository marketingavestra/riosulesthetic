"""Regression checks for the linkbio Instagram handle and transparent badge."""
from pathlib import Path
from html.parser import HTMLParser
from PIL import Image

root = Path(__file__).resolve().parents[1]
html = (root / 'dist/index.html').read_text()
css = (root / 'dist/assets/background.css').read_text()

class Heading(HTMLParser):
    def __init__(self):
        super().__init__()
        self.inside = False
        self.text = ''
        self.badges = []
        self.images = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'h1':
            self.inside = True
        if self.inside and 'instagram-badge' in attrs.get('class', '').split():
            self.badges.append(attrs)
        if self.inside and tag == 'img':
            self.images.append(attrs)
    def handle_endtag(self, tag):
        if tag == 'h1':
            self.inside = False
    def handle_data(self, data):
        if self.inside:
            self.text += data

heading = Heading()
heading.feed(html)
assert heading.text == '@riosul.esthetic'
assert len(heading.badges) == 1
assert heading.badges[0]['aria-hidden'] == 'true'
assert len(heading.images) == 1
assert heading.images[0]['alt'] == ''
assert heading.images[0]['src'] == '/assets/instagram-verified.png'
image = Image.open(root / 'dist/assets/instagram-verified.png')
assert image.mode == 'RGBA'
assert image.getchannel('A').getextrema() == (0, 255)
assert image.getpixel((0, 0))[3] == 0
assert '.home-header { flex: 1 0 auto; }' in css
assert '.home-header .brand-logo--home { margin-bottom: 0; }' in css
title = css.split('.home-profile-title {', 1)[1].split('}', 1)[0]
assert 'flex: 1' in title and 'align-items: center' in title
assert 'width: 100%' in title and 'padding-inline: 32px' in title
logo = css.split('.brand-logo--home {', 1)[1].split('}', 1)[0]
assert 'margin: 34px auto 18px' in logo and 'left:' not in logo
badge = css.split('.instagram-badge {', 1)[1].split('}', 1)[0]
assert 'height: 1em' in badge and 'width: 1em' in badge
assert 'position: absolute' in badge and 'left: calc(100% + .28em)' in badge
assert 'https://www.instagram.com/riosul.esthetic/' in html
assert 'alt="Rio Sul Esthetic"' in html
assert '<title>Rio Sul Esthetic</title>' in html
assert 'instagram-handle' not in (root / 'dist/site/index.html').read_text()
print('PASS: exact Instagram handle, centered layout, font-sized transparent decorative badge, and unchanged business labels')
