"""Static regression checks for the Rio Sul content and shared glass buttons."""
from pathlib import Path
import re

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
feedback = html.split('id="feedback-title"')[1].split('</section>')[0]
assert 'Exemplos de feedback' in feedback
assert 'Textos ilustrativos. Substituir por depoimentos reais de clientes.' in feedback
assert feedback.count('>Exemplo ilustrativo<') == 6
assert feedback.count('data-horizontal') == 6
assert feedback.count('★') == 30
assert 'paciente' not in feedback.lower()
assert 'rgba(12, 65, 111, .36), rgba(32, 111, 169, .22)' in css
assert 'rgba(10, 102, 61, .72), rgba(22, 149, 83, .60)' in css
assert 'backdrop-filter: blur(16px)' in css
assert 'animation: whatsapp-pulse' in css and 'animation: whatsapp-sheen' in css
assert '.button-whatsapp::before, .button-whatsapp::after { animation: none; }' in css
for page in [root / 'dist/index.html', root / 'dist/site/index.html']:
    text = page.read_text()
    assert '/assets/background.css' in text
    assert 'button-whatsapp' in text
    for asset in re.findall(r'(?:src|href)="(/assets/[^"?#]+)', text):
        assert (root / 'dist' / asset.lstrip('/')).exists(), asset
print('PASS: statistics, illustrative feedback, CTA, glass styles, motion safeguards and assets')

# Check every local HTML reference (including metadata and deferred video sources)
# and CSS url(), not only ordinary image/script attributes.
for source in (root / 'dist').rglob('*'):
    if source.suffix not in {'.html', '.css', '.js'}:
        continue
    text = source.read_text()
    for asset in re.findall(r'''["'](/assets/[^"'?#<>\s)]+)''', text):
        assert (root / 'dist' / asset.lstrip('/')).is_file(), (source, asset)
    if source.suffix == '.html':
        for ref in re.findall(r'''(?:src|href)=["'](/[^"'?#]+)''', text):
            target = root / 'dist' / ref.lstrip('/')
            assert target.is_file() or (target / 'index.html').is_file(), (source, ref)
print('PASS: all local HTML and CSS asset references resolve')
