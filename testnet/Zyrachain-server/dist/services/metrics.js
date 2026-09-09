"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.inc = inc;
exports.setGauge = setGauge;
exports.time = time;
exports.getMetricsSnapshot = getMetricsSnapshot;
const counters = new Map();
function inc(key, by = 1) {
    counters.set(key, (counters.get(key) ?? 0) + by);
}
function setGauge(key, value) {
    counters.set(key, value);
}
function time(key, fn) {
    const started = Date.now();
    return fn().finally(() => {
        inc(key, Date.now() - started);
    });
}
function getMetricsSnapshot() {
    const out = {};
    for (const [k, v] of counters.entries())
        out[k] = v;
    return out;
}
//# sourceMappingURL=metrics.js.map