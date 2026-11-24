"""ワイヤーフレームと仮組みページを、無料の静的ホスティング（Netlify など）に置ける形に書き出す。

使い方:  python3 wireframes/build.py
出力先:  wireframes/dist/
"""
import html
import pathlib
import re
import shutil

SRC = pathlib.Path(__file__).parent
OUT = SRC / "dist"

# (ファイル, グループ, 表示名)
PAGES = [
    ("top-sp.html", "ワイヤー：トップ", "スマホ"),
    ("top-pc.html", "ワイヤー：トップ", "PC"),
    ("about-sp.html", "ワイヤー：About", "スマホ"),
    ("about-pc.html", "ワイヤー：About", "PC"),
    ("item-sp.html", "ワイヤー：商品詳細", "スマホ"),
    ("item-pc.html", "ワイヤー：商品詳細", "PC"),
    ("mock/top.html", "仮組み（写真入り）", "トップ"),
    ("mock/about.html", "仮組み（写真入り）", "About"),
]

# claude.ai で共有していたときのリンクを、同じサイト内の相対リンクに置き換える
ARTIFACT_LINKS = {
    "https://claude.ai/artifact/5SXqEhevABpoKvj5iTiT93": "about-sp.html",
    "https://claude.ai/artifact/67La4bzqfTydW9VM1gZZEX": "top-sp.html",
    "https://claude.ai/artifact/D6PFy4oiAFnjsFyqegsoRB": "item-sp.html",
}

HEAD = """<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex, nofollow">
{body_head}
</head>
<body>
{body}
</body>
</html>
"""

# 全ページ共通のページ切り替えバー（上部のタブ＋右下のメニューボタン）
NAV_CSS = """<style>
.wf-nav { --wf-bg:#1f2a23; --wf-fg:#e9ede8; --wf-mute:#9fb0a4; --wf-on:#f3e6da; --wf-on-fg:#7a3f1f;
  background:var(--wf-bg); color:var(--wf-fg); font:500 12px/1.4 "Noto Sans JP", system-ui, sans-serif; letter-spacing:0; }
.wf-nav .wf-scroll { overflow-x:auto; -webkit-overflow-scrolling:touch; }
.wf-nav .wf-row { display:flex; align-items:center; gap:18px; width:max-content; min-width:100%;
  padding:8px max(16px, env(safe-area-inset-right, 0px)) 8px max(16px, env(safe-area-inset-left, 0px)); }
.wf-nav .wf-home { color:var(--wf-fg); text-decoration:none; font-weight:700; white-space:nowrap; }
.wf-nav .wf-grp { display:flex; align-items:center; gap:6px; white-space:nowrap; }
.wf-nav .wf-grp > span { color:var(--wf-mute); margin-right:2px; }
.wf-nav .wf-grp a { color:var(--wf-fg); text-decoration:none; padding:3px 10px; border-radius:999px; border:1px solid rgba(255,255,255,.22); }
.wf-nav .wf-grp a:hover { border-color:var(--wf-fg); }
.wf-nav .wf-grp a[aria-current="page"] { background:var(--wf-on); color:var(--wf-on-fg); border-color:var(--wf-on); }
.wf-nav a:focus-visible, .wf-fab:focus-visible { outline:2px solid #e0a07a; outline-offset:2px; }
.wf-fab { position:fixed; z-index:1000; right:calc(16px + env(safe-area-inset-right, 0px)); bottom:calc(16px + env(safe-area-inset-bottom, 0px));
  width:52px; height:52px; border-radius:50%; border:0; background:#1f2a23; color:#e9ede8; box-shadow:0 4px 16px rgba(0,0,0,.25); cursor:pointer;
  font:700 11px/1.2 "Noto Sans JP", system-ui, sans-serif; }
.wf-panel { position:fixed; z-index:1000; right:calc(16px + env(safe-area-inset-right, 0px)); bottom:calc(78px + env(safe-area-inset-bottom, 0px));
  width:min(300px, calc(100vw - 32px)); max-height:70vh; overflow:auto; background:#fff; color:#2a302b; border-radius:10px;
  box-shadow:0 10px 32px rgba(0,0,0,.25); padding:12px; font:400 13px/1.5 "Noto Sans JP", system-ui, sans-serif; }
.wf-panel[hidden] { display:none; }
.wf-panel b { display:block; font-size:11px; color:#6f756f; margin:10px 4px 4px; }
.wf-panel b:first-child { margin-top:0; }
.wf-panel a { display:block; padding:8px 10px; border-radius:6px; color:#2a302b; text-decoration:none; }
.wf-panel a:hover { background:#eef1ec; }
.wf-panel a[aria-current="page"] { background:#f3e6da; color:#7a3f1f; font-weight:700; }
@media print { .wf-nav, .wf-fab, .wf-panel { display:none; } }
</style>"""

NAV_JS = """<script>
(function(){
  var b=document.getElementById('wf-fab'), p=document.getElementById('wf-panel');
  if(!b||!p) return;
  b.addEventListener('click',function(){ var o=p.hidden; p.hidden=!o; b.setAttribute('aria-expanded', o?'true':'false'); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape'){ p.hidden=true; b.setAttribute('aria-expanded','false'); } });
})();
</script>"""


def rel(from_file: str, to_file: str) -> str:
    depth = from_file.count("/")
    return "../" * depth + to_file


def nav_html(current: str) -> str:
    groups = {}
    for f, g, label in PAGES:
        groups.setdefault(g, []).append((f, label))
    bar, panel = [], []
    for g, items in groups.items():
        links = "".join(
            f'<a href="{rel(current, f)}"{" aria-current=\"page\"" if f == current else ""}>{html.escape(l)}</a>'
            for f, l in items
        )
        bar.append(f'<div class="wf-grp"><span>{html.escape(g)}</span>{links}</div>')
        plinks = "".join(
            f'<a href="{rel(current, f)}"{" aria-current=\"page\"" if f == current else ""}>{html.escape(l)}</a>'
            for f, l in items
        )
        panel.append(f"<b>{html.escape(g)}</b>{plinks}")
    return (
        NAV_CSS
        + f'<nav class="wf-nav" aria-label="資料のページ切り替え"><div class="wf-scroll"><div class="wf-row">'
        + f'<a class="wf-home" href="{rel(current, "index.html")}">kukusini 資料</a>'
        + "".join(bar)
        + "</div></div></nav>"
        + '<button class="wf-fab" id="wf-fab" type="button" aria-expanded="false" aria-controls="wf-panel">ページ<br>一覧</button>'
        + f'<div class="wf-panel" id="wf-panel" hidden><b>目次</b><a href="{rel(current, "index.html")}">すべてのページ</a>'
        + "".join(panel)
        + "</div>"
        + NAV_JS
    )


def wrap(text: str, current: str) -> str:
    for a, b in ARTIFACT_LINKS.items():
        text = text.replace(a, b)
    # 先頭の <title>/<meta>/<link> は head に、それ以外は body に
    m = re.match(r"((?:\s*<(?:title|meta|link)\b[^>]*>(?:[^<]*</title>)?)+)", text)
    head = m.group(1).strip() if m else ""
    body = text[m.end():] if m else text
    return HEAD.format(body_head=head, body=nav_html(current) + "\n" + body.strip())


def index() -> str:
    groups = {}
    for f, g, label in PAGES:
        groups.setdefault(g, []).append((f, label))
    blocks = "\n".join(
        f"<section><h2>{html.escape(g)}</h2><ul>"
        + "".join(f'<li><a href="{f}">{html.escape(l)}</a></li>' for f, l in items)
        + "</ul></section>"
        for g, items in groups.items()
    )
    return HEAD.format(body_head="""<title>kukusini ワイヤーフレーム</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500&family=Shippori+Mincho:wght@600&display=swap">
<style>
:root { --bg:#f3f4f1; --paper:#fff; --ink:#2b332d; --muted:#6b746d; --line:#cfd5cf; --accent:#2f4a3a; }
@media (prefers-color-scheme: dark) { :root { --bg:#171b18; --paper:#222823; --ink:#e4e8e3; --muted:#9aa49c; --line:#3b443d; --accent:#9cc2a8; color-scheme: dark; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font-family:"Noto Sans JP", system-ui, sans-serif; line-height:1.7;
  padding: 48px max(16px, env(safe-area-inset-right, 0px)) 64px max(16px, env(safe-area-inset-left, 0px)); }
main { max-width: 640px; margin: 0 auto; display:flex; flex-direction:column; gap:22px; }
h1 { font-family:"Shippori Mincho", serif; font-weight:600; font-size:26px; margin:0; }
h2 { font-size:13px; color:var(--muted); margin:0 0 8px; font-weight:500; }
p { margin:0; color:var(--muted); font-size:14px; }
ul { list-style:none; margin:0; padding:0; display:grid; grid-template-columns:repeat(auto-fill, minmax(140px, 1fr)); gap:8px; }
a { display:block; background:var(--paper); border:1px solid var(--line); border-radius:6px; padding:12px 16px; color:var(--ink); text-decoration:none; }
a:hover, a:focus-visible { border-color:var(--accent); outline:none; }
</style>""", body=f"""<main>
<h1>kukusini ECサイトリニューアル<br>ワイヤーフレーム</h1>
<p>打ち合わせ用の検討資料です。ワイヤーは文章が仮原稿・写真は枠のみ、仮組みはGoogleドライブの写真を当てはめた見本です。どのページも、上のバーか右下の「ページ一覧」で行き来できます。</p>
{blocks}
</main>""")


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    for f, _, _ in PAGES:
        dst = OUT / f
        dst.parent.mkdir(parents=True, exist_ok=True)
        dst.write_text(wrap((SRC / f).read_text(encoding="utf-8"), f), encoding="utf-8")
    # 仮組みの CSS と写真
    shutil.copy(SRC / "mock" / "site.css", OUT / "mock" / "site.css")
    shutil.copytree(SRC / "mock" / "img", OUT / "mock" / "img")
    (OUT / "index.html").write_text(index(), encoding="utf-8")
    print(f"wrote {len(PAGES) + 1} pages to {OUT}")


if __name__ == "__main__":
    main()
