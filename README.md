# Furniture Video Engine

Prototype của một **Automated 3D Assembly Video Generator**. POC dùng Next.js, TypeScript, React Three Fiber, Three.js và GSAP để dựng nhiều sản phẩm hoàn toàn từ JSON, preview trên global timeline và xuất frame deterministic để encode MP4.

> Checkpoint hiện hành: WF311613 standalone Murphy Bed, PDF Steps 1–3, action-speed review. PDF là nguồn engineering; các kích thước không in trong PDF vẫn được đánh dấu estimated. Các sản phẩm bookcase/Merax cũ là package riêng, không phải cấu phần của WF311613. Steps 4+ chưa được triển khai theo chuẩn review mới.

## Chạy development

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`. Chọn Murphy Bed hoặc Demo Cabinet trong header. URL giữ sản phẩm đang mở, ví dụ `/?product=demo-cabinet`.

Nhấn **Export video** để chọn 720p/1080p và 30/60 FPS. UI tạo background job, hiển thị tiến độ render/encode, cho phép hủy và tải MP4 khi hoàn tất. Generate File lưu checkpoint bền vững, chia công việc theo chunk frame và cho phép Resume sau gián đoạn. Cancel giữ cache; Delete render là thao tác riêng. Xem [resumable export](docs/resumable-export.md) để biết lifecycle, API và chính sách lưu trữ. Cần tiến trình Node/Next chạy liên tục; khi server khởi động lại, job tương thích có thể Resume.

## Kiểm tra và build

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

## Ba lớp dữ liệu

- `src/products/<product-key>/product/`: parts, geometry parameters, materials và evidence của sản phẩm.
- `src/products/<product-key>/assembly/`: assembly và installation paths riêng của sản phẩm.
- `src/products/<product-key>/director/`: DirectorPlan, cameras, pacing và checkpoint variants.
- `src/products/<product-key>/index.ts`: public product package; các package JSON cũ vẫn tự chứa trong thư mục sản phẩm.
- `src/products/registry.ts`: đăng ký/discover package. `manager.ts` / `export-manager.ts` là composition root, inject registry vào engine dùng chung.

Core engine không chứa ID/geometry/camera/pacing riêng cho sản phẩm. Thêm sản phẩm bằng cách tạo folder, export package, đăng ký trong registry. `ProductManager` validate hierarchy, action target, dependency graph, installation path, collision, assembly step, camera preset và quick action trước khi viewer sử dụng.

## Physical Assembly System V2

Mỗi step có thể khai báo `dependsOn`, `accessBarrierFor` và `orderSource`. Mỗi connection action có thể khai báo `id`, `dependsOn`, `secures` và `installation` gồm staging/pre-install offset, approach vector, sampling, tolerance và `allowedContacts`.

Validator dựng đường `START → STAGING → PRE_INSTALL → ALIGN → FINAL`, sample moving AABB, phân biệt expected contact với collision không hợp lệ, kiểm tra target/connection, dependency cycle, hardware accessibility và panel đóng access quá sớm. Debug menu có grid, pivot, bounds, install path, connection point và collision boxes. Bấm một validation issue sẽ chọn part, seek tới scene, bật debug path và focus camera. Play bị chặn khi còn lỗi blocking; Export yêu cầu xác nhận **Export anyway** và API cũng kiểm tra lại.

## Deterministic MP4 render

Yêu cầu máy có Chromium của Playwright và FFmpeg:

```bash
npx playwright install chromium
npm run build
npm start
```

Trong terminal khác:

```bash
npm run render:video
PRODUCT_ID=wf311613-standalone-murphy-bed node --import tsx scripts/render-checkpoints.ts
PRODUCT_ID=wf311613-standalone-murphy-bed node --import tsx scripts/validate-assembly.ts
```

Render-only route hỗ trợ product ID: `http://localhost:3000/render?project=murphy-bed`.

Script mở `/render`, gọi `window.__VIDEO_RENDERER__.renderFrame(frame / fps)`, chụp toàn viewport (canvas + HTML overlay), rồi encode H.264/yuv420p. Preview và export dùng chung `VideoEngine` và absolute video time. Mặc định:

- Frames: `output/<product-key>/frames/<project-id>-<unique-run>/frame-000000.png` (không xóa frame của lần xuất trước).
- Video: `output/<product-key>/reviews/<checkpoint>/<package-filename>.mp4`
- Screenshots: `output/<product-key>/screenshots/<project-id>/`
- Sources: `references/<product-key>/` và metadata/review notes trong package.
- URL: `http://localhost:3000`

Có thể override bằng `RENDER_URL`, `PROJECT_ID`, `OUTPUT_WIDTH`, `OUTPUT_HEIGHT`, `OUTPUT_FPS`, `FRAMES_DIR`, `OUTPUT_FILE`. `START_TIME=68 FRAME_LIMIT=3` hữu ích cho smoke test một đoạn mà không render toàn video.

API job dùng thư mục riêng `output/export-jobs/render-<profile>-<identity>-<jobId>/`, giữ frames/manifest sau encode và download cho đến khi người dùng chọn Delete render. Các job temp cũ không có checkpoint version 2 không được tự suy đoán là resumable. API:

- `POST /api/export`
- `GET /api/export/<jobId>`
- `DELETE /api/export/<jobId>`
- `GET /api/export/<jobId>/download`

## Action hỗ trợ

Primitive actions: `move`, `rotate`, `scale`, `show`, `hide`, `visibility`, `highlight`, `unhighlight`, `screw`, `explode`, `ghost`, `focus`, `clearFocus`, `camera`, `wait`.

Connection-driven operations: `installPart`, `alignPart`, `insertPart`, `installScrew`, `installBolt`, `installWasher`, `installNut`, `installDowel`, `installBracket`, `installHinge`, `testPivot`, `testMechanism`. Mỗi operation resolve hướng approach từ `part.connectionPoints`, đi qua các waypoint staging/alignment và vẫn compile vào một GSAP timeline tuyệt đối.

Scene metadata còn hỗ trợ `partIntro`, `callouts` và `completionAt`. Các overlay này nằm ngay trong render output, không phụ thuộc editor sidebar.

Mọi target resolve qua `ObjectRegistry`. `bed_pivot` và hai leg pivot là group thật trong hierarchy; rail, deck, fascia, mattress và legs là descendants nên đi theo cơ cấu. Seek dùng GSAP timeline tuyệt đối, không dùng wall-clock cho frame export. Murphy Bed hiện có 16 scene / 193 giây; duration đến từ các connection và hardware step, không còn bị giới hạn 01:24.

## Giới hạn POC

- Geometry dùng primitive box/cylinder/sphere; adapter `model` đã có trong type nhưng chưa load GLB.
- Screw/bolt/nut animation kết hợp approach + translate + nhiều vòng quay, không mô phỏng ren hoặc lực siết vật lý.
- Gas-assist được biểu diễn bằng primitive và không phải mô phỏng động học piston chính xác của hãng.
- Không voiceover, texture photorealistic, AI reconstruction hoặc Amazon runtime integration.
# assemble
