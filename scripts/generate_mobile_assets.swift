import AppKit
import Foundation

guard let sourceImage = NSImage(contentsOfFile: "src/assets/falcon-softwares-logo.png") else {
    print("Error: Could not load src/assets/falcon-softwares-logo.png")
    exit(1)
}

let aspectRatio = sourceImage.size.width / sourceImage.size.height

func renderImage(width: Int, height: Int, isRound: Bool = false, isForeground: Bool = false, isSplash: Bool = false) -> Data? {
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
        // Transparent background
        cgContext.clear(CGRect(x: 0, y: 0, width: width, height: height))
    } else if isRound {
        // Transparent background with White circle
        cgContext.clear(CGRect(x: 0, y: 0, width: width, height: height))
        cgContext.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
        cgContext.fillEllipse(in: CGRect(x: 0, y: 0, width: width, height: height))
    } else {
        // Pure White background
        cgContext.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
        cgContext.fill(CGRect(x: 0, y: 0, width: width, height: height))
    }
    
    var logoWidth: CGFloat
    if isSplash {
        if width < height {
            // Portrait splash
            logoWidth = min(CGFloat(width) * 0.72, CGFloat(width) - 40)
        } else {
            // Landscape splash
            logoWidth = min(CGFloat(width) * 0.48, CGFloat(height) * 1.4)
        }
    } else if isForeground {
        // Foreground: safe zone is inner 66%
        logoWidth = CGFloat(width) * 0.60
    } else if isRound {
        // Round icon: safe zone inside circle
        logoWidth = CGFloat(width) * 0.72
    } else {
        // Standard square/squircle icon
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

// 1. Generate Splash Screens
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

for (path, w, h) in splashTargets {
    if let data = renderImage(width: w, height: h, isSplash: true) {
        let url = URL(fileURLWithPath: path)
        try? data.write(to: url)
        print("Generated Splash: \(path) (\(w)x\(h))")
    }
}

// 2. Generate App Icons
let iconDensities: [(String, Int, Int)] = [
    ("mdpi", 48, 108),
    ("hdpi", 72, 162),
    ("xhdpi", 96, 216),
    ("xxhdpi", 144, 324),
    ("xxxhdpi", 192, 432)
]

for (density, iconSize, fgSize) in iconDensities {
    // ic_launcher.png
    let launcherPath = "android/app/src/main/res/mipmap-\(density)/ic_launcher.png"
    if let data = renderImage(width: iconSize, height: iconSize) {
        try? data.write(to: URL(fileURLWithPath: launcherPath))
        print("Generated Icon: \(launcherPath)")
    }
    
    // ic_launcher_round.png
    let roundPath = "android/app/src/main/res/mipmap-\(density)/ic_launcher_round.png"
    if let data = renderImage(width: iconSize, height: iconSize, isRound: true) {
        try? data.write(to: URL(fileURLWithPath: roundPath))
        print("Generated Round Icon: \(roundPath)")
    }
    
    // ic_launcher_foreground.png
    let fgPath = "android/app/src/main/res/mipmap-\(density)/ic_launcher_foreground.png"
    if let data = renderImage(width: fgSize, height: fgSize, isForeground: true) {
        try? data.write(to: URL(fileURLWithPath: fgPath))
        print("Generated Foreground: \(fgPath)")
    }
}

print("All splash screens and mobile app icons generated successfully!")
