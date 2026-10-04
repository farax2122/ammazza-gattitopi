"""Crea dist/ammazza-gattitopi.html: un unico file con CSS, JS e audio incorporati.

Serve per pubblicare il gioco dove non si possono caricare file separati
(per esempio come artifact su claude.ai). Uso: python tools/build_single.py
"""
import base64
import pathlib
import re

root = pathlib.Path(__file__).resolve().parent.parent
html = (root / 'index.html').read_text(encoding='utf-8')
css = (root / 'css' / 'style.css').read_text(encoding='utf-8')
js = (root / 'js' / 'game.js').read_text(encoding='utf-8')


def inline_audio(m):
    data = base64.b64encode((root / m.group(1)).read_bytes()).decode()
    return f"'data:audio/mpeg;base64,{data}'"


js = re.sub(r"'(assets/audio/[\w-]+\.mp3)'", inline_audio, js)
html = html.replace('<link rel="stylesheet" href="css/style.css">', f'<style>\n{css}</style>')
sim = (root / 'supabase' / 'functions' / '_shared' / 'sim.js').read_text(encoding='utf-8')
html = html.replace('<script src="supabase/functions/_shared/sim.js"></script>', f'<script>\n{sim}</script>')
html = html.replace('<script src="js/game.js"></script>', f'<script>\n{js}</script>')
# la versione single-file è offline: login e classifica online restano solo nel sito vero
html = re.sub(r'<script src="(https://cdn\.jsdelivr\.net/npm/@supabase[^"]+|js/config\.js|js/online\.js)"></script>\n', '', html)
assert 'css/style.css' not in html and 'js/game.js' not in html

out = root / 'dist' / 'ammazza-gattitopi.html'
out.parent.mkdir(exist_ok=True)
out.write_text(html, encoding='utf-8')
print(f'{out} ({out.stat().st_size // 1024} KB)')
