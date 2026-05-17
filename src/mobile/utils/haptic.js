const PATTERNS = {
    light:   [8],
    medium:  [16],
    heavy:   [30],
    success: [8, 50, 8],
    error:   [40, 30, 40],
    warning: [20, 20, 20],
    select:  [4],
};

export function haptic(type = 'light') {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(PATTERNS[type] ?? PATTERNS.light);
    }
}
