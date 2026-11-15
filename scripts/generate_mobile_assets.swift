import AppKit
import Foundation

guard let sourceImage = NSImage(contentsOfFile: "src/assets/falcon-softwares-logo.png") else {
    print("Error: Could not load src/assets/falcon-softwares-logo.png")
    exit(1)
}

let aspectRatio = sourceImage.size.width / sourceImage.size.height

// =========================================================================
// 1. MINIMALIST BRANDED SPLASH SCREEN RENDERER
// =========================================================================
func renderMinimalistSplash(width: Int, height: Int) -> Data? {
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
    let w = CGFloat(width)
    let h = CGFloat(height)
    
    // 1. Pure White Background matching Logo
    cg.setFillColor(CGColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0))
    cg.fill(CGRect(x: 0, y: 0, width: w, height: h))
    
    // 2. Centered Logo
    var logoW: CGFloat
    if isPortrait {
        logoW = min(w * 0.72, w - 48.0)
    } else {
        logoW = min(w * 0.44, h * 1.25)
    }
    let logoH = logoW / aspectRatio
    
    // Position logo slightly above vertical center (53.5% from bottom in Cocoa coords)
    let logoCenterY = isPortrait ? (h * 0.535) : (h * 0.58)
    let logoX = (w - logoW) / 2.0
    let logoY = logoCenterY - (logoH / 2.0)
    let logoRect = CGRect(x: logoX, y: logoY, width: logoW, height: logoH)
    
    if let cgImage = sourceImage.cgImage(forProposedRect: nil, context: nil, hints: nil) {
        cg.draw(cgImage, in: logoRect)
    }
    
    // 3. Circular Loading Spinner Below Logo (Exact Chickado Style with Falcon Theme)
    let spinnerDiameter: CGFloat
    if isPortrait {
        spinnerDiameter = min(w * 0.115, h * 0.058)
    } else {
        spinnerDiameter = min(h * 0.13, 64.0)
    }
    let spinnerRadius = spinnerDiameter / 2.0
    let strokeW = max(2.5, spinnerDiameter * 0.085)
    
    let spinnerGap = max(16.0, isPortrait ? (h * 0.065) : (h * 0.075))
    let spinnerCenterY = logoY - spinnerGap - spinnerRadius
    let spinnerCenterX = w / 2.0
    
    // 3a. Faint Background Track Circle
    cg.saveGState()
    cg.setLineCap(.round)
    cg.setLineWidth(strokeW)
    
    // Light sky-blue / cyan tint for track
    cg.setStrokeColor(CGColor(red: 2/255.0, green: 107/255.0, blue: 160/255.0, alpha: 0.14))
    cg.addArc(center: CGPoint(x: spinnerCenterX, y: spinnerCenterY), radius: spinnerRadius, startAngle: 0, endAngle: .pi * 2, clockwise: false)
    cg.strokePath()
    
    // 3b. Active Vivid Arc (Falcon Blue #026ba0)
    cg.setStrokeColor(CGColor(red: 2/255.0, green: 107/255.0, blue: 160/255.0, alpha: 1.0))
    let startAngle: CGFloat = -.pi * 0.18
    let endAngle: CGFloat = .pi * 0.42
    cg.addArc(center: CGPoint(x: spinnerCenterX, y: spinnerCenterY), radius: spinnerRadius, startAngle: startAngle, endAngle: endAngle, clockwise: false)
    cg.strokePath()
    cg.restoreGState()
    
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

print("--- Generating Minimalist White Splash Screens ---")
for (path, w, h) in splashTargets {
    if let data = renderMinimalistSplash(width: w, height: h) {
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

print("All splash screens and mobile app icons generated successfully!")
