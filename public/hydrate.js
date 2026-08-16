// moecap price hydration — zero dependencies, progressive enhancement.
// Fetches the prices payload, patches price/PE/cap spans in place, and adds a
// freshness line. If the fetch fails or a ticker is absent, the authored build
// numbers remain exactly as rendered: the page never breaks because of this.
//
// Sources are tried in order: same-origin /prices.json first (in case a Pages
// Function is added later), then the moecap-prices Worker URL (rewritten by
// scripts/setup-cloudflare.sh at deploy time).
(function () {
  "use strict";

  var SOURCES = ["/prices.json", "https://moecap-prices.iamkingori.workers.dev/prices"];

  function apply(payload) {
    var entries = (payload && payload.entries) || {};
    var keys = Object.keys(entries);
    if (keys.length === 0) return false;

    var patched = 0;
    document.querySelectorAll("details[data-ticker]").forEach(function (el) {
      var entry = entries[el.getAttribute("data-ticker").toUpperCase()];
      if (!entry) return;

      var price = el.querySelector('[data-field="price"]');
      var pe = el.querySelector('[data-field="pe"]');
      var cap = el.querySelector('[data-field="cap"]');
      if (price && entry.p) { price.textContent = entry.p; patched++; }
      if (pe && entry.pe) pe.textContent = entry.pe;
      if (cap && entry.cap) cap.textContent = entry.cap;

      if (entry.review) {
        var flag = document.createElement("span");
        flag.title = "Large price discontinuity detected — P/E and cap held at authored values pending review";
        flag.textContent = " ⚠";
        flag.style.color = "var(--accent)";
        if (price && price.parentNode) price.parentNode.appendChild(flag);
      }
    });
    if (patched === 0) return false;

    var asOf = payload.asOf ? new Date(payload.asOf) : null;
    var stamp = asOf
      ? asOf.toISOString().replace("T", " ").slice(0, 16) + " UTC"
      : "recent run";
    var line = document.createElement("p");
    line.textContent = "⟳ Prices auto-updated hourly from Binance/OKX/Bitget listings — last refresh: " + stamp;
    line.style.cssText = "font-size:0.75rem;color:var(--meta);margin:-1rem 0 1.5rem 0;";

    var first = document.getElementById("us-stocks-green") || document.getElementById("us-stocks");
    if (first) {
      var body = first.querySelector(".content-body") || first;
      body.insertBefore(line, body.firstChild);
    }
    return true;
  }

  function tryNext(i) {
    if (i >= SOURCES.length) return; // silent: authored numbers stand
    fetch(SOURCES[i], { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (payload) { if (!apply(payload)) tryNext(i + 1); })
      .catch(function () { tryNext(i + 1); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { tryNext(0); });
  } else {
    tryNext(0);
  }
})();

// 13F holders hydration — same pattern, quarterly data. Renders a
// "Major 13F Holders" block into each entry's holders slot (placed after
// section 1 by the build). All DOM is built via textContent/properties —
// filer names from EDGAR are never parsed as HTML.
(function () {
  "use strict";

  var SOURCES = ["/holders.json", "https://moecap-prices.iamkingori.workers.dev/holders"];

  function fmtUsd(v) {
    if (v >= 1e12) return "$" + (v / 1e12).toFixed(1) + "T";
    if (v >= 1e9) return "$" + (v / 1e9).toFixed(1) + "B";
    if (v >= 1e6) return "$" + (v / 1e6).toFixed(1) + "M";
    return "$" + Math.round(v).toLocaleString();
  }

  function apply(payload) {
    var entries = (payload && payload.entries) || {};
    var quarter = payload && payload.dataQuarter ? " — " + payload.dataQuarter : "";
    var rendered = 0;
    document.querySelectorAll('[data-field="holders"]').forEach(function (el) {
      var list = entries[el.getAttribute("data-ticker")];
      if (!list || !list.length) return; // stays invisible

      var h = document.createElement("h4");
      h.style.cssText =
        "color:var(--accent);font-size:1.05rem;font-weight:bold;margin-top:2rem;" +
        "margin-bottom:0.8rem;border-bottom:1px dashed var(--border);padding-bottom:0.3rem;";
      h.textContent = "🏛 Major 13F Holders" + quarter + " (SEC EDGAR)";

      var note = document.createElement("p");
      note.style.cssText = "font-size:0.75rem;color:var(--meta);margin:0 0 0.5rem 0;";
      note.textContent =
        "Funds with ≥$1B reported portfolios holding ≥3% in this stock. " +
        "13F data is quarterly and filed up to 45 days after quarter end.";

      var ul = document.createElement("ul");
      ul.style.cssText = "margin:0.5rem 0 1.2rem 0;padding-left:1.5rem;";
      list.forEach(function (x) {
        var li = document.createElement("li");
        li.style.cssText = "margin-bottom:0.3rem;";
        var a = document.createElement("a");
        a.href = x.url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = x.fund;
        li.appendChild(a);
        li.appendChild(
          document.createTextNode(
            " — " + x.weightPct + "% of portfolio (" + fmtUsd(x.valueUsd) + "), filed " + x.filed
          )
        );
        ul.appendChild(li);
      });

      el.textContent = "";
      el.appendChild(h);
      el.appendChild(note);
      el.appendChild(ul);
      rendered++;
    });
    return rendered > 0;
  }

  function tryNext(i) {
    if (i >= SOURCES.length) return; // silent: slots stay invisible
    fetch(SOURCES[i], { cache: "no-cache" })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (payload) { if (!apply(payload)) tryNext(i + 1); })
      .catch(function () { tryNext(i + 1); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { tryNext(0); });
  } else {
    tryNext(0);
  }
})();
