"""BASE 用テンプレートの書き出しと、手元確認用のプレビュー作成。

使い方:
    python3 theme/build.py

出力:
    theme/dist/kukusini-v1.html      … BASE の HTML編集 App に貼り付けるファイル
    wireframes/dist/theme-preview/   … BASE のタグに見本データを入れたプレビュー（Netlify の資料サイトにも載る）

設定は theme/config.json（画像URL・カテゴリURL・サイズ違いの商品ID）。
"""
import json
import pathlib
import re
import shutil

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent
SRC = HERE / "kukusini-v1.template.html"
CONF = HERE / "config.json"
OUT = HERE / "dist" / "kukusini-v1.html"
PREVIEW = ROOT / "wireframes" / "dist" / "theme-preview"
MOCK_IMG = ROOT / "wireframes" / "mock" / "img"
BASE_CSS = HERE / "base-css"

LOCAL_IMG = {
    "LOGO": "logo.png", "MAIN1": "lineup.jpg", "MAIN2": "awaji.jpg", "MAIN3": "tray.jpg", "LINEUP": "lineup.jpg", "SASAMI": "sasami.jpg", "BREAK": "break.jpg",
    "HANDCUT": "handcut.jpg", "TRAY": "tray.jpg", "AWAJI": "awaji.jpg", "CHEW": "chew.jpg",
}


def size_map_js(sizes: dict) -> str:
    groups = {k: v for k, v in sizes.items() if not k.startswith("_")}
    text = json.dumps(groups, ensure_ascii=False)
    # BASE のタグ（{Name}）と見間違えられないよう、波かっこの内側にスペースを入れる
    return text.replace("{", "{ ").replace("}", " }")


def fill(text: str, conf: dict, preview: bool) -> str:
    for k, v in conf["images"].items():
        url = ("img/" + LOCAL_IMG[k]) if preview else v
        text = text.replace(f"__IMG_{k}__", url)
    all_url = conf["categories"]["ALL"]
    for k, v in conf["categories"].items():
        text = text.replace(f"__CAT_{k}__", v or all_url)
    for k, v in conf["urls"].items():
        text = text.replace(f"__URL_{k}__", v or all_url)
    text = text.replace("__SIZE_MAP__", size_map_js(conf["sizes"]))
    left = sorted(set(re.findall(r"__[A-Z_]+__", text)))
    if left:
        raise SystemExit(f"置き換えていない項目があります: {left}")
    return text


# ---------- プレビュー用：BASE のタグを見本データで展開する簡易レンダラー ----------

SAMPLE_ITEMS = [
    ("淡路どり ささみジャーキー 60g", "990円", "sasami.jpg"),
    ("淡路どり ささみジャーキー 500g", "5,940円", "sasami-500.jpg"),
    ("淡路どり むねジャーキー 500g", "5,940円", "mune-500.jpg"),
    ("淡路どり ネックジャーキー 60g", "990円", "neck.jpg"),
    ("淡路どり 手羽先ジャーキー 60g", "990円", "chew.jpg"),
    ("淡路どり ささみふりかけ 60g", "1,100円", "lineup.jpg"),
    ("淡路どり 3種類お試しセット", "1,980円", "lineup.jpg"),
    ("淡路どり きもジャーキー 35g", "990円", "break.jpg"),
    ("淡路どり 砂肝ジャーキー 35g", "990円", "neck.jpg"),
]

ADDITIONAL = """<div id="appsItemDetailCustom"><div id="appsItemDetailCustomTag">
<h3 class="appsItemDetailCustomTag_heading">かたさ</h3>
<p class="appsItemDetailCustomTag_description">●○○○○ やわらかめ</p>
<h3 class="appsItemDetailCustomTag_heading">香り</h3>
<p class="appsItemDetailCustomTag_description">●●●●○ 強め</p>
<h3 class="appsItemDetailCustomTag_heading">おすすめ</h3>
<p class="appsItemDetailCustomTag_description">全犬種</p>
<h3 class="appsItemDetailCustomTag_heading">使い方</h3>
<p class="appsItemDetailCustomTag_description">おやつ・ごほうびに。フードのトッピングに。水でふやかせばシニアの子にも。</p>
<h3 class="appsItemDetailCustomTag_heading">原材料</h3>
<p class="appsItemDetailCustomTag_description">鶏ささみ（淡路どり）</p>
<h3 class="appsItemDetailCustomTag_heading">内容量</h3>
<p class="appsItemDetailCustomTag_description">60g</p>
<h3 class="appsItemDetailCustomTag_heading">保存方法</h3>
<p class="appsItemDetailCustomTag_description">（確認中）</p>
<h3 class="appsItemDetailCustomTag_heading">賞味期限</h3>
<p class="appsItemDetailCustomTag_description">（確認中）</p>
</div></div>"""

PURCHASE = """<form class="x_purchaseForm"><div id="itemSelect"><div id="amountSelectWrap"><label>数量</label>
<select><option>1</option><option>2</option></select></div></div>
<div class="purchaseButton"><button type="button" class="purchaseButton__btn" style="width:100%;padding:14px;border:1px solid;">カートに入れる</button></div></form>"""

COMMON = {
    "PageTitle": "kukusini", "ShopName": "kukusini", "IndexPageURL": "top.html", "AboutPageURL": "about.html",
    "ContactPageURL": "#", "LawPageURL": "#", "PrivacyPageURL": "#", "ShopURL": "#",
    "lang:ItemSearchResult": "検索結果", "lang:NoItemsMessage": "商品がありません",
    "MaxPageNumber": "1", "NextPageNumber": "2", "UpdateTime": "0", "BASEURL": "",
    "ShopIntroduction": "（ここに管理画面の「ショップ紹介」の文章が入ります。お支払い方法やお届けについてなど）",
    "LogoTag": "kukusini",
}

PAGES = {
    "top.html": {"true": {"NotLoadItemsPage", "IndexPage", "NotItemPage", "ShopPublic", "NoIndexPageCategory",
                          "NoIndexPageSearch", "HasItems", "Items", "ItemImage1", "ItemNowOnSale", "NoItemProperPrice"}},
    "category.html": {"true": {"NotLoadItemsPage", "IndexPage", "NotItemPage", "ShopPublic", "IndexPageCategory",
                               "NoIndexPageSearch", "HasItems", "Items", "ItemImage1", "ItemNowOnSale", "NoItemProperPrice"}},
    "item.html": {"true": {"NotLoadItemsPage", "ItemPage", "ItemImage1", "ItemImage2", "ItemImage3", "ItemNowOnSale",
                           "NoItemProperPrice", "PurchaseForm", "AppsItemDetailCustom", "HasRelatedItems", "RelatedItems"}},
    "about.html": {"true": {"NotLoadItemsPage", "AboutPage", "NotItemPage"}},
    "contact.html": {"true": {"NotLoadItemsPage", "ContactPage", "NotItemPage"}},
}


def find_close(text: str, name: str, start: int) -> int:
    depth = 1
    pat = re.compile(r"\{(/?)block:" + re.escape(name) + r"\}")
    for m in pat.finditer(text, start):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return m.start()
    raise ValueError(name)


def render(text: str, truthy: set, ctx: dict) -> str:
    out, pos = [], 0
    opener = re.compile(r"\{block:([A-Za-z0-9]+)\}")
    while True:
        m = opener.search(text, pos)
        if not m:
            out.append(text[pos:])
            break
        out.append(text[pos:m.start()])
        name = m.group(1)
        end = find_close(text, name, m.end())
        inner = text[m.end():end]
        close_len = len("{/block:" + name + "}")
        if name == "Items":
            for t, p, img in SAMPLE_ITEMS:
                out.append(render(inner, truthy, {**ctx, "ItemTitle": t, "ItemPrice": p, "ItemPageURL": "item.html",
                                                  "ItemImage1URL-500": "img/" + img}))
        elif name == "RelatedItems":
            for t, p, img in SAMPLE_ITEMS[2:5]:
                out.append(render(inner, truthy, {**ctx, "RelatedItemTitle": t, "RelatedItemPrice": p,
                                                  "RelatedItemPageURL": "item.html", "RelatedItemImageURL-640": "img/" + img}))
        elif name in truthy:
            out.append(render(inner, truthy, ctx))
        pos = end + close_len
    s = "".join(out)
    return re.sub(r"\{((?:lang:)?[A-Za-z][A-Za-z0-9\-]*)\}", lambda m: ctx.get(m.group(1), ""), s)


def build_preview(filled: str):
    if PREVIEW.exists():
        shutil.rmtree(PREVIEW)
    (PREVIEW / "img").mkdir(parents=True)
    for f in MOCK_IMG.iterdir():
        shutil.copy(f, PREVIEW / "img" / f.name)
    # 既存テーマの CSS も一緒に読み込んで、本番に近い見た目で確認する
    if BASE_CSS.exists():
        for f in BASE_CSS.iterdir():
            shutil.copy(f, PREVIEW / f.name)
    text = filled.replace("https://basefile.akamaized.net/kukusini-base-shop/65cebb5a4bfc9/reset.css", "reset.css")
    text = text.replace("https://basefile.akamaized.net/kukusini-base-shop/689ca54e884d2/style.css", "style.css")
    item_ctx = {
        **COMMON, "ItemTitle": "淡路どり ささみジャーキー 60g", "ItemPrice": "990円",
        "ItemImage1URL-640": "img/sasami.jpg", "ItemImage1URL-origin": "img/sasami.jpg", "ItemImage1URL-146": "img/sasami.jpg",
        "ItemImage2URL-640": "img/break.jpg", "ItemImage2URL-origin": "img/break.jpg", "ItemImage2URL-146": "img/break.jpg",
        "ItemImage3URL-640": "img/handcut.jpg", "ItemImage3URL-origin": "img/handcut.jpg", "ItemImage3URL-146": "img/handcut.jpg",
        "ItemDetail": "手でさくっと割れるやわらかさと、鶏の香りの強さが特長。ベビーからシニアまで、どんな子にも使える定番です。",
        "ItemSelectTag": PURCHASE, "PurchaseButton": "", "AdditionalItemDetail": ADDITIONAL,
    }
    for name, conf in PAGES.items():
        ctx = item_ctx if name == "item.html" else COMMON
        html = render(text, conf["true"], ctx)
        banner = ('<div style="background:#f3e6da;color:#7a3f1f;font:12px/1.6 sans-serif;text-align:center;padding:6px">'
                  'BASE用テンプレートのプレビュー（BASEのタグに見本データを入れて表示しています）</div>')
        html = html.replace("<body", "<!--preview--><body", 1)
        html = re.sub(r"(<body[^>]*>)", r"\1" + banner, html, count=1)
        (PREVIEW / name).write_text(html, encoding="utf-8")


def main():
    conf = json.loads(CONF.read_text(encoding="utf-8"))
    tpl = SRC.read_text(encoding="utf-8")
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(fill(tpl, conf, preview=False), encoding="utf-8")
    build_preview(fill(tpl, conf, preview=True))
    empty = [k for k, v in conf["images"].items() if not v]
    print(f"wrote {OUT}")
    if empty:
        print("※ 画像URLが未設定:", ", ".join(empty))
    print(f"preview: {PREVIEW}")


if __name__ == "__main__":
    main()
