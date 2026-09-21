// SageLilyTheme.swift — starter for the DailyUI `Theme` layer.
// Values come from design/theme-sage-lily.json. Views read tokens from the environment;
// no view hard-codes a color, font, size or radius (see CLAUDE.md).

import SwiftUI

// MARK: - Theme protocol (DailyUI)

public protocol Theme: Sendable {
    var name: String { get }
    var colors: ThemeColors { get }
    var type: ThemeType { get }
    var radius: ThemeRadius { get }
    var space: ThemeSpace { get }
    var sizes: ThemeSizes { get }
    var motion: ThemeMotion { get }
    var materials: ThemeMaterials { get }
}

public struct ThemeColors: Sendable {
    public var background, surface, surfaceAlt, ink, inkMuted, line, accent, accentInk, accentSecondary, sage, done, danger: Color
}

public struct ThemeType: Sendable {
    public var display, displaySmall, stat, body, ui, meta, label, micro: Font
    public var labelTracking: CGFloat
}

public struct ThemeRadius: Sendable { public var window, card, control, pill, checkbox: CGFloat }
public struct ThemeSpace: Sendable { public var xs, s, m, l, window, xl: CGFloat }
public struct ThemeSizes: Sendable { public var checkbox, checkboxWidget, ring, ringWidget, ringStroke, rowMinHeight: CGFloat; public var windowMin: CGSize }

public struct ThemeMotion: Sendable {
    public var taskComplete, taskAdd, taskRemove, reorder, dayRollover, reviewCardSwipe, allDoneCelebration, streakIncrement: Animation
    public var completePopScale: [CGFloat]   // keyframes
    public var addRise: CGFloat
}

public enum ThemeMaterial: Sendable { case solid, ultraThin, glass }
public struct ThemeMaterials: Sendable { public var window, toolbar, entryBar, rows: ThemeMaterial }

// MARK: - Environment plumbing

private struct ThemeKey: EnvironmentKey { static let defaultValue: any Theme = SageLilyTheme() }
public extension EnvironmentValues { var theme: any Theme { get { self[ThemeKey.self] } set { self[ThemeKey.self] = newValue } } }
public extension View { func theme(_ t: any Theme) -> some View { environment(\.theme, t) } }

// MARK: - Sage Lily

public struct SageLilyTheme: Theme {
    public init() {}
    public let name = "Sage Lily"

    // Light / dark pairs; SwiftUI picks by color scheme.
    private static func dyn(_ light: String, _ dark: String) -> Color {
        Color(nsColor: NSColor(name: nil) { a in
            a.bestMatch(from: [.darkAqua, .vibrantDark]) != nil ? NSColor(hex: dark) : NSColor(hex: light)
        })
    }

    public var colors: ThemeColors {
        .init(
            background:      Self.dyn("#FBF7F5", "#1E241C"),
            surface:         Self.dyn("#FFFFFF", "#262E23"),
            surfaceAlt:      Self.dyn("#E6EBDB", "#303A2C"),
            ink:             Self.dyn("#2F352B", "#EEF1E6"),
            inkMuted:        Self.dyn("#7E8A74", "#A6B09B"),
            line:            Self.dyn("#DCE3D2", "#3A4535"),
            accent:          Self.dyn("#6F8461", "#9CAD8C"),
            accentInk:       Self.dyn("#FFFFFF", "#1E241C"),
            accentSecondary: Self.dyn("#CE859A", "#D9A0B0"),
            sage:            Self.dyn("#9CAD8C", "#7F9A73"),
            done:            Self.dyn("#B9C2B0", "#6E7A64"),
            danger:          Self.dyn("#B8564A", "#D98A80")
        )
    }

    public var type: ThemeType {
        // Custom fonts registered via ATSApplicationFontsPath; .relativeTo keeps Dynamic Type.
        .init(
            display:      .custom("Cormorant Garamond Medium", size: 34, relativeTo: .largeTitle),
            displaySmall: .custom("Cormorant Garamond Medium", size: 20, relativeTo: .title2),
            stat:         .custom("Cormorant Garamond Bold", size: 18, relativeTo: .title3).monospacedDigit(),
            body:         .custom("Jost", size: 15, relativeTo: .body),
            ui:           .custom("Jost SemiBold", size: 12, relativeTo: .caption),
            meta:         .custom("Jost", size: 12, relativeTo: .caption),
            label:        .custom("Jost Medium", size: 11, relativeTo: .caption2),
            micro:        .custom("Jost SemiBold", size: 10, relativeTo: .caption2),
            labelTracking: 0.08
        )
    }

    public var radius: ThemeRadius { .init(window: 14, card: 12, control: 8, pill: 999, checkbox: 11) }
    public var space: ThemeSpace { .init(xs: 4, s: 8, m: 12, l: 16, window: 22, xl: 32) }
    public var sizes: ThemeSizes { .init(checkbox: 22, checkboxWidget: 16, ring: 36, ringWidget: 56, ringStroke: 4, rowMinHeight: 40, windowMin: .init(width: 360, height: 480)) }
    public var materials: ThemeMaterials { .init(window: .solid, toolbar: .ultraThin, entryBar: .ultraThin, rows: .solid) }

    public var motion: ThemeMotion {
        .init(
            taskComplete: .easeOut(duration: 0.25),
            taskAdd: .easeOut(duration: 0.20),
            taskRemove: .easeIn(duration: 0.15),
            reorder: .easeInOut(duration: 0.20),
            dayRollover: .easeInOut(duration: 0.40),
            reviewCardSwipe: .easeOut(duration: 0.20),
            allDoneCelebration: .easeOut(duration: 0.25),
            streakIncrement: .easeInOut(duration: 0.15),
            completePopScale: [0.6, 1.15, 1.0],
            addRise: 8
        )
    }
}

// A deliberately ugly second theme proves the token layer (spec: "at least two implementations").
public struct TestTheme: Theme {
    public init() {}
    public let name = "Test"
    public var colors: ThemeColors { .init(background: .black, surface: .yellow, surfaceAlt: .orange, ink: .blue, inkMuted: .purple, line: .red, accent: .green, accentInk: .black, accentSecondary: .pink, sage: .mint, done: .gray, danger: .red) }
    public var type: ThemeType { .init(display: .system(size: 40, weight: .black, design: .monospaced), displaySmall: .system(size: 24, design: .monospaced), stat: .system(size: 18, design: .monospaced), body: .system(size: 16, design: .serif), ui: .system(size: 12), meta: .system(size: 12), label: .system(size: 11), micro: .system(size: 10), labelTracking: 0.2) }
    public var radius: ThemeRadius { .init(window: 0, card: 0, control: 0, pill: 0, checkbox: 0) }
    public var space: ThemeSpace { .init(xs: 2, s: 4, m: 8, l: 12, window: 8, xl: 16) }
    public var sizes: ThemeSizes { .init(checkbox: 28, checkboxWidget: 20, ring: 48, ringWidget: 64, ringStroke: 8, rowMinHeight: 48, windowMin: .init(width: 360, height: 480)) }
    public var materials: ThemeMaterials { .init(window: .solid, toolbar: .solid, entryBar: .solid, rows: .solid) }
    public var motion: ThemeMotion { .init(taskComplete: .linear(duration: 1), taskAdd: .linear(duration: 1), taskRemove: .linear(duration: 1), reorder: .linear(duration: 1), dayRollover: .linear(duration: 1), reviewCardSwipe: .linear(duration: 1), allDoneCelebration: .linear(duration: 1), streakIncrement: .linear(duration: 1), completePopScale: [1, 2, 1], addRise: 40) }
}

// MARK: - Helpers

extension NSColor {
    convenience init(hex: String) {
        var s = hex.trimmingCharacters(in: .whitespacesAndNewlines); if s.hasPrefix("#") { s.removeFirst() }
        var v: UInt64 = 0; Scanner(string: s).scanHexInt64(&v)
        self.init(srgbRed: CGFloat((v >> 16) & 0xFF) / 255, green: CGFloat((v >> 8) & 0xFF) / 255, blue: CGFloat(v & 0xFF) / 255, alpha: 1)
    }
}
