from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import textwrap

ROOT = Path(__file__).resolve().parent
PAGES = ROOT.parent.parent / "tmp/pdfs/merax_manual/hires"
PROMO = ROOT.parent / "merax_promo/assets/03-room.jpg"
OUT = ROOT / "scenes"
OUT.mkdir(parents=True, exist_ok=True)

FONT_BOLD = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
FONT_REG = "/System/Library/Fonts/Supplemental/Arial.ttf"
gold = "#E7B66A"
white = "#F7F4EF"
muted = "#C8C3BC"
bg = "#171819"
panel = "#232526"

scenes = [
    (None, "HƯỚNG DẪN LẮP RÁP", "MERAX MURPHY BED + FOLDABLE DESK", "Đọc toàn bộ manual trước khi bắt đầu."),
    (16, "BƯỚC 1 · KIỂM TRA LINH KIỆN", "Đối chiếu từng tấm gỗ theo số chi tiết.", "Xếp các chi tiết theo nhóm để tránh lắp nhầm."),
    (20, "BƯỚC 2 · PHÂN LOẠI PHỤ KIỆN", "Tách bu lông, vít, bản lề, chốt và pít-tông.", "Không siết cứng hoàn toàn ở các bước đầu."),
    (21, "BƯỚC 3 · DỰNG HAI TRỤ TỦ", "Nối trụ trái và phải với các thanh ngang đầu tiên.", "Đúng chiều lỗ khoan và đúng mã phụ kiện."),
    (23, "BƯỚC 4 · LẮP THANH NGANG", "Bổ sung thanh giữa và thanh đáy của tủ.", "Giữ khung trên mặt sàn phẳng."),
    (26, "BƯỚC 5 · HOÀN THIỆN KHUNG TỦ", "Gắn thanh giằng và kiểm tra độ vuông.", "Hai đường chéo phải bằng nhau trước khi siết."),
    (29, "BƯỚC 6 · LẮP CỤM ĐỠ DƯỚI", "Gắn các tấm chân và thanh đỡ phía dưới.", "Dùng đệm mềm để tránh xước bề mặt."),
    (33, "BƯỚC 7 · GHÉP KHUNG BÀN", "Lắp các thanh đỡ và liên kết của cụm bàn.", "Bắt vít theo thứ tự từ giữa ra hai đầu."),
    (36, "BƯỚC 8 · DỰNG HỘP BÀN", "Ghép các tấm bên, đáy và thanh liên kết.", "Cần người giữ các tấm luôn vuông góc."),
    (41, "BƯỚC 9 · GHÉP BÀN VÀO TỦ", "Đưa cụm bàn vào đúng vị trí trong khung chính.", "Thực hiện với ít nhất bốn người lớn."),
    (42, "BƯỚC 10 · GẮN BẢN LỀ DÀI", "Căn bản lề và bắt vít đều dọc theo mép.", "Giữ khe hở đúng như hình hướng dẫn."),
    (47, "BƯỚC 11 · LẮP KHUNG MẶT BÀN", "Nối các thanh dài và thanh ngang của bàn.", "Kiểm tra khung phẳng trước khi gắn mặt bàn."),
    (51, "BƯỚC 12 · GẮN MẶT BÀN", "Liên kết mặt bàn với cơ cấu gập.", "Thử chuyển động chậm, không để tay gần bản lề."),
    (54, "BƯỚC 13 · LẮP KHUNG GIƯỜNG", "Ghép hai cạnh dài, thanh đầu và thanh cuối.", "Lắp trên sàn phẳng và chưa gắn nệm."),
    (56, "BƯỚC 14 · GẮN NAN ĐỠ NỆM", "Phân bố đều các nan và khóa vít từng điểm.", "Kiểm tra chân đỡ cùng dây giữ nệm."),
    (58, "BƯỚC 15 · ĐỊNH VỊ TỦ", "Đặt tủ đúng vị trí, căn ngang và thẳng đứng.", "Đánh dấu chính xác vị trí neo tường."),
    (59, "BƯỚC 16 · KHOAN VÀ NEO TƯỜNG", "Chỉ neo vào bê tông đặc hoặc stud gỗ chịu lực.", "Không gắn vào tường rỗng hay drywall đơn thuần."),
    (62, "BƯỚC 17 · KHÓA ĐIỂM NEO", "Siết các pát phía trên và kiểm tra độ chắc chắn.", "Đây là bước an toàn quan trọng nhất."),
    (63, "BƯỚC 18 · CĂN CHỈNH", "Chỉnh chốt 2–3 mm nếu cần và kiểm tra khe hở.", "Mọi chuyển động phải êm, không cạ hoặc kẹt."),
    (65, "HOÀN TẤT · KIỂM TRA VẬN HÀNH", "Thử bàn, giường, chân đỡ và khóa an toàn.", "Không sử dụng trước khi neo tường được xác nhận."),
]

def font(path, size):
    return ImageFont.truetype(path, size)

for idx, (page, title, headline, note) in enumerate(scenes, 1):
    canvas = Image.new("RGB", (1920, 1080), bg)
    draw = ImageDraw.Draw(canvas)

    if page is None:
        src = Image.open(PROMO).convert("RGB")
        scale = max(1920/src.width, 1080/src.height)
        src = src.resize((int(src.width*scale), int(src.height*scale)), Image.Resampling.LANCZOS)
        canvas.paste(src, ((1920-src.width)//2, (1080-src.height)//2))
        overlay = Image.new("RGBA", canvas.size, (0,0,0,0))
        ImageDraw.Draw(overlay).rectangle((0,0,1920,1080), fill=(0,0,0,120))
        canvas = Image.alpha_composite(canvas.convert("RGBA"), overlay).convert("RGB")
        draw = ImageDraw.Draw(canvas)
        draw.text((960, 350), title, font=font(FONT_BOLD, 72), fill=white, anchor="mm")
        draw.text((960, 450), headline, font=font(FONT_BOLD, 48), fill=gold, anchor="mm")
        draw.rounded_rectangle((510, 650, 1410, 750), radius=20, fill=(15,15,15))
        draw.text((960, 700), note, font=font(FONT_REG, 34), fill=white, anchor="mm")
    else:
        draw.rounded_rectangle((30, 30, 1010, 1050), radius=24, fill="#ECE8E1")
        src = Image.open(PAGES / f"page-{page}.png").convert("RGB")
        src.thumbnail((920, 960), Image.Resampling.LANCZOS)
        canvas.paste(src, (30+(980-src.width)//2, 60+(960-src.height)//2))
        draw.rounded_rectangle((1040, 30, 1890, 1050), radius=24, fill=panel)
        draw.text((1095, 90), f"{idx-1:02d}", font=font(FONT_BOLD, 82), fill=gold)
        draw.multiline_text((1095, 220), "\n".join(textwrap.wrap(title, 24)), font=font(FONT_BOLD, 45), fill=white, spacing=14)
        draw.multiline_text((1095, 445), "\n".join(textwrap.wrap(headline, 31)), font=font(FONT_BOLD, 35), fill=white, spacing=16)
        draw.line((1095, 690, 1835, 690), fill="#5A5D5F", width=2)
        draw.multiline_text((1095, 740), "\n".join(textwrap.wrap(note, 38)), font=font(FONT_REG, 30), fill=muted, spacing=14)
        draw.text((1095, 975), f"MANUAL · TRANG {page}", font=font(FONT_BOLD, 24), fill=gold)

    canvas.save(OUT / f"scene-{idx:02d}.jpg", quality=94, subsampling=0)

