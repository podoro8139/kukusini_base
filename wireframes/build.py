"""ワイヤーフレームを、無料の静的ホスティング（Netlify など）に置ける形に書き出す。

使い方:  python3 wireframes/build.py
出力先:  wireframes/dist/
"""
import pathlib, re, html

SRC = pathlib.Path(__file__).parent
OUT = SRC / "dist"

PAGES = [
    ("top-sp.html", "トップ", "スマホ"),
    ("top-pc.html", "トップ", "PC"),
    ("about-sp.html", "About", "スマホ"),
    ("item-sp.html", "商品詳細", "スマホ"),
    ("item-pc.html", "商品詳細", "PC"),
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

def wrap(text: str) -> str:
    for a, b in ARTIFACT_LINKS.items():
        text = text.replace(a, b)
    # 先頭の <title>/<meta>/<link> は head に、それ以外は body に
    m = re.match(r"((?:\s*<(?:title|meta|link)\b[^>]*>(?:[^<]*</title>)?)+)", text)
    head = m.group(1).strip() if m else ""
    body = text[m.end():] if m else text
    return HEAD.format(body_head=head, body=body.strip())

def index() -> str:
    rows = "\n".join(
        f'<li><a href="{f}"><b>{html.escape(n)}</b><span>{html.escape(d)}</span></a></li>'
        for f, n, d in PAGES
    )
    return HEAD.format(body_head="""<title>kukusini ワイヤーフレーム</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500&family=Shippori+Mincho:wght@600&display=swap">
<style>
:root { --bg:#f3f4f1; --paper:#fff; --ink:#2b332d; --muted:#6b746d; --line:#cfd5cf; --accent:#2f4a3a; }
@media (prefers-color-scheme: dark) { :root { --bg:#171b18; --paper:#222823; --ink:#e4e8e3; --muted:#9aa49c; --line:#3b443d; --accent:#9cc2a8; color-scheme: dark; } }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font-family:"Noto Sans JP", system-ui, sans-serif; line-height:1.7;
  padding: 48px max(16px, env(safe-area-inset-right, 0px)) 64px max(16px, env(safe-area-inset-left, 0px)); }
main { max-width: 640px; margin: 0 auto; display:flex; flex-direction:column; gap:18px; }
h1 { font-family:"Shippori Mincho", serif; font-weight:600; font-size:26px; margin:0; }
p { margin:0; color:var(--muted); font-size:14px; }
ul { list-style:none; margin:8px 0 0; padding:0; display:flex; flex-direction:column; gap:8px; }
a { display:flex; justify-content:space-between; gap:12px; background:var(--paper); border:1px solid var(--line); border-radius:6px; padding:14px 18px; color:var(--ink); text-decoration:none; }
a:hover, a:focus-visible { border-color:var(--accent); outline:none; }
a span { color:var(--muted); font-size:13px; }
</style>""", body=f"""<main>
<h1>kukusini ECサイトリニューアル<br>ワイヤーフレーム</h1>
<p>打ち合わせ用の検討資料です。文章は仮原稿、写真は枠のみです。右側（スマホでは各セクションの下）の注記に、実装方法と未決事項を書いています。</p>
<ul>
{rows}
</ul>
</main>""")

def main():
    OUT.mkdir(exist_ok=True)
    for f, _, _ in PAGES:
        (OUT / f).write_text(wrap((SRC / f).read_text(encoding="utf-8")), encoding="utf-8")
    (OUT / "index.html").write_text(index(), encoding="utf-8")
    print(f"wrote {len(PAGES) + 1} files to {OUT}")

if __name__ == "__main__":
    main()
