/* Site search: press "/" to search stocks, NSE companies, book notes. */
(function () {
    "use strict";
    var ROWS = null;
    var BOX = null, INPUT = null, LIST = null, SEL = 0, RESULTS = [];

    function ensureBox() {
        if (BOX) return;
        BOX = document.createElement("div");
        BOX.id = "search-overlay";
        BOX.style.cssText = "display:none;position:fixed;inset:0;z-index:9998;background:rgba(0,0,0,.55);padding-top:10vh;";
        BOX.innerHTML =
            '<div style="max-width:560px;margin:0 auto;background:#fffdf5;border-radius:10px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.4);font-family:Georgia,serif;">' +
            '<input id="search-input" placeholder="Search stocks, NSE companies, books…  (Esc to close)" ' +
            'style="width:100%;box-sizing:border-box;padding:14px 18px;font-size:1rem;border:none;border-bottom:1px solid #d8c98a;outline:none;background:transparent;color:#333;" />' +
            '<div id="search-list" style="max-height:50vh;overflow-y:auto;"></div>' +
            '<div style="padding:6px 18px;font-size:0.68rem;color:#8a6d1a;border-top:1px solid #eee3bd;">↑↓ navigate · Enter open · Esc close</div>' +
            "</div>";
        document.body.appendChild(BOX);
        INPUT = BOX.querySelector("#search-input");
        LIST = BOX.querySelector("#search-list");
        INPUT.addEventListener("input", function () { render(filter(INPUT.value)); });
        INPUT.addEventListener("keydown", function (ev) {
            if (ev.key === "ArrowDown") { ev.preventDefault(); move(1); }
            else if (ev.key === "ArrowUp") { ev.preventDefault(); move(-1); }
            else if (ev.key === "Enter") { ev.preventDefault(); go(RESULTS[SEL]); }
            else if (ev.key === "Escape") { close(); }
        });
        BOX.addEventListener("click", function (ev) { if (ev.target === BOX) close(); });
    }

    function esc(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
        });
    }
    var KIND_LABEL = { us: "US", nse: "NSE", book: "Book" };
    var KIND_COLOR = { us: "#2563eb", nse: "#16a34a", book: "#8a6d1a" };

    function filter(q) {
        q = q.trim().toLowerCase();
        if (!q || !ROWS) return [];
        var ql = q.toLowerCase;
        var out = [];
        for (var i = 0; i < ROWS.length && out.length < 30; i++) {
            var r = ROWS[i];
            if ((r.t + " " + r.n + " " + (r.s || "")).toLowerCase().indexOf(q) !== -1) out.push(r);
        }
        // exact ticker matches first
        out.sort(function (a, b) {
            var ax = a.t.toLowerCase() === q ? 0 : 1, bx = b.t.toLowerCase() === q ? 0 : 1;
            return ax - bx;
        });
        return out;
    }

    function render(rows) {
        RESULTS = rows; SEL = 0;
        if (!rows.length) {
            LIST.innerHTML = '<div style="padding:16px 18px;color:#999;font-size:0.9rem;">No matches.</div>';
            return;
        }
        var html = "";
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            html +=
                '<div class="sr" data-i="' + i + '" style="padding:9px 18px;cursor:pointer;display:flex;justify-content:space-between;gap:12px;' +
                (i === 0 ? "background:#f5ecd0;" : "") + '">' +
                '<span style="color:#333;font-size:0.9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' +
                "<b>" + esc(r.t) + "</b> — " + esc(r.n) + "</span>" +
                '<span style="flex-shrink:0;font-size:0.62rem;color:#fff;background:' + KIND_COLOR[r.k] + ';border-radius:4px;padding:2px 7px;align-self:center;">' + KIND_LABEL[r.k] + "</span></div>";
        }
        LIST.innerHTML = html;
        Array.prototype.forEach.call(LIST.querySelectorAll(".sr"), function (el) {
            el.addEventListener("click", function () { go(RESULTS[parseInt(el.getAttribute("data-i"), 10)]); });
            el.addEventListener("mousemove", function () {
                var i = parseInt(el.getAttribute("data-i"), 10);
                if (i !== SEL) { SEL = i; paint(); }
            });
        });
    }
    function paint() {
        Array.prototype.forEach.call(LIST.querySelectorAll(".sr"), function (el, i) {
            el.style.background = parseInt(el.getAttribute("data-i"), 10) === SEL ? "#f5ecd0" : "transparent";
        });
    }
    function move(d) {
        if (!RESULTS.length) return;
        SEL = (SEL + d + RESULTS.length) % RESULTS.length;
        paint();
        var el = LIST.querySelectorAll(".sr")[SEL];
        if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    }

    function go(r) {
        if (!r) return;
        close();
        if (r.h.charAt(0) === "#") {
            location.hash = r.h.substring(1);
            openFromHash();
        } else {
            location.href = r.h;
        }
    }

    function openFromHash() {
        var h = location.hash.substring(1);
        var m = h.match(/^us-([A-Z0-9.\-]+)$/i);
        if (m) {
            var d = document.querySelector('details[data-ticker="' + m[1].toLowerCase() + '"]');
            if (d) { d.open = true; d.scrollIntoView({ behavior: "smooth", block: "start" }); }
            return;
        }
        var b = h.match(/^book-(.+)$/);
        if (b) {
            var el = document.getElementById("book-" + b[1]);
            if (el) { el.open = true; el.scrollIntoView({ behavior: "smooth", block: "start" }); }
        }
    }

    function open() {
        ensureBox();
        BOX.style.display = "block";
        INPUT.value = ""; render([]);
        setTimeout(function () { INPUT.focus(); }, 0);
    }
    function close() { if (BOX) BOX.style.display = "none"; }

    document.addEventListener("keydown", function (ev) {
        if (ev.key === "/" && !ev.metaKey && !ev.ctrlKey) {
            var t = ev.target;
            var tag = t && t.tagName ? t.tagName.toLowerCase() : "";
            if (tag === "input" || tag === "textarea" || (t && t.isContentEditable)) return;
            ev.preventDefault(); open();
        } else if (ev.key === "Escape") { close(); }
    });

    // on-arrival: open the target the hash points at (runs on every page with this script)
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", openFromHash);
    } else { openFromHash(); }
    window.addEventListener("hashchange", openFromHash);
})();
