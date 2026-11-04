#!/usr/bin/env python3
"""Build Catering Book into one self-contained HTML file.

  python3 scripts/build.py                 -> dist/index.html  (uses config.json if present, else local-only mode)
  python3 scripts/build.py --mock          -> dist/test.html   (fake cloud for testing two users)
  python3 scripts/build.py --local         -> dist/local.html  (no cloud, data on device)
"""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'src')
DIST = os.path.join(ROOT, 'dist')
os.makedirs(DIST, exist_ok=True)

def bundle_firebase():
    out = os.path.join(DIST, '.fb.js')
    esbuild = os.path.join(ROOT, 'node_modules', '.bin', 'esbuild')
    subprocess.run([esbuild, os.path.join(SRC, 'fb.js'), '--bundle', '--minify', '--format=iife', '--target=es2019', '--legal-comments=none', '--outfile=' + out], check=True)
    return open(out, encoding='utf-8').read()

def build(mode):
    html = open(os.path.join(SRC, 'app.html'), encoding='utf-8').read()
    parts = ''.join(open(os.path.join(SRC, f), encoding='utf-8').read() + '\n' for f in ('part_ui.js', 'part_balances.js', 'part_stock.js', 'part_prices.js', 'part_insui.js', 'part_seasons.js'))
    html = html.replace('/*PARTS*/', parts).replace('/*STYLE*/', open(os.path.join(SRC, 'style.css'), encoding='utf-8').read())
    cfg_path = os.path.join(ROOT, 'config.json')
    if mode == 'mock':
        js = open(os.path.join(SRC, 'mock.js'), encoding='utf-8').read()
        config = {'firebase': {}, 'ownerEmail': 'owner@test.in'}
        name = 'test.html'
    elif mode == 'local' or not os.path.exists(cfg_path):
        js, config, name = '', None, ('local.html' if mode == 'local' else 'index.html')
    else:
        config = json.load(open(cfg_path))
        assert config.get('firebase', {}).get('apiKey'), 'config.json needs firebase.apiKey'
        assert config.get('ownerEmail') or config.get('ownerEmails'), 'config.json needs ownerEmails (list) or ownerEmail'
        js, name = bundle_firebase(), 'index.html'
    html = html.replace('<!--FIREBASE-->', f'<script>{js}</script>' if js else '')
    html = html.replace('/*CONFIG*/null/*END*/', json.dumps(config))
    import shutil
    for a in ('manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'): shutil.copy(os.path.join(SRC, a), os.path.join(DIST, a))
    path = os.path.join(DIST, name)
    open(path, 'w', encoding='utf-8').write(html)
    print(f'{name}: {len(html)//1024} KB, cloud={"mock" if mode=="mock" else bool(config)}')

mode = 'mock' if '--mock' in sys.argv else 'local' if '--local' in sys.argv else 'prod'
build(mode)
