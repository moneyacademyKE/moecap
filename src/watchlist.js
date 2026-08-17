/* Watchlist: star US entries and NSE cards; floating strip shows live prices from the worker. */
(function () {
    "use strict";
    var KEY = "moecap-watch";
    var WORKER = "https://moecap-prices.iamkingori.workers.dev";
    var cache = load();

    function load() {
        try {
            var v = JSON.parse(localStorage.getItem(KEY) || "{}");
            return { us: v.us || [], nse: v.nse || [] };
        } catch (e) { return { us: [], nse: [] }; }
    }
    function save() { try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) {} }
    function toggle(kind, t) {
        var arr = cache[kind];
        var i = arr.indexOf(t);
        if (i >= 0) arr.splice(i, 1); else arr.push(t);
        save();
        paintStars();
        renderStrip();
    }
    function has(kind, t) { return cache[kind].indexOf(t) >= 0; }

    function starBtn(kind, t) {
        var on = has(kind, t);
        var b = document.createElement("button");
        b.className = "wl-star";
        b.setAttribute("data-wl-kind", kind);
        b.setAttribute("data-wl-t", t);
        b.textContent = on ? "★" : "☆";
        b.title = on ? "Remove from watchlist" : "Add to watchlist";
        b.addEventListener("click", function (ev) {
            ev.preventDefault(); ev.stopPropagation();
            toggle(kind, t);
        });
        return b;
    }

    function injectStars() {
        // US entries
        document.querySelectorAll("details[data-ticker] > summary").forEach(function (s) {
            if (s.querySelector(".wl-star")) return;
            var t = s.parentElement.getAttribute("data-ticker").toUpperCase();
            s.appendChild(starBtn("us", t));
        });
        // NSE cards
        document.querySelectorAll(".stock-item-card .stock-card-row").forEach(function (row) {
            if (row.querySelector(".wl-star")) return;
            var card = row.closest(".stock-item-card");
            var t = card.getAttribute("data-ticker");
            if (t) row.appendChild(starBtn("nse", t));
        });
    }
    function paintStars() {
        document.querySelectorAll(".wl-star").forEach(function (b) {
            var on = has(b.getAttribute("data-wl-kind"), b.getAttribute("data-wl-t"));
            b.textContent = on ? "★" : "☆";
        });
    }

    // Floating strip
    var STRIP = null, PANEL = null, OPEN = false;
    function ensureStrip() {
        if (STRIP) return;
        var css = document.createElement("style");
        css.textContent =
            ".wl-star{background:none;border:none;cursor:pointer;font-size:1.05rem;color:#d9a514;padding:0 4px;line-height:1;flex-shrink:0;}" +
            ".wl-star:hover{transform:scale(1.25);}" +
            "#wl-strip{position:fixed;bottom:14px;right:14px;z-index:9997;font-family:Georgia,serif;}" +
            "#wl-btn{background:#1c1917;color:#fbbf24;border:1px solid #d9a514;border-radius:999px;padding:8px 16px;font-size:0.85rem;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.35);}" +
            "#wl-panel{display:none;background:#fffdf5;border:1px solid #d8c98a;border-radius:10px;box-shadow:0 14px 40px rgba(0,0,0,.3);margin-bottom:8px;width:260px;max-height:55vh;overflow-y:auto;padding:8px 0;}" +
            "#wl-panel.open{display:block;}" +
            ".wl-row{display:flex;justify-content:space-between;align-items:center;padding:7px 14px;font-size:0.8rem;color:#333;}" +
            ".wl-row:hover{background:#f5ecd0;}" +
            ".wl-k{font-size:0.58rem;color:#fff;border-radius:3px;padding:1px 5px;margin-right:6px;}" +
            ".wl-p{font-weight:bold;color:#8a6d1a;}" +
            ".wl-empty{padding:14px;color:#999;font-size:0.78rem;text-align:center;}";
        document.head.appendChild(css);
        STRIP = document.createElement("div");
        STRIP.id = "wl-strip";
        STRIP.innerHTML = '<div id="wl-panel"></div><button id="wl-btn">★ Watchlist (0)</button>';
        document.body.appendChild(STRIP);
        PANEL = STRIP.querySelector("#wl-panel");
        STRIP.querySelector("#wl-btn").addEventListener("click", function () {
            OPEN = !OPEN;
            PANEL.className = OPEN ? "open" : "";
            if (OPEN) renderStrip();
        });
    }

    function fmt(n) { return typeof n === "number" ? n.toFixed(2) : "—"; }

    function renderStrip() {
        if (!STRIP) return;
        var n = cache.us.length + cache.nse.length;
        STRIP.querySelector("#wl-btn").textContent = "★ Watchlist (" + n + ")";
        if (!OPEN) return;
        if (n === 0) {
            PANEL.innerHTML = '<div class="wl-empty">Star any stock or NSE company to track it here.</div>';
            return;
        }
        fetch(WORKER + "/prices").then(function (r) { return r.json(); }).then(function (prices) {
            return fetch(WORKER + "/nse").then(function (r) { return r.json(); }).catch(function () { return { prices: {} }; }).then(function (nse) {
                var html = "";
                cache.us.forEach(function (t) {
                    var e = (prices.entries || {})[t] || {};
                    html += '<div class="wl-row"><span><span class="wl-k" style="background:#2563eb;">US</span><b></b>' + esc(t) + "</span>" +
                        '<span class="wl-p">$' + fmt(e.price) + "</span></div>";
                });
                cache.nse.forEach(function (t) {
                    var p = (nse.prices || {})[t];
                    html += '<div class="wl-row"><span><span class="wl-k" style="background:#16a34a;">NSE</span>' + esc(t) + "</span>" +
                        '<span class="wl-p">' + (p ? "KES " + fmt(p) : "—") + "</span></div>";
                });
                PANEL.innerHTML = html;
            });
        }).catch(function () {
            PANEL.innerHTML = '<div class="wl-empty">Live prices unavailable — worker unreachable.</div>';
        });
    }
    function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }

    function boot() {
        injectStars();
        ensureStrip();
        renderStrip();
        // NSE cards render statically; US details too — but re-inject defensively after hydration paints
        setTimeout(injectStars, 1500);
    }
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else { boot(); }
})();
