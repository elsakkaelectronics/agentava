// filters.js
export class OneEuroFilter {
  constructor(minCutoff = 1.2, beta = 0.03, dCutoff = 1.0) {
    this.minCutoff = minCutoff; this.beta = beta; this.dCutoff = dCutoff;
    this.xPrev = null; this.dxPrev = 0; this.tPrev = null;
  }
  updateParams(minC, b) { this.minCutoff = minC; this.beta = b; }
  _alpha(cutoff, dt) { const tau = 1.0 / (2 * Math.PI * cutoff); return 1.0 / (1.0 + tau / dt); }
  filter(x, t) {
    if (this.tPrev === null) { this.tPrev = t; this.xPrev = x; return x; }
    const dt = Math.max(1e-4, t - this.tPrev);
    const dx = (x - this.xPrev) / dt;
    const aD = this._alpha(this.dCutoff, dt);
    const edx = aD * dx + (1 - aD) * this.dxPrev;
    const cutoff = this.minCutoff + this.beta * Math.abs(edx);
    const a = this._alpha(cutoff, dt);
    const xHat = a * x + (1 - a) * this.xPrev;
    this.xPrev = xHat; this.dxPrev = edx; this.tPrev = t;
    return xHat;
  }
}