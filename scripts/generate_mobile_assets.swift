import AppKit
import Foundation

guard let sourceImage = NSImage(contentsOfFile: "src/assets/falcon-softwares-logo.png") else {
    print("Error: Could not load src/assets/falcon-softwares-logo.png")
    exit(1)
}

let aspectRatio = sourceImage.size.width / sourceImage.size.height

// =========================================================================
// 1. EXECUTIVE SPLASH SCREEN RENDERER
// =========================================================================
func renderExecutiveSplash(width: Int, height: Int) -> Data? {
    let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: width,
        pixelsHigh: height,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    )!
    
    NSGraphicsContext.saveGraphicsState()
    let context = NSGraphicsContext(bitmapImageRep: rep)!
    NSGraphicsContext.current = context
    context.imageInterpolation = .high
    
    let cg = context.cgContext
    let isPortrait = height >= width
    let isCompactLandscape = !isPortrait && height <= 380
    let w = CGFloat(width)
    let h = CGFloat(height)
    let minDim = min(w, h)
    
    // --- 1. Base Midnight Gradient Background ---
    let colorSpace = CGColorSpaceCreateDeviceRGB()
    let bgColors = [
        CGColor(red: 5/255.0, green: 10/255.0, blue: 20/255.0, alpha: 1.0),
        CGColor(red: 10/255.0, green: 20/255.0, blue: 38/255.0, alpha: 1.0),
        CGColor(red: 6/255.0, green: 12/255.0, blue: 24/255.0, alpha: 1.0)
    ] as CFArray
    let bgLocations: [CGFloat] = [0.0, 0.5, 1.0]
    if let bgGradient = CGGradient(colorsSpace: colorSpace, colors: bgColors, locations: bgLocations) {
        cg.drawLinearGradient(bgGradient, start: CGPoint(x: 0, y: h), end: CGPoint(x: w, y: 0), options: [])
    }
    
    // Center point of the emblem
    let centerX = w / 2.0
    let cardCenterY = isPortrait ? (h * 0.53) : (isCompactLandscape ? (h * 0.58) : (h * 0.55))
    
    // --- 2. Ambient Radial Cyan Glow Behind Emblem ---
    let radialColors = [
        CGColor(red: 6/255.0, green: 63/255.0, blue: 120/255.0, alpha: 0.65),
        CGColor(red: 2/255.0, green: 132/255.0, blue: 199/255.0, alpha: 0.28),
        CGColor(red: 5/255.0, green: 10/255.0, blue: 20/255.0, alpha: 0.0)
    ] as CFArray
    let radialLocations: [CGFloat] = [0.0, 0.45, 1.0]
    let radialRadius = max(w, h) * 0.52
    if let radialGradient = CGGradient(colorsSpace: colorSpace, colors: radialColors, locations: radialLocations) {
        cg.drawRadialGradient(
            radialGradient,
            startCenter: CGPoint(x: centerX, y: cardCenterY),
            startRadius: 0,
            endCenter: CGPoint(x: centerX, y: cardCenterY),
            endRadius: radialRadius,
            options: []
        )
    }
    
    // --- 3. Concentric Orbital Tech Rings ---
    cg.saveGState()
    cg.setLineCap(.round)
    
    // Ring 1 (Dashed Inner)
    let ring1Radius = minDim * 0.38
    cg.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.08))
    cg.setLineWidth(max(1.0, minDim * 0.002))
    cg.setLineDash(phase: 0, lengths: [6, 8])
    cg.addArc(center: CGPoint(x: centerX, y: cardCenterY), radius: ring1Radius, startAngle: 0, endAngle: .pi * 2, clockwise: false)
    cg.strokePath()
    
    // Ring 2 (Faint Solid Middle)
    let ring2Radius = minDim * 0.54
    cg.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.045))
    cg.setLineWidth(max(1.0, minDim * 0.0015))
    cg.setLineDash(phase: 0, lengths: [])
    cg.addArc(center: CGPoint(x: centerX, y: cardCenterY), radius: ring2Radius, startAngle: 0, endAngle: .pi * 2, clockwise: false)
    cg.strokePath()
    
    // Ring 3 (Dashed Outer)
    let ring3Radius = minDim * 0.70
    cg.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.03))
    cg.setLineWidth(max(1.0, minDim * 0.0015))
    cg.setLineDash(phase: 0, lengths: [10, 10])
    cg.addArc(center: CGPoint(x: centerX, y: cardCenterY), radius: ring3Radius, startAngle: 0, endAngle: .pi * 2, clockwise: false)
    cg.strokePath()
    cg.restoreGState()
    
    // --- 4. Tech Corner Accents ---
    cg.saveGState()
    let cornerMargin = max(12.0, minDim * 0.05)
    let cornerLen = max(14.0, minDim * 0.055)
    cg.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.12))
    cg.setLineWidth(max(1.2, minDim * 0.003))
    
    // Bottom-Left
    cg.move(to: CGPoint(x: cornerMargin, y: cornerMargin + cornerLen))
    cg.addLine(to: CGPoint(x: cornerMargin, y: cornerMargin))
    cg.addLine(to: CGPoint(x: cornerMargin + cornerLen, y: cornerMargin))
    
    // Bottom-Right
    cg.move(to: CGPoint(x: w - cornerMargin - cornerLen, y: cornerMargin))
    cg.addLine(to: CGPoint(x: w - cornerMargin, y: cornerMargin))
    cg.addLine(to: CGPoint(x: w - cornerMargin, y: cornerMargin + cornerLen))
    
    // Top-Left
    cg.move(to: CGPoint(x: cornerMargin, y: h - cornerMargin - cornerLen))
    cg.addLine(to: CGPoint(x: cornerMargin, y: h - cornerMargin))
    cg.addLine(to: CGPoint(x: cornerMargin + cornerLen, y: h - cornerMargin))
    
    // Top-Right
    cg.move(to: CGPoint(x: w - cornerMargin - cornerLen, y: h - cornerMargin))
    cg.addLine(to: CGPoint(x: w - cornerMargin, y: h - cornerMargin))
    cg.addLine(to: CGPoint(x: w - cornerMargin, y: h - cornerMargin - cornerLen))
    cg.strokePath()
    cg.restoreGState()
    
    // --- 5. Floating 3D Brand Emblem Card ---
    var cardW: CGFloat
    var cardH: CGFloat
    
    if isPortrait {
        cardW = min(w * 0.74, 580.0)
        cardH = cardW / 2.7
    } else if isCompactLandscape {
        cardH = min(h * 0.32, 110.0)
        cardW = cardH * 2.7
    } else {
        cardH = min(h * 0.36, 260.0)
        cardW = cardH * 2.7
    }
    
    let cardX = centerX - (cardW / 2.0)
    let cardY = cardCenterY - (cardH / 2.0)
    let cardRect = CGRect(x: cardX, y: cardY, width: cardW, height: cardH)
    let cornerRadius = cardH * 0.18
    let cardPath = CGPath(roundedRect: cardRect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)
    
    // Ambient Glow Behind Card
    cg.saveGState()
    let glowRect = cardRect.insetBy(dx: -cardW * 0.04, dy: -cardH * 0.08)
    let glowPath = CGPath(roundedRect: glowRect, cornerWidth: cornerRadius * 1.2, cornerHeight: cornerRadius * 1.2, transform: nil)
    cg.setShadow(
        offset: CGSize(width: 0, height: -cardH * 0.12),
        blur: cardH * 0.45,
        color: CGColor(red: 2/255.0, green: 132/255.0, blue: 199/255.0, alpha: 0.45)
    )
    cg.addPath(glowPath)
    cg.setFillColor(CGColor(red: 2/255.0, green: 132/255.0, blue: 199/255.0, alpha: 0.15))
    cg.fillPath()
    cg.restoreGState()
    
    // Directional 3D Downward Drop-Shadow
    cg.saveGState()
    cg.setShadow(
        offset: CGSize(width: 0, height: -cardH * 0.14),
        blur: cardH * 0.30,
        color: CGColor(red: 0, green: 0, blue: 0, alpha: 0.65)
    )
    cg.addPath(cardPath)
    cg.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1.0))
    cg.fillPath()
    cg.restoreGState()
    
    // Crisp Card Body & Subtle Border
    cg.saveGState()
    cg.addPath(cardPath)
    cg.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1.0))
    cg.fillPath()
    
    cg.addPath(cardPath)
    cg.setStrokeColor(CGColor(red: 226/255.0, green: 232/255.0, blue: 240/255.0, alpha: 0.8))
    cg.setLineWidth(max(1.0, cardH * 0.012))
    cg.strokePath()
    cg.restoreGState()
    
    // Draw Falcon Softwares Logo Inside Card
    let maxLogoW = cardW * 0.78
    let maxLogoH = cardH * 0.72
    let scale = min(maxLogoW / sourceImage.size.width, maxLogoH / sourceImage.size.height)
    let logoW = sourceImage.size.width * scale
    let logoH = sourceImage.size.height * scale
    let logoX = cardX + (cardW - logoW) / 2.0
    let logoY = cardY + (cardH - logoH) / 2.0
    let logoRect = CGRect(x: logoX, y: logoY, width: logoW, height: logoH)
    
    if let cgImage = sourceImage.cgImage(forProposedRect: nil, context: nil, hints: nil) {
        cg.draw(cgImage, in: logoRect)
    }
    
    // --- 6. Enterprise App Typography Below Card ---
    let titleGap = max(isCompactLandscape ? 10.0 : 14.0, cardH * (isPortrait ? 0.32 : (isCompactLandscape ? 0.16 : 0.22)))
    let title1Y = cardY - titleGap
    let title1Size = max(isCompactLandscape ? 11.0 : 13.0, minDim * (isPortrait ? 0.046 : (isCompactLandscape ? 0.034 : 0.040)))
    
    let pStyle = NSMutableParagraphStyle()
    pStyle.alignment = .center
    
    // Line 1: DAIRY BUSINESS
    let title1Attrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: title1Size, weight: .bold),
        .foregroundColor: NSColor.white,
        .paragraphStyle: pStyle,
        .kern: max(1.2, title1Size * 0.12)
    ]
    let title1Str = NSAttributedString(string: "DAIRY BUSINESS", attributes: title1Attrs)
    let title1Rect = CGRect(x: 0, y: title1Y - title1Size, width: w, height: title1Size * 1.5)
    title1Str.draw(in: title1Rect)
    
    // Line 2: MANAGEMENT SYSTEM
    let title2Size = title1Size * 0.72
    let title2Y = title1Y - title1Size - (title2Size * 0.45)
    let title2Attrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: title2Size, weight: .semibold),
        .foregroundColor: NSColor(red: 56/255.0, green: 189/255.0, blue: 248/255.0, alpha: 1.0),
        .paragraphStyle: pStyle,
        .kern: max(1.4, title2Size * 0.18)
    ]
    let title2Str = NSAttributedString(string: "MANAGEMENT SYSTEM", attributes: title2Attrs)
    let title2Rect = CGRect(x: 0, y: title2Y - title2Size, width: w, height: title2Size * 1.5)
    title2Str.draw(in: title2Rect)
    
    // Subtle Divider Accent Line under Title
    let dividerY = title2Y - title2Size - max(isCompactLandscape ? 7.0 : 10.0, minDim * 0.018)
    let dividerW = cardW * 0.45
    let dividerColors = [
        CGColor(red: 56/255.0, green: 189/255.0, blue: 248/255.0, alpha: 0.0),
        CGColor(red: 56/255.0, green: 189/255.0, blue: 248/255.0, alpha: 0.75),
        CGColor(red: 56/255.0, green: 189/255.0, blue: 248/255.0, alpha: 0.0)
    ] as CFArray
    let dividerLocations: [CGFloat] = [0.0, 0.5, 1.0]
    if let divGradient = CGGradient(colorsSpace: colorSpace, colors: dividerColors, locations: dividerLocations) {
        cg.saveGState()
        cg.clip(to: CGRect(x: centerX - dividerW / 2.0, y: dividerY, width: dividerW, height: max(1.5, minDim * 0.002)))
        cg.drawLinearGradient(
            divGradient,
            start: CGPoint(x: centerX - dividerW / 2.0, y: dividerY),
            end: CGPoint(x: centerX + dividerW / 2.0, y: dividerY),
            options: []
        )
        cg.restoreGState()
    }
    
    // --- 7. Sleek Footer & Loading Accent ---
    let footerBaseY = max(isCompactLandscape ? 12.0 : 18.0, h * (isCompactLandscape ? 0.05 : 0.065))
    
    // Loading Pill Track
    let trackW = min(w * 0.32, 220.0)
    let trackH = max(2.5, minDim * 0.005)
    let trackX = centerX - (trackW / 2.0)
    let trackY = footerBaseY + max(isCompactLandscape ? 16.0 : 24.0, minDim * 0.032)
    
    cg.saveGState()
    let trackRect = CGRect(x: trackX, y: trackY, width: trackW, height: trackH)
    let trackPath = CGPath(roundedRect: trackRect, cornerWidth: trackH / 2.0, cornerHeight: trackH / 2.0, transform: nil)
    cg.addPath(trackPath)
    cg.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.12))
    cg.fillPath()
    
    // Active glowing bar within track
    let activeW = trackW * 0.44
    let activeRect = CGRect(x: trackX + (trackW - activeW) / 2.0, y: trackY, width: activeW, height: trackH)
    let activePath = CGPath(roundedRect: activeRect, cornerWidth: trackH / 2.0, cornerHeight: trackH / 2.0, transform: nil)
    
    cg.setShadow(
        offset: .zero,
        blur: 6.0,
        color: CGColor(red: 56/255.0, green: 189/255.0, blue: 248/255.0, alpha: 0.8)
    )
    cg.addPath(activePath)
    cg.setFillColor(CGColor(red: 56/255.0, green: 189/255.0, blue: 248/255.0, alpha: 0.95))
    cg.fillPath()
    cg.restoreGState()
    
    // Footer Tagline
    let footerSize = max(isCompactLandscape ? 7.5 : 8.5, minDim * (isCompactLandscape ? 0.016 : 0.018))
    let footerAttrs: [NSAttributedString.Key: Any] = [
        .font: NSFont.systemFont(ofSize: footerSize, weight: .medium),
        .foregroundColor: NSColor(red: 148/255.0, green: 163/255.0, blue: 184/255.0, alpha: 0.8),
        .paragraphStyle: pStyle,
        .kern: max(1.0, footerSize * 0.14)
    ]
    let footerStr = NSAttributedString(string: "POWERED BY FALCON SOFTWARES", attributes: footerAttrs)
    let footerRect = CGRect(x: 0, y: footerBaseY, width: w, height: footerSize * 1.5)
    footerStr.draw(in: footerRect)
    
    NSGraphicsContext.restoreGraphicsState()
    
    return rep.representation(using: .png, properties: [:])
}

// =========================================================================
// 2. APP ICON RENDERER
// =========================================================================
func renderIconImage(width: Int, height: Int, isRound: Bool = false, isForeground: Bool = false) -> Data? {
    let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: width,
        pixelsHigh: height,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    )!
    
    NSGraphicsContext.saveGraphicsState()
    let context = NSGraphicsContext(bitmapImageRep: rep)!
    NSGraphicsContext.current = context
    context.imageInterpolation = .high
    
    let cgContext = context.cgContext
    
    if isForeground {
        cgContext.clear(CGRect(x: 0, y: 0, width: width, height: height))
    } else if isRound {
        cgContext.clear(CGRect(x: 0, y: 0, width: width, height: height))
        cgContext.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
        cgContext.fillEllipse(in: CGRect(x: 0, y: 0, width: width, height: height))
    } else {
        cgContext.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
        cgContext.fill(CGRect(x: 0, y: 0, width: width, height: height))
    }
    
    var logoWidth: CGFloat
    if isForeground {
        logoWidth = CGFloat(width) * 0.60
    } else if isRound {
        logoWidth = CGFloat(width) * 0.72
    } else {
        logoWidth = CGFloat(width) * 0.82
    }
    
    let logoHeight = logoWidth / aspectRatio
    let x = (CGFloat(width) - logoWidth) / 2.0
    let y = (CGFloat(height) - logoHeight) / 2.0
    let drawRect = CGRect(x: x, y: y, width: logoWidth, height: logoHeight)
    
    if let cgImage = sourceImage.cgImage(forProposedRect: nil, context: nil, hints: nil) {
        cgContext.draw(cgImage, in: drawRect)
    }
    
    NSGraphicsContext.restoreGraphicsState()
    
    return rep.representation(using: .png, properties: [:])
}

// =========================================================================
// 3. EXECUTE GENERATION: ALL SPLASH SCREENS
// =========================================================================
let splashTargets: [(String, Int, Int)] = [
    ("android/app/src/main/res/drawable/splash.png", 480, 320),
    ("android/app/src/main/res/drawable-port-mdpi/splash.png", 320, 480),
    ("android/app/src/main/res/drawable-port-hdpi/splash.png", 480, 800),
    ("android/app/src/main/res/drawable-port-xhdpi/splash.png", 720, 1280),
    ("android/app/src/main/res/drawable-port-xxhdpi/splash.png", 960, 1600),
    ("android/app/src/main/res/drawable-port-xxxhdpi/splash.png", 1280, 1920),
    ("android/app/src/main/res/drawable-land-mdpi/splash.png", 480, 320),
    ("android/app/src/main/res/drawable-land-hdpi/splash.png", 800, 480),
    ("android/app/src/main/res/drawable-land-xhdpi/splash.png", 1280, 720),
    ("android/app/src/main/res/drawable-land-xxhdpi/splash.png", 1600, 960),
    ("android/app/src/main/res/drawable-land-xxxhdpi/splash.png", 1920, 1280)
]

print("--- Generating Executive Splash Screens ---")
for (path, w, h) in splashTargets {
    if let data = renderExecutiveSplash(width: w, height: h) {
        let url = URL(fileURLWithPath: path)
        try? data.write(to: url)
        print("Generated Splash: \(path) (\(w)x\(h))")
    }
}

// =========================================================================
// 4. EXECUTE GENERATION: ALL APP ICONS
// =========================================================================
let iconDensities: [(String, Int, Int)] = [
    ("mdpi", 48, 108),
    ("hdpi", 72, 162),
    ("xhdpi", 96, 216),
    ("xxhdpi", 144, 324),
    ("xxxhdpi", 192, 432)
]

print("--- Generating Mobile App Icons ---")
for (density, iconSize, fgSize) in iconDensities {
    // ic_launcher.png
    let launcherPath = "android/app/src/main/res/mipmap-\(density)/ic_launcher.png"
    if let data = renderIconImage(width: iconSize, height: iconSize) {
        try? data.write(to: URL(fileURLWithPath: launcherPath))
        print("Generated Icon: \(launcherPath)")
    }
    
    // ic_launcher_round.png
    let roundPath = "android/app/src/main/res/mipmap-\(density)/ic_launcher_round.png"
    if let data = renderIconImage(width: iconSize, height: iconSize, isRound: true) {
        try? data.write(to: URL(fileURLWithPath: roundPath))
        print("Generated Round Icon: \(roundPath)")
    }
    
    // ic_launcher_foreground.png
    let fgPath = "android/app/src/main/res/mipmap-\(density)/ic_launcher_foreground.png"
    if let data = renderIconImage(width: fgSize, height: fgSize, isForeground: true) {
        try? data.write(to: URL(fileURLWithPath: fgPath))
        print("Generated Foreground: \(fgPath)")
    }
}

print("All executive splash screens and mobile app icons generated successfully!")
