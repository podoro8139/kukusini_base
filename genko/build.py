"""原稿確認用の見本ページ（番号つき）と、先方が書き込む原稿シートを作る。

使い方:
    python3 wireframes/build.py      # いつもはこちら（テンプレートのプレビュー → この処理、の順に全部作る）
    python3 genko/build.py           # theme-preview ができている状態で、ここだけ作り直す

出力:
    wireframes/dist/genko/*.html     … 文章にオレンジの番号、写真に青い写真名が付いた見本（Netlify の資料サイトに載せる）
    genko/dist/kukusini_原稿と写真.xlsx … 「はじめに」「文章」「写真」「商品説明」の4シート

番号はページ上の並び順で振るので、テンプレートの文章を足し引きしたら作り直すこと。
先方が書き込み始めたあとは番号を変えないよう、テンプレートの文章の追加・削除はシートの戻りを反映するときにまとめて行う。
"""
import csv
import json
import pathlib
import re
import shutil
import subprocess

from openpyxl import Workbook
from openpyxl.drawing.image import Image as XLImage
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.worksheet.datavalidation import DataValidation
from PIL import Image

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent
PREVIEW = ROOT / "wireframes" / "dist" / "theme-preview"
OUT_PAGES = ROOT / "wireframes" / "dist" / "genko"
OUT_DIR = HERE / "dist"
XLSX = OUT_DIR / "kukusini_原稿と写真.xlsx"
WORK = OUT_DIR / "_work"

SITE = "https://radiant-sfogliatella-5a7754.netlify.app"
PHOTO_FOLDER = "https://drive.google.com/drive/folders/1mRrALdkIbxI-oWh8CbwaYqy15fQ4VOr4"
PAGES = ["top", "about", "item", "contact"]

# 商品写真の写真名に使う呼び方（data/products.csv の id → 名前）
PRODUCT_NAMES = {
    "sasami": "ささみ", "mune": "むね", "tebasaki": "手羽先", "kimo": "きも", "zuri": "砂肝",
    "neck": "ネック", "furikake": "ささみふりかけ", "momiji": "もみじ", "atama": "鶏頭",
}


def build_pages():
    if OUT_PAGES.exists():
        shutil.rmtree(OUT_PAGES)
    shutil.copytree(PREVIEW, OUT_PAGES)
    for f in ("annotate.css", "annotate.js"):
        shutil.copy(HERE / f, OUT_PAGES / f)
    for name in PAGES:
        p = OUT_PAGES / f"{name}.html"
        html = p.read_text(encoding="utf-8")
        # プレビューの帯を外して、原稿確認用の札の仕掛けを入れる
        html = re.sub(r'<div style="background:#f3e6da;[^"]*">BASE用テンプレートのプレビュー.*?</div>', "", html, count=1)
        html = re.sub(r"<body([^>]*)>", rf'<body\1 data-gk-page="{name}">', html, count=1)
        html = html.replace("</head>", '<meta name="robots" content="noindex, nofollow">\n'
                                       '<link rel="stylesheet" href="annotate.css">\n</head>', 1)
        html = html.replace("</body>", '<script src="annotate.js"></script>\n</body>', 1)
        html = re.sub(r"<title>.*?</title>", "<title>原稿確認用｜kukusini</title>", html, count=1, flags=re.S)
        p.write_text(html, encoding="utf-8")
    for f in ("category.html",):
        (OUT_PAGES / f).unlink(missing_ok=True)


def extract() -> dict:
    if WORK.exists():
        shutil.rmtree(WORK)
    WORK.mkdir(parents=True)
    out = WORK / "gk.json"
    subprocess.run(["node", str(HERE / "extract.js"), str(OUT_PAGES), str(out), str(WORK / "shots")], check=True)
    return json.loads(out.read_text(encoding="utf-8"))


# ---------- シート ----------

HEAD_FILL = PatternFill("solid", fgColor="2F4A3A")
HEAD_FONT = Font(bold=True, color="FFFFFF")
WRITE_FILL = PatternFill("solid", fgColor="FFF7D6")   # 先方が書く欄
GROUP_FILL = PatternFill("solid", fgColor="EEF1EC")
THIN = Side(style="thin", color="CFD5CF")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
WRAP = Alignment(wrap_text=True, vertical="top")
LINK = Font(color="1D4ED8", underline="single")


def table(ws, headers, widths, write_cols=()):
    ws.append(headers)
    for i, w in enumerate(widths, 1):
        ws.column_dimensions[ws.cell(1, i).column_letter].width = w
        c = ws.cell(1, i)
        c.fill, c.font, c.alignment, c.border = HEAD_FILL, HEAD_FONT, Alignment(vertical="center", wrap_text=True), BORDER
        if headers[i - 1] in write_cols:
            c.fill = PatternFill("solid", fgColor="B45309")
    ws.row_dimensions[1].height = 30
    ws.freeze_panes = "A2"


def style_row(ws, r, ncol, write_idx=(), height=None):
    for i in range(1, ncol + 1):
        c = ws.cell(r, i)
        c.alignment, c.border = WRAP, BORDER
        if i in write_idx:
            c.fill = WRITE_FILL
    if height:
        ws.row_dimensions[r].height = height


def link(cell, url, text="見本で見る"):
    cell.value = text
    cell.hyperlink = url
    cell.font = LINK


def lines(s: str) -> int:
    return max(1, sum((len(l) // 34) + 1 for l in s.split("\n")))


def sheet_intro(wb, n_text, n_photo):
    ws = wb.active
    ws.title = "はじめに"
    ws.column_dimensions["A"].width = 18
    ws.column_dimensions["B"].width = 90
    rows = [
        ("kukusini サイトの原稿と写真", None),
        ("", None),
        ("見本ページ", (f"{SITE}/genko/top.html", "番号つきの見本を開く（トップ・About・商品ページ・お問い合わせ）")),
        ("", "文章の前のオレンジの札（T-01 など）が、シート「文章」の番号です。写真の上の青い札（トップ_メイン1 など）が写真名です。\n"
             "見本の上の「番号を隠す」で、札なしの見た目も確認できます。シートの「見本で見る」を押すと、その場所に飛んで黄色く光ります。"),
        ("", None),
        ("文章の直し方", "シート「文章」で、いまの文章のままで良いところは「いまのままでOK」に ✓ を付けてください。直したいところは「変更希望」（黄色い欄）に、直したあとの文章をそのまま書いてください。\n"
                       "・消したいときは、変更希望に「（削除）」と書く\n"
                       "・改行したい位置は、セルの中で改行（Excel：Alt+Enter／Googleスプレッドシート：Ctrl+Enter）\n"
                       "・迷っていること・質問は「メモ・質問」へ"),
        ("番号の頭の文字", "C＝全ページ共通（メニュー・フッター）／T＝トップ／A＝About／S＝商品ページ（全商品共通の部分）／Q＝お問い合わせ／P＝商品ごとの説明"),
        ("", None),
        ("写真の入れ方", None),
        ("入れる場所", (PHOTO_FOLDER, "Googleドライブ「2.写真・素材 ＞ サイト利用写真」フォルダ")),
        ("ファイル名", "シート「写真」の写真名を、そのままファイル名にしてください。\n"
                     "例）トップ_メイン1.jpg　about_つくり方2.jpg　商品_ささみ_1.jpg\n"
                     "・拡張子（.jpg など）は元のままでOK\n"
                     "・候補が2枚以上あるときは、後ろに _b _c を付ける（例：トップ_メイン1_b.jpg）\n"
                     "・いまの写真のままで良いところは、シート「写真」の「いまのままでOK」に ✓ を付けて、ファイルは入れなくてOK"),
        ("写真の質", "スマホで撮る場合は、ズームなし・最高画質・フラッシュなし（窓の自然光）で。LINEで送ると画質が落ちるので、元のデータをドライブに入れてください。"),
        ("", None),
        ("商品ごとの説明", "シート「商品説明」は、いまのBASEの商品ページに書いてある文章を「現状」に写しています。文章シートと同じく、そのままで良ければ「いまのままでOK」に ✓、直したいところは「変更希望」へ。「（いまのBASEになし）」の項目は新しく足すところなので、下書きを見て変更希望に書いてください。"),
        ("", None),
        ("件数", f"文章 {n_text} か所／写真 {n_photo} 枠（＋商品写真 9商品）"),
    ]
    for r, (a, b) in enumerate(rows, 1):
        ws.cell(r, 1, a).font = Font(bold=True, size=12 if (a and b is None) else 11)
        if isinstance(b, tuple):
            link(ws.cell(r, 2), b[0], b[1])
        elif b:
            ws.cell(r, 2, b)
        ws.cell(r, 1).alignment = ws.cell(r, 2).alignment = WRAP
        if b and not isinstance(b, tuple):
            ws.row_dimensions[r].height = 18 * sum(len(l) // 48 + 1 for l in b.split("\n")) + 4
    ws["A1"].font = Font(bold=True, size=14)
    ws.merge_cells("A1:B1")
    ws.row_dimensions[1].height = 28


def sheet_texts(wb, data):
    ws = wb.create_sheet("文章")
    headers = ["番号", "ページ", "場所", "種類", "現状", "いまのままでOK", "変更希望", "メモ・質問", "見本"]
    table(ws, headers, [7, 14, 22, 16, 46, 12, 46, 24, 11], write_cols=("いまのままでOK", "変更希望", "メモ・質問"))
    dv = DataValidation(type="list", formula1='"✓"', allow_blank=True)
    ws.add_data_validation(dv)
    seen = set()
    order = []
    # 共通（C）を先頭にまとめ、そのあと各ページ
    for name in PAGES:
        for t in data[name]["texts"]:
            if t["common"] and t["id"] not in seen:
                seen.add(t["id"])
                order.append((name, t))
    for name in PAGES:
        order += [(name, t) for t in data[name]["texts"] if not t["common"]]
    prev = None
    for name, t in order:
        if t["page"] != prev:
            ws.append([t["page"]])
            r = ws.max_row
            for i in range(1, len(headers) + 1):
                ws.cell(r, i).fill = GROUP_FILL
            ws.cell(r, 1).font = Font(bold=True)
            prev = t["page"]
        ws.append([t["id"], t["page"], t["section"], t["kind"], t["text"], None, None, None])
        r = ws.max_row
        link(ws.cell(r, 9), f"{SITE}/genko/{name}.html#{t['id']}")
        style_row(ws, r, len(headers), write_idx=(6, 7, 8), height=max(20, 15 * lines(t["text"]) * 0.9 + 6))
        dv.add(ws.cell(r, 6))
        ws.cell(r, 6).alignment = Alignment(horizontal="center", vertical="top")
    ws.auto_filter.ref = f"A1:I{ws.max_row}"
    return sum(1 for _ in order)


def shape(w, h):
    r = w / h if h else 1
    if r > 1.6:
        return f"横長（約{round(r)}:1）", "横 2000px 以上"
    if r > 1.15:
        return "横長（約4:3）", "横 1500px 以上"
    if r > 0.87:
        return "正方形に近い", "1200px 以上"
    return "縦長（約3:4）", "縦 1500px 以上"


def sheet_photos(wb, data):
    ws = wb.create_sheet("写真")
    headers = ["写真名（＝ファイル名）", "ページ", "場所", "何の写真か", "向き", "大きさの目安", "いまの写真",
               "いまのままでOK", "ドライブに入れた", "メモ・質問", "見本"]
    table(ws, headers, [24, 14, 20, 34, 16, 14, 26, 12, 12, 24, 11], write_cols=("いまのままでOK", "ドライブに入れた", "メモ・質問"))
    dv = DataValidation(type="list", formula1='"✓"', allow_blank=True)
    ws.add_data_validation(dv)
    seen = set()
    n = 0
    for name in PAGES:
        for p in data[name]["photos"]:
            if p["name"] in seen:
                continue
            seen.add(p["name"])
            n += 1
            orient, size = ("そのまま", "元データ") if p["name"] == "共通_ロゴ" else shape(p["w"], p["h"])
            ws.append([p["name"], p["page"], p["section"], p["hint"], orient, size, None, None, None, None])
            r = ws.max_row
            link(ws.cell(r, 11), f"{SITE}/genko/{name}.html#{p['name']}")
            style_row(ws, r, len(headers), write_idx=(8, 9, 10), height=96)
            for c in (8, 9):
                dv.add(ws.cell(r, c))
                ws.cell(r, c).alignment = Alignment(horizontal="center", vertical="center")
            shot = WORK / "shots" / f"{p['name']}.png"
            if shot.exists():
                thumb = WORK / "shots" / f"{p['name']}_t.png"
                im = Image.open(shot)
                im.thumbnail((170, 120))
                im.save(thumb)
                xi = XLImage(str(thumb))
                ws.add_image(xi, f"G{r}")
    # 商品写真（BASE の商品登録に使う）
    ws.append([])
    ws.append(["商品写真（BASEの商品登録に使う。1商品につき何枚でも）"])
    r = ws.max_row
    for i in range(1, len(headers) + 1):
        ws.cell(r, i).fill = GROUP_FILL
    ws.cell(r, 1).font = Font(bold=True)
    with open(ROOT / "data" / "products.csv", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            nm = PRODUCT_NAMES.get(row["id"], row["部位"])
            ws.append([f"商品_{nm}_1, _2, _3 …", "商品ページ", row["正式な商品名"],
                       "1枚目は商品一覧にも出る写真（パッケージ＋中身が分かるもの）。2枚目以降は中身のアップ・割れ方・手に持った大きさ・パッケージ裏など",
                       "正方形", "1200px 以上", None, None, None, None])
            style_row(ws, ws.max_row, len(headers), write_idx=(8, 9, 10), height=48)
            for c in (8, 9):
                dv.add(ws.cell(ws.max_row, c))
                ws.cell(ws.max_row, c).alignment = Alignment(horizontal="center", vertical="center")
    return n


def dots(v):
    try:
        n = int(v)
    except (TypeError, ValueError):
        return ""
    return "●" * n + "○" * (5 - n)


# 商品説明シート：いまのBASEの商品ページ（data/base_items_*.json に保存したもの）を「現状」に写す。
# (ヒアリングの id, シートでの呼び方, BASE の商品ID（先頭がメインのページ、残りはサイズ違い）)
PRODUCT_PAGES = [
    ("sasami", "ささみ", ["83244697", "116472064", "163752671"]),
    ("mune", "むね", ["83311190", "116472189", "163755550"]),
    ("tebasaki", "手羽先", ["83311330", "116472323"]),
    ("kimo", "きも", ["163756113"]),
    ("zuri", "砂肝（ずり）", ["110301482"]),
    ("neck", "ネック（サイコロ）", ["83311474", "116472465"]),
    ("neck", "ネック（ロング）", ["83311600"]),
    ("furikake", "ささみふりかけ", ["83311731", "116472692"]),
    ("momiji", "もみじ（鶏足）", ["108555541"]),
    ("atama", "鶏頭", []),
]
BASE_ITEMS = ROOT / "data" / "base_items_2026-11-26.json"
NONE = "（いまのBASEになし）"


def sheet_products(wb):
    ws = wb.create_sheet("商品説明")
    headers = ["番号", "商品", "項目", "現状（いまのBASE）", "いまのままでOK", "変更希望", "メモ・質問", "BASE"]
    table(ws, headers, [7, 16, 22, 50, 12, 46, 24, 9], write_cols=("いまのままでOK", "変更希望", "メモ・質問"))
    dv = DataValidation(type="list", formula1='"✓"', allow_blank=True)
    ws.add_data_validation(dv)
    ws.append(["", "", "", "「現状」は、いまのBASEの商品ページに書いてある文章です（11/26時点）。"
                           "BASEにない項目は「（いまのBASEになし）」とし、分かっている範囲で下書きを付けています。"
                           "かたさ・香り・おすすめの3つは、新しい商品ページで上にカードとして並びます（●○ の5段階）。"
                           "商品説明は、新しいページでは2〜3行の短い文にする予定です。"])
    ws.cell(ws.max_row, 4).alignment = WRAP
    ws.row_dimensions[ws.max_row].height = 92
    base = json.loads(BASE_ITEMS.read_text(encoding="utf-8"))
    with open(ROOT / "data" / "products.csv", encoding="utf-8") as f:
        hearing = {r["id"]: r for r in csv.DictReader(f)}
    n = 0
    for pid, label, ids in PRODUCT_PAGES:
        h = hearing[pid]
        main = base[ids[0]] if ids else None
        det = dict(main["details"]) if main else {}
        draft_caution = "" if h["注意事項"] in ("", "特になし") else h["注意事項"]

        def new(v):
            return NONE + ("\n下書き：" + v if v else "")

        rows = []
        if main:
            rows.append(("商品名（ページの見出し）", main["title"]))
            desc = main["description"]
            rows.append(("商品説明（商品名の下の文章）", desc))
            for other in ids[1:]:
                d = base[other]["description"]
                if "＊＊＊＊" in d:
                    rows.append(("商品説明（大容量500gのページだけ、上に付く文章）", d.split("＊＊＊＊")[0].strip()))
        else:
            rows.append(("商品名（ページの見出し）", "（いまのBASEに商品ページなし）"))
            rows.append(("商品説明（商品名の下の文章）", NONE))
        rows.append(("かたさ", det.get("かたさ") or new(dots(h["硬さ"]))))
        rows.append(("香り", det.get("香り") or new(dots(h["風味"]))))
        rows.append(("おすすめ", det.get("おすすめ") or new(h["おすすめ犬種"])))
        rows.append(("使い方", det.get("使い方") or NONE))
        rows.append(("ご注意（与えるときの注意）", det.get("ご注意") or new(draft_caution)))
        for k in ("商品名", "原材料名", "栄養分", "原産国", "賞味期限", "内容量", "保存方法", "補足"):
            v = det.get(k, "")
            if k == "内容量" and main and len(ids) > 1:
                others = [dict(base[o]["details"]).get("内容量", "") for o in ids[1:]]
                v = f"{v}\n（ほかのサイズのページ：{'、'.join(x for x in others if x)}）"
            rows.append((f"{k}（表）", v or (NONE if main else NONE)))

        ws.append([label])
        r = ws.max_row
        for i in range(1, len(headers) + 1):
            ws.cell(r, i).fill = GROUP_FILL
        ws.cell(r, 1).font = Font(bold=True)
        if main:
            link(ws.cell(r, 8), main["url"], "BASEで見る")
        for item, v in rows:
            n += 1
            ws.append([f"P-{n:02d}", label, item, v, None, None, None])
            rr = ws.max_row
            style_row(ws, rr, len(headers), write_idx=(5, 6, 7), height=max(20, 15 * lines(v) * 0.9 + 6))
            dv.add(ws.cell(rr, 5))
            ws.cell(rr, 5).alignment = Alignment(horizontal="center", vertical="top")
    ws.auto_filter.ref = f"A1:H{ws.max_row}"


def main():
    build_pages()
    data = extract()
    OUT_DIR.mkdir(exist_ok=True)
    wb = Workbook()
    n_text = sum(1 for name in PAGES for t in data[name]["texts"] if not t["common"]) + \
        len({t["id"] for name in PAGES for t in data[name]["texts"] if t["common"]})
    n_photo = len({p["name"] for name in PAGES for p in data[name]["photos"]})
    sheet_intro(wb, n_text, n_photo)
    sheet_texts(wb, data)
    sheet_photos(wb, data)
    sheet_products(wb)
    wb.save(XLSX)
    print(f"wrote {OUT_PAGES} と {XLSX}（文章 {n_text} か所・写真 {n_photo} 枠）")


if __name__ == "__main__":
    main()
