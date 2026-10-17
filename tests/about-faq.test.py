"""Bounded content and accessibility regression for the About/FAQ update."""
from pathlib import Path
from html.parser import HTMLParser
import re

root = Path(__file__).resolve().parents[1]
html = (root / 'dist/site/index.html').read_text()

class FAQ(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = []
        self.buttons = []
        self.panels = {}
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
            self.panels[attrs['id']] = attrs
        if 'data-faq' in attrs:
            assert tag == 'button' and attrs['type'] == 'button'
            self.buttons.append(attrs)

page = FAQ()
page.feed(html)
assert len(page.ids) == len(set(page.ids))
assert len(page.buttons) == 6
assert [b['aria-controls'] for b in page.buttons] == [f'faq-{i}' for i in range(1, 7)]
for button in page.buttons:
    assert button['aria-expanded'] == 'false'
    panel = page.panels[button['aria-controls']]
    assert panel['aria-hidden'] == 'true'
    assert 'max-h-0' in panel['class'].split()

expected = [
    ('Quais são os horários de atendimento?', 'Atendemos de segunda a sexta, das 8h às 18h, e aos sábados das 8h às 12h. Agende uma visita pelo WhatsApp.'),
    ('Quais produtos a Rio Sul vende?', 'Trabalhamos com cosméticos, injetáveis, materiais descartáveis e equipamentos de proteção individual (EPIs). Fale com uma consultora para conhecer as opções.'),
    ('Vocês vendem e alugam tecnologias?', 'Sim. Oferecemos tecnologias para venda e locação. Consulte nossa equipe pelo WhatsApp para saber mais sobre os equipamentos e as condições.'),
    ('Como solicitar informações ou um orçamento?', 'Entre em contato pelo WhatsApp e conte à nossa equipe o que você procura. Uma de nossas consultoras irá ajudar com informações sobre produtos, tecnologias e locação.'),
    ('Vocês entregam para todo o Brasil?', 'Sim! Entregamos em todo o Brasil em até 7 dias úteis. No Rio Grande do Sul, a entrega é feita em até 24 horas.'),
    ('Como funciona o suporte das tecnologias?', 'Oferecemos suporte para as tecnologias, com treinamentos presenciais em todo o Rio Grande do Sul, além de materiais e cursos de apoio.'),
]
for i, (question, answer) in enumerate(expected, 1):
    assert f'>{question}</span>' in html
    match = re.search(rf'<div id="faq-{i}"[^>]*>\s*<p[^>]*>(.*?)</p>', html)
    assert match and match.group(1) == answer
print('PASS: six unique native FAQ buttons, matching collapsed panels, exact added content and preserved existing answers')
