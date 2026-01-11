#!/usr/bin/env python3
"""
Generate a Lottie animation for ReceiptKeeper splash screen.
Animation sequence:
1. Receipt paper fades in and scales up
2. Lines draw in one by one
3. Green circle scales in
4. Checkmark draws in with a satisfying animation
"""

import json
import math

# Animation settings
CANVAS_WIDTH = 200
CANVAS_HEIGHT = 200
FPS = 60
DURATION_SECONDS = 2.0
TOTAL_FRAMES = int(FPS * DURATION_SECONDS)

# Colors (as [r, g, b, a] normalized 0-1)
WHITE = [1, 1, 1, 1]
GRAY_LINE = [0.878, 0.878, 0.878, 1]  # #E0E0E0
GREEN = [0.133, 0.773, 0.369, 1]  # #22C55E
BG_COLOR = [0.043, 0.239, 0.180, 1]  # #0B3D2E

def create_bezier_easing(x1, y1, x2, y2):
    """Create bezier easing curve."""
    return {
        "i": {"x": [x2], "y": [y2]},
        "o": {"x": [x1], "y": [y1]}
    }

# Easing presets
EASE_OUT = create_bezier_easing(0.0, 0.0, 0.2, 1.0)
EASE_IN_OUT = create_bezier_easing(0.42, 0.0, 0.58, 1.0)
EASE_OUT_BACK = create_bezier_easing(0.0, 0.0, 0.2, 1.4)

def animated_value(keyframes):
    """Create animated property with keyframes."""
    return {"a": 1, "k": keyframes}

def static_value(value):
    """Create static (non-animated) property."""
    return {"a": 0, "k": value}

def keyframe(time, value, easing=None, hold=False):
    """Create a keyframe."""
    kf = {"t": time, "s": value if isinstance(value, list) else [value]}
    if easing:
        kf.update(easing)
    if hold:
        kf["h"] = 1
    return kf

def create_rect_shape(x, y, width, height, roundness=0):
    """Create a rectangle shape."""
    return {
        "ty": "rc",
        "p": static_value([x + width/2, y + height/2]),
        "s": static_value([width, height]),
        "r": static_value(roundness)
    }

def create_fill(color):
    """Create a fill."""
    return {
        "ty": "fl",
        "c": static_value(color),
        "o": static_value(100)
    }

def create_stroke(color, width):
    """Create a stroke."""
    return {
        "ty": "st",
        "c": static_value(color),
        "o": static_value(100),
        "w": static_value(width),
        "lc": 2,  # Round cap
        "lj": 2   # Round join
    }

def create_ellipse(cx, cy, rx, ry):
    """Create an ellipse shape."""
    return {
        "ty": "el",
        "p": static_value([cx, cy]),
        "s": static_value([rx * 2, ry * 2])
    }

def create_path(path_data):
    """Create a path shape from vertices."""
    return {
        "ty": "sh",
        "ks": static_value(path_data)
    }

def create_trim(start_frames, end_frame):
    """Create trim paths for line drawing effect."""
    return {
        "ty": "tm",
        "s": animated_value([
            keyframe(start_frames[0], 0, EASE_OUT),
            keyframe(start_frames[1], 0, EASE_OUT),
            keyframe(end_frame, 0)
        ]),
        "e": animated_value([
            keyframe(start_frames[0], 0, EASE_OUT),
            keyframe(start_frames[1], 0, EASE_OUT),
            keyframe(end_frame, 100)
        ]),
        "o": static_value(0),
        "m": 1
    }

def create_transform(anchor=[0,0], position=[0,0], scale=[100,100], rotation=0, opacity=100):
    """Create a transform."""
    return {
        "ty": "tr",
        "a": static_value(anchor),
        "p": static_value(position),
        "s": static_value(scale),
        "r": static_value(rotation),
        "o": static_value(opacity)
    }

def create_animated_transform(anchor=[0,0], position_kf=None, scale_kf=None, rotation_kf=None, opacity_kf=None):
    """Create animated transform."""
    transform = {
        "ty": "tr",
        "a": static_value(anchor)
    }
    
    if position_kf:
        transform["p"] = animated_value(position_kf)
    else:
        transform["p"] = static_value([0, 0])
    
    if scale_kf:
        transform["s"] = animated_value(scale_kf)
    else:
        transform["s"] = static_value([100, 100])
    
    if rotation_kf:
        transform["r"] = animated_value(rotation_kf)
    else:
        transform["r"] = static_value(0)
    
    if opacity_kf:
        transform["o"] = animated_value(opacity_kf)
    else:
        transform["o"] = static_value(100)
    
    return transform

def create_receipt_layer():
    """Create the receipt paper with animated entrance."""
    start_frame = 0
    end_frame = 25
    
    return {
        "ty": 4,
        "nm": "Receipt Paper",
        "sr": 1,
        "ks": {
            "a": static_value([100, 100]),  # Anchor at center
            "p": static_value([100, 100]),  # Position at center
            "s": animated_value([
                keyframe(start_frame, [0, 0], EASE_OUT_BACK),
                keyframe(end_frame, [100, 100])
            ]),
            "r": static_value(0),
            "o": animated_value([
                keyframe(start_frame, [0], EASE_OUT),
                keyframe(end_frame - 10, [100])
            ])
        },
        "shapes": [
            {
                "ty": "gr",
                "it": [
                    create_rect_shape(40, 20, 120, 160, 8),
                    create_fill(WHITE),
                    create_transform()
                ],
                "nm": "Paper"
            }
        ],
        "ip": 0,
        "op": TOTAL_FRAMES,
        "st": 0
    }

def create_line_layer(y_pos, width, delay_frame, name):
    """Create an animated line that draws in."""
    start_frame = delay_frame
    end_frame = delay_frame + 15
    
    # Line path
    line_path = {
        "c": False,
        "v": [[55, y_pos], [55 + width - 55, y_pos]],
        "i": [[0, 0], [0, 0]],
        "o": [[0, 0], [0, 0]]
    }
    
    return {
        "ty": 4,
        "nm": name,
        "sr": 1,
        "ks": {
            "a": static_value([0, 0]),
            "p": static_value([0, 0]),
            "s": static_value([100, 100]),
            "r": static_value(0),
            "o": static_value(100)
        },
        "shapes": [
            {
                "ty": "gr",
                "it": [
                    create_path(line_path),
                    create_stroke(GRAY_LINE, 3),
                    create_trim([start_frame, start_frame], end_frame),
                    create_transform()
                ],
                "nm": name
            }
        ],
        "ip": 0,
        "op": TOTAL_FRAMES,
        "st": 0
    }

def create_circle_layer():
    """Create the green circle with pop-in animation."""
    start_frame = 45
    end_frame = 65
    
    return {
        "ty": 4,
        "nm": "Green Circle",
        "sr": 1,
        "ks": {
            "a": static_value([140, 140]),  # Anchor at circle center
            "p": static_value([140, 140]),
            "s": animated_value([
                keyframe(start_frame, [0, 0], EASE_OUT_BACK),
                keyframe(end_frame, [100, 100])
            ]),
            "r": static_value(0),
            "o": static_value(100)
        },
        "shapes": [
            {
                "ty": "gr",
                "it": [
                    create_ellipse(140, 140, 35, 35),
                    create_fill(GREEN),
                    create_transform()
                ],
                "nm": "Circle"
            }
        ],
        "ip": 0,
        "op": TOTAL_FRAMES,
        "st": 0
    }

def create_checkmark_layer():
    """Create the checkmark with draw animation."""
    start_frame = 60
    end_frame = 85
    
    # Checkmark path: M125 140 L135 150 L158 125
    check_path = {
        "c": False,
        "v": [[125, 140], [135, 150], [158, 125]],
        "i": [[0, 0], [0, 0], [0, 0]],
        "o": [[0, 0], [0, 0], [0, 0]]
    }
    
    return {
        "ty": 4,
        "nm": "Checkmark",
        "sr": 1,
        "ks": {
            "a": static_value([0, 0]),
            "p": static_value([0, 0]),
            "s": static_value([100, 100]),
            "r": static_value(0),
            "o": static_value(100)
        },
        "shapes": [
            {
                "ty": "gr",
                "it": [
                    create_path(check_path),
                    create_stroke(WHITE, 6),
                    create_trim([start_frame, start_frame], end_frame),
                    create_transform()
                ],
                "nm": "Check"
            }
        ],
        "ip": 0,
        "op": TOTAL_FRAMES,
        "st": 0
    }

def create_lottie_animation():
    """Create the complete Lottie animation."""
    animation = {
        "v": "5.7.4",
        "fr": FPS,
        "ip": 0,
        "op": TOTAL_FRAMES,
        "w": CANVAS_WIDTH,
        "h": CANVAS_HEIGHT,
        "nm": "ReceiptKeeper Splash",
        "ddd": 0,
        "assets": [],
        "layers": [
            create_checkmark_layer(),
            create_circle_layer(),
            create_line_layer(110, 120, 35, "Line 4"),
            create_line_layer(90, 140, 30, "Line 3"),
            create_line_layer(70, 130, 25, "Line 2"),
            create_line_layer(50, 145, 20, "Line 1"),
            create_receipt_layer()
        ]
    }
    
    return animation

def main():
    animation = create_lottie_animation()
    
    output_path = "../assets/splash_animation.json"
    with open(output_path, "w") as f:
        json.dump(animation, f, indent=2)
    
    print(f"✓ Lottie animation saved to {output_path}")
    print(f"  - Duration: {DURATION_SECONDS}s ({TOTAL_FRAMES} frames @ {FPS}fps)")
    print(f"  - Canvas: {CANVAS_WIDTH}x{CANVAS_HEIGHT}")

if __name__ == "__main__":
    main()
