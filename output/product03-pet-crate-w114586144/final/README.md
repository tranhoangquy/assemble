# Product #03 — retained final package

- `long/`, `short/`: hai video final; giữ nguyên nội dung hình/nhạc và SHA256.
- `music/`: nguồn nhạc, bản quyền, WAV master và cấu hình dựng nhạc; không phải video phiên bản cũ.
- `release-assets/`: ảnh nguồn thumbnail/poster.
- `qa/`: hồ sơ chốt phim; `source-audit/`: manual, BOM và giới hạn nguồn; `reproduction/`: hai ảnh chuẩn và cấu hình render.

Catalog hiện hành: [release-catalog.json](../../../docs/publishing/release-catalog.json).
Dùng lại/tổng hợp: [hướng dẫn](../../../docs/publishing/reproduction-and-retention.md).

Các báo cáo, script và SHA manifest lúc sản xuất giữ nguyên nội dung snapshot cũ. Đường dẫn cũ không có nghĩa là file đã mất: tra [bảng chuyển vị trí](../../final-products-consolidation-20261026/PLAN.json). Script lịch sử có thể tham chiếu cache đã xoá; dùng các helper hiện hành trong `scripts/` theo hướng dẫn trước khi dựng lại. Không chạy trực tiếp script cũ trên master.

Lịch sử quan trọng đã nén ở `output/final-products-cleanup-20261026/`; không xoá FAIL hoặc đổi mức tin cậy cơ khí. Source có tên phiên bản vẫn là dependency của bản final, không phải video thừa.
