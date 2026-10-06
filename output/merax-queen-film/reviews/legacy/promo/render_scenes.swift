import AppKit

let base = URL(fileURLWithPath: CommandLine.arguments[1])
let width: CGFloat = 1920
let height: CGFloat = 1080

let scenes: [(String, String, String)] = [
    ("02-dimensions.jpg", "SPACE-SAVING MURPHY BED + DESK", "Một căn phòng, hai công năng."),
    ("01-desk.jpg", "A DESK WHEN YOU NEED TO FOCUS", "Ban ngày là bàn làm việc tiện dụng."),
    ("03-room.jpg", "A FULL-SIZE BED WHEN IT'S TIME TO REST", "Chuyển đổi nhanh chóng với hệ thống nâng thủy lực."),
    ("04-frame.jpg", "SMART ENGINEERING. SOLID SUPPORT.", "Thiết kế chắc chắn, vận hành gọn gàng."),
    ("05-open.jpg", "WORK BY DAY. REST BY NIGHT.", "Merax Murphy Bed — tối ưu từng mét vuông.")
]

func drawText(_ text: String, rect: NSRect, size: CGFloat, color: NSColor, alignment: NSTextAlignment = .center) {
    let p = NSMutableParagraphStyle()
    p.alignment = alignment
    p.lineBreakMode = .byWordWrapping
    let attrs: [NSAttributedString.Key: Any] = [
        .font: NSFont(name: "Arial-BoldMT", size: size) ?? NSFont.boldSystemFont(ofSize: size),
        .foregroundColor: color,
        .paragraphStyle: p
    ]
    (text as NSString).draw(in: rect, withAttributes: attrs)
}

for (index, scene) in scenes.enumerated() {
    guard let image = NSImage(contentsOf: base.appendingPathComponent("assets/\(scene.0)")) else { fatalError("Missing \(scene.0)") }
    let canvas = NSImage(size: NSSize(width: width, height: height))
    canvas.lockFocus()

    NSColor.black.setFill()
    NSRect(x: 0, y: 0, width: width, height: height).fill()
    let source = NSRect(origin: .zero, size: image.size)
    let scale = max(width / image.size.width, height / image.size.height)
    let drawSize = NSSize(width: image.size.width * scale, height: image.size.height * scale)
    let drawRect = NSRect(x: (width - drawSize.width) / 2, y: (height - drawSize.height) / 2, width: drawSize.width, height: drawSize.height)
    image.draw(in: drawRect, from: source, operation: .sourceOver, fraction: 1)

    NSColor(calibratedWhite: 0.03, alpha: 0.46).setFill()
    NSRect(x: 0, y: height - 82, width: width, height: 82).fill()
    NSRect(x: 0, y: 0, width: width, height: 225).fill()

    drawText("MERAX   |   SMART SPACE LIVING", rect: NSRect(x: 56, y: height - 61, width: 800, height: 45), size: 32, color: .white, alignment: .left)
    drawText(scene.1, rect: NSRect(x: 80, y: 132, width: width - 160, height: 66), size: 48, color: .white)
    drawText(scene.2, rect: NSRect(x: 90, y: 51, width: width - 180, height: 54), size: 34, color: NSColor(calibratedRed: 0.96, green: 0.78, blue: 0.48, alpha: 1))

    canvas.unlockFocus()
    guard let tiff = canvas.tiffRepresentation,
          let rep = NSBitmapImageRep(data: tiff),
          let png = rep.representation(using: .png, properties: [:]) else { fatalError("PNG render failed") }
    try png.write(to: base.appendingPathComponent(String(format: "scene-%02d.png", index + 1)))
}

