/* Price charts: 1Y sparkline per US entry, click-through modal. Pure SVG, no deps.
   Data: worker /history (KV-backed, refreshed daily by GitHub Actions). */
(function () {
    "use strict";
    var WORKER = "https://moecap-prices.iamkingori.workers.dev";

    // ---- pure math (exposed for tests) ----
    function scale(closes, w, h, pad) {
        pad = pad || 2;
        var min = Infinity, max = -Infinity;
        for (var i = 0; i < closes.length; i++) {
            if (closes[i] < min) min = closes[i];
            if (closes[i] > max) max = closes[i];
        }
        var span = max - min || 1;
        var step = closes.length > 1 ? (w - pad * 2) / (closes.length - 1) : 0;
        return closes.map(function (c, i) {
            return [pad + i * step, h - pad - ((c - min) / span) * (h - pad * 2)];
        });
    }
    function sparkPath(closes, w, h) {
        var pts = scale(closes, w, h);
        return pts.map(function (p, i) { return (i === 0 ? "M" : "L") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    }
    function areaPath(closes, w, h) {
        return sparkPath(closes, w, h) + " L" + (w - 2) + " " + (h - 2) + " L2 " + (h - 2) + " Z";
    }
    function pctOver(closes) {
        if (!closes || closes.length < 2) return null;
        var a = closes[0], b = closes[closes.length - 1];
        return a > 0 ? (b / a - 1) * 100 : null;
    }
    var api = { scale: scale, sparkPath: sparkPath, areaPath: areaPath, pctOver: pctOver };
    if (typeof window !== "undefined") window.MoecapCharts = api;
    if (typeof document === "undefined") return; // test import — math only

    // ---- DOM ----
    var HIST = null;

    function colorFor(p) { return p >= 0 ? "#16a34a" : "#dc2626"; }

    function sparklineCell(t, e) {
        var cell = document.createElement("div");
        cell.style.cssText = "cursor:pointer;";
        var label = document.createElement("span");
        label.style.cssText = "display:block;font-size:0.75rem;color:var(--meta,#999);";
        var p = pctOver(e.closes);
        label.textContent = "1Y Trend" + (p !== null ? " (" + (p >= 0 ? "+" : "") + p.toFixed(0) + "%)" : "");
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "110"); svg.setAttribute("height", "34");
        svg.setAttribute("viewBox", "0 0 110 34");
        svg.style.display = "block";
        var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", sparkPath(e.closes, 110, 34));
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", colorFor(p));
        path.setAttribute("stroke-width", "1.6");
        svg.appendChild(path);
        cell.appendChild(label);
        cell.appendChild(svg);
        cell.addEventListener("click", function (ev) { ev.preventDefault(); openModal(t, e); });
        return cell;
    }

    var MODAL = null;
    function openModal(t, e) {
        closeModal();
        MODAL = document.createElement("div");
        MODAL.style.cssText = "position:fixed;inset:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;";
        var p = pctOver(e.closes);
        var box = document.createElement("div");
        box.style.cssText = "background:#fffdf5;border-radius:12px;padding:20px 24px;max-width:92vw;font-family:Georgia,serif;box-shadow:0 24px 80px rgba(0,0,0,.4);";
        var title = document.createElement("div");
        title.style.cssText = "font-size:1.05rem;color:#333;margin-bottom:4px;";
        title.textContent = t + " — 1 year (" + e.first + " → " + e.last + ")";
        var sub = document.createElement("div");
        sub.style.cssText = "font-size:0.85rem;margin-bottom:12px;color:" + colorFor(p) + ";font-weight:bold;";
        var last = e.closes[e.closes.length - 1];
        var hi = Math.max.apply(null, e.closes), lo = Math.min.apply(null, e.closes);
        sub.textContent = "last $" + last.toFixed(2) + " · " + (p >= 0 ? "+" : "") + p.toFixed(1) + "% · high $" + hi.toFixed(2) + " · low $" + lo.toFixed(2);
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "640"); svg.setAttribute("height", "240");
        svg.setAttribute("viewBox", "0 0 640 240");
        svg.style.cssText = "max-width:100%;height:auto;display:block;";
        var area = document.createElementNS("http://www.w3.org/2000/svg", "path");
        area.setAttribute("d", areaPath(e.closes, 640, 240));
        area.setAttribute("fill", p >= 0 ? "rgba(22,163,74,.12)" : "rgba(220,38,38,.12)");
        var line = document.createElementNS("http://www.w3.org/2000/svg", "path");
        line.setAttribute("d", sparkPath(e.closes, 640, 240));
        line.setAttribute("fill", "none");
        line.setAttribute("stroke", colorFor(p));
        line.setAttribute("stroke-width", "2.2");
        svg.appendChild(area); svg.appendChild(line);
        var note = document.createElement("div");
        note.style.cssText = "font-size:0.68rem;color:#8a6d1a;margin-top:10px;";
        note.textContent = "Daily closes · tap anywhere to close · data via moecap-prices worker (daily refresh)";
        box.appendChild(title); box.appendChild(sub); box.appendChild(svg); box.appendChild(note);
        MODAL.appendChild(box);
        MODAL.addEventListener("click", closeModal);
        document.addEventListener("keydown", escClose);
        document.body.appendChild(MODAL);
    }
    function escClose(ev) { if (ev.key === "Escape") { closeModal(); } }
    function closeModal() {
        if (MODAL) { MODAL.remove(); MODAL = null; document.removeEventListener("keydown", escClose); }
    }

    function boot() {
        var grid = document.querySelector("details[data-ticker]");
        if (!grid) return; // not the US page
        fetch(WORKER + "/history").then(function (r) { return r.json(); }).then(function (h) {
            HIST = h;
            document.querySelectorAll("details[data-ticker]").forEach(function (d) {
                var t = (d.getAttribute("data-ticker") || "").toUpperCase();
                var e = HIST.entries && HIST.entries[t];
                if (!e || !e.closes || e.closes.length < 30) return;
                var holder = d.querySelector(".stock-analysis-text, .meta-grid");
                var metaGrid = d.querySelector('div[style*="grid-template-columns"]');
                var target = metaGrid || d.querySelector(".stock-analysis-text");
                if (!target || d.querySelector(".chart-cell")) return;
                var cell = sparklineCell(t, e);
                cell.className = "chart-cell";
                target.appendChild(cell);
            });
        }).catch(function (err) {
            console.log("charts: history unavailable", err && err.message);
        });
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else { boot(); }
})();
