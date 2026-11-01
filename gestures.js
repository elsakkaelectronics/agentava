// gestures.js
export const PINCH_THRESHOLD = 0.06;
export function isPinching(lm) {
  const t = lm[4], i = lm[8];
  return Math.hypot(t.x - i.x, t.y - i.y) < 0.08;
}
export function mapTip(lm, xMin, xMax, yMin, yMax) {
  const tip = lm[8];
  return {
    nx: Math.max(0, Math.min(1, ((1 - tip.x) - xMin) / (xMax - xMin))),
    ny: Math.max(0, Math.min(1, (tip.y - yMin) / (yMax - yMin)))
  };
}
export function mapPalm(lm, xMin, xMax, yMin, yMax) {
  const wrist = lm[0];
  return {
    nx: Math.max(0, Math.min(1, ((1 - wrist.x) - xMin) / (xMax - xMin))),
    ny: Math.max(0, Math.min(1, (wrist.y - yMin) / (yMax - yMin)))
  };
}
export function createDoublePinchDetector({ windowMs = 400, onClick, onRightClick }) {
  let pendingTimer = null, lastRelease = 0;
  return function(now) {
    if (pendingTimer && now - lastRelease < windowMs) {
      clearTimeout(pendingTimer); pendingTimer = null; lastRelease = 0;
      onRightClick?.(); return 'rightclick';
    }
    lastRelease = now;
    pendingTimer = setTimeout(() => { pendingTimer = null; onClick?.(); }, windowMs);
    return 'click';
  };
}