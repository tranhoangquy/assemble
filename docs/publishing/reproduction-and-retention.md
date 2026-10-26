# Reproduction and retention — Products01/03

## Giữ gì, xoá gì

- Giữ nguyên bytes của bốn MP4 chính được ghi trong `release-catalog.json`, audio master WAV, nguồn nhạc/giấy phép, manual, source product/assembly/camera và tests.
- Giữ bundle final/approval/QA hiện tại. Lịch sử quan trọng, raw collision FAIL, quyết định Director, source/candidate hashes và ảnh đối chiếu đại diện nằm trong hai `*-history.tar.gz` tại `output/final-products-cleanup-20261026/`. Mọi thành viên archive đã được đối chiếu SHA với bản gốc trước khi xoá bản ở vị trí cũ.
- Xoá video nháp/proof/trùng, silent intermediate, frame cache, pre-level WAV, decoded samples dư, ZIP trùng, bundle JS tự sinh và dữ liệu telemetry có thể tái tạo. Không giữ toàn bộ các cuộc trò chuyện/ảnh sidebar của browser trong Git; quyết định Director đã trích riêng vẫn được giữ.
- Product02/JULIETTE, source engine và source Product01/03 không đổi. Không sửa chính sách LFS, không rewrite lịch sử Git, không remote-purge LFS và không dọn cache sản phẩm khác.

`INVENTORY-R2.jsonl.gz` là danh sách KEEP/DELETE trước khi thực hiện, từng đường dẫn/bytes/SHA/lý do. `PROTECTED-BASELINE-R2.json.gz` là baseline bảo vệ. `DELETION-LEDGER.jsonl.gz` ghi từng tệp đã xoá, hash gốc và việc được giữ trong archive nếu có. `RESULT.json` và `CURRENT-RETAINED-SHA256.json` phản ánh trạng thái sau dọn.

**Hash/manifest lịch sử không bị sửa để giả vờ tệp cũ còn tồn tại.** Các manifest trong bundle cũ hoặc archive mô tả snapshot lúc sản xuất, có thể chứa đường dẫn đã purge. Dùng catalog và current-retained manifest hiện tại để xác minh file đang còn. Các reproduction scripts cũ trong archive là lịch sử, không được mặc định chạy trên đường dẫn đã xoá.

## Kiểm tra hoặc remux lossless

Từ repo root, không cần Internet:

```bash
python3 scripts/reproduce-final-media.py 01 long
python3 scripts/reproduce-final-media.py 01 short
python3 scripts/reproduce-final-media.py 03 long
python3 scripts/reproduce-final-media.py 03 short
```

Mặc định chỉ kiểm tra hash MP4 và audio master, không tạo media.

Khi human thực sự cần bản container mới:

```bash
python3 scripts/reproduce-final-media.py 03 long --output /absolute/new/path/long-copy.mp4
```

Lệnh này chép video+audio đã chốt từ MP4 chính, không nén/đổi nhạc. Container hash có thể khác nhưng encoded streams được copy. Không ghi đè master. Không chạy remux/render trong đợt cleanup này.

## Khi cần render lại hình từ source

Source Product01 ở `src/products/wf311613-standalone-murphy-bed/`, manual ở `references/wf311613-standalone-murphy-bed/`. Dùng shared Generate File/exporter và DirectorPlan tương ứng; hash đầu ra phải được QA mới nếu môi trường/encoder thay đổi.

Product03 giữ chain evaluator và camera tại `src/products/product03-pet-crate-w114586144/hinge-visual-override-v1/`, material/runtime kế thừa còn đủ. Adapter tái tạo là `scripts/render-product03-finals.ts`, dùng **ExportJobManager hiện có**, không phải exporter mới. Hai PNG calibration nhỏ và quyết định render thực tế ở `output/product03-pet-crate-w114586144/final/reproduction/` là input tái tạo, không phải cache còn Resume được. Adapter không cần browser đã đăng nhập hoặc request Internet.

Các lệnh dưới chỉ để thực hiện sau khi có nhu cầu render mới; chúng **không được chạy trong đợt cleanup**:

```bash
AUDIT_OFFLINE=1 NEXT_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1 node --import tsx scripts/render-product03-finals.ts long
AUDIT_OFFLINE=1 NEXT_TELEMETRY_DISABLED=1 DO_NOT_TRACK=1 node --import tsx scripts/render-product03-finals.ts portrait
```

Dùng thư mục job mới nếu source thay đổi. Không dùng manifest cũ đã purge frame để tuyên bố đã Resume/verify thành công. Adapter kiểm tra source hashes, profile, native dimensions, foreground/context và reserve đĩa; core chunk exporter/QA không thay đổi.

Audio source và lossless master của #03 ở `final/music/`; edit/provenance/24bitWAV/AAC chính xác được giữ. Nếu muốn chạy lại builder, dùng bản copy cấu hình/source trong workspace mới để bảo vệ các output đã có. Raw MP3 #01 A/B/C và WAV final cũng còn nguyên. No SFX/narration/ambience; không đổi timing hình để ép nhạc.

## Git và phục hồi

`git lfs pull` lấy media đã version trong checkout mới. Không thay `.gitattributes` trong cleanup. Lịch sử commit vẫn giữ các phiên bản cũ; cleanup chỉ dọn working tree và các file đang version ở đầu branch, không phải xoá vĩnh viễn lịch sử Git/remote LFS.

## Gọn thư mục và dùng lại để làm video tổng hợp

Mỗi sản phẩm01/03 chỉ còn `README.md` và thư mục `final/`. Hai MP4 chính ở `final/long/` và `final/short/`; phần còn lại trong `final/` là tài nguyên phục vụ các phim này. Bảng chuyển mọi đường dẫn và hash trước/sau ở `output/final-products-consolidation-20261026/PLAN.json`; manifest hiện hành ở `CURRENT-FINAL-PACKAGES.json`. Manifest QA gốc giữ nguyên snapshot, không bị viết lại.

Có thể dùng hai Long làm nguồn cho phim tổng hợp ngang, hai Short cho bản dọc. Giữ video final, WAV nhạc riêng, MP3 nguồn, giấy phép/credit, source 3D/camera/timeline, manual/BOM và cấu hình dựng lại để sau này cắt ghép, thay nhạc hoặc dựng thêm góc quay. MP4 hiện có đã chứa nhạc: khi dựng bản tổng hợp cần kiểm tra điểm nối và credit; quyền của nhạc Product01 hiện chỉ xác minh cho YouTube. Không mặc định cấp phép đa nền tảng hoặc bỏ credit. Muốn bản hình sạch nhạc có thể chép riêng video stream từ MP4 final (`-map 0:v:0 -c:v copy -an`) sang file mới, giữ nguyên chất lượng hình rồi QA lại. Không cần AI tách nhạc; chỉ dựng lại từ source nếu cần góc máy/nội dung khác.

Các thư mục `*-v1`, `*-v2` trong **source** không phải tất cả là bản nháp: bundle Long/Short Product03 hiện kế thừa trực tiếp 15 thư mục qua 34/31 file. Kết quả phân tích import thực tế nằm ở `ACTIVE-SOURCE-DEPENDENCIES.json` trong audit consolidation. Giữ source/test/giới hạn và lịch sử gọn cho khả năng phát triển sau này; xoá chúng có thể làm bản final không dựng lại được. Không thay kiến trúc assembly chỉ để đổi tên thư mục.

Không có render/mux/âm thanh mới trong consolidation. Những log tạm, lỗi tải nhạc cũ và ZIP evidence trùng được chuyển vào `redundant-support-history.tar.gz` đã kiểm SHA thay vì bày riêng trong final. Raw cache cũ vẫn không Resume được.
