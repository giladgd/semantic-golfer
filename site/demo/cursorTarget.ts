type Point = {x: number, y: number};

export function getCursorTarget(
    from: Point, bounds: {left: number, top: number, right: number, bottom: number}, aim: Point, inset: number
): Point {
    const x = Math.min(bounds.right, Math.max(bounds.left, from.x));
    const y = Math.min(bounds.bottom, Math.max(bounds.top, from.y));
    return {x: x + (aim.x - x) * inset, y: y + (aim.y - y) * inset};
}

export function getCursorPosition(from: Point, to: Point, progress: number, curve: number): Point {
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.hypot(dx, dy);
    const t = Math.max(0, Math.min(1, progress));
    // Bow perpendicular to the path, capped at 18px, and meet both endpoints exactly.
    const bend = Math.sign(curve) * Math.min(18, distance * Math.abs(curve)) * 4 * t * (1 - t);
    return {x: from.x + dx * progress - dy / (distance || 1) * bend,
        y: from.y + dy * progress + dx / (distance || 1) * bend};
}
