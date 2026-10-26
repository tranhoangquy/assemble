# Final media — Product #01 and Product #03

Đợt dọn ngày 2026-10-26 chỉ áp dụng #01 WF311613 và #03 pet crate. **#02 JULIETTE chưa hoàn tất, không dọn, không đưa thay đổi của #02 vào commit này.**

| Sản phẩm | Long chính | Short chính | Hướng dẫn đăng / nguồn nhạc |
|---|---|---|---|
| #01 WF311613 | [Long 720p, 8:44](../../output/wf311613-standalone-murphy-bed/final/long/WF311613-final-lofi-720p.mp4) | [Short 1080×1920, 58s](../../output/wf311613-standalone-murphy-bed/final/short/WF311613-short02-FINAL-vertical-1080p.mp4) | [Product01](product-01.md) |
| #03 Wood & Steel Pet Crate | [Long 720p, 4:38](../../output/product03-pet-crate-w114586144/final/long/PRODUCT03-Long-FINAL-720p.mp4) | [Short 1080×1920, 59s](../../output/product03-pet-crate-w114586144/final/short/PRODUCT03-Short-FINAL-1080x1920.mp4) | [Product03](product-03.md) |

[Catalog đường dẫn/hash](release-catalog.json) · [Tái tạo và vòng đời cache](reproduction-and-retention.md).

Các tệp video cuối giữ nguyên bytes. Không đăng bài/video, không thay nhạc, không render hay sửa hình trong đợt dọn. Lịch sử QA, các lần FAIL, quyết định Director và hash cũ được nén riêng theo sản phẩm trong [hồ sơ dọn](../../output/final-products-cleanup-20261026/). Các snapshot lịch sử có thể nhắc tệp đã được xoá có chủ đích; dùng deletion ledger và catalog hiện tại để kiểm tra, không dùng cache cũ để Resume.

Git dùng chính sách LFS hiện có cho MP4/WAV/PNG/M4A; không sửa lịch sử Git hay xoá đối tượng LFS trên remote. Clone mới cần `git lfs pull` để nhận media thật thay vì pointer.
