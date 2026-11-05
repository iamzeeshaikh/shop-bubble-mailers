/* Checkout: order lines from localStorage (plus ?add=&qty= from the order box), live totals, and a JSON
   POST to /api/order/ with base64 artwork. The server re-prices every line; the totals here are a preview.
   Configuration comes from the #checkout-config JSON block; ids and data attributes are shared with qa. */
(function () {
  "use strict";
  var cfgEl = document.getElementById("checkout-config"), form = document.getElementById("checkout-form");
  if (!cfgEl || !form) return;
  var C = JSON.parse(cfgEl.textContent), KEY = C.key || "cart", LOADED = Date.now();
  var $ = function (s, r) { return (r || form).querySelector(s); }, $$ = function (s, r) { return [].slice.call((r || form).querySelectorAll(s)); };
  var linesEl = $("[data-lines]"), grandEl = $("[data-grand]"), countEl = $("[data-order-count]"), statusEl = $("[data-status]"), button = $("[data-place]");
  var unit = Number(C.unit) || 0, prices = C.prices || {}, pack = Number(C.pack) || 100, max = Number(C.max) || 5000, sym = C.currency === "GBP" ? "£" : "$", u = C.unitName || "unit", us = C.unitsName || u + "s";
  var plural = function (k) { return k === 1 ? u : us; };
  var money = function (k) { return sym + k.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var snap = function (k) { k = Math.round(Number(k)); if (!isFinite(k) || k <= 0) return 0; return Math.min(max, Math.max(pack, Math.round(k / pack) * pack)); };

  var cart = [];
  try { cart = JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { cart = []; }
  if (!Array.isArray(cart)) cart = [];
  var params = new URLSearchParams(location.search), add = params.get("add");
  if (add && C.catalog[add]) {
    var qty = snap(params.get("qty")) || pack, hit = cart.filter(function (l) { return l && l.slug === add; })[0];
    if (hit) hit.qty = qty; else cart.push({ slug: add, qty: qty });
    try { history.replaceState(null, "", location.pathname); } catch (e) { /* ignore */ }
  }
  cart = cart.filter(function (l) { return l && C.catalog[l.slug]; }).map(function (l) { return { slug: l.slug, qty: snap(l.qty) || pack }; });
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ } };
  save();

  function options(sel) { var o = ""; for (var k = pack; k <= max; k += pack) o += '<option value="' + k + '"' + (k === sel ? " selected" : "") + ">" + k.toLocaleString("en-US") + " " + plural(k) + "</option>"; return o; }
  function render() {
    if (!cart.length) { linesEl.innerHTML = '<tr><td colspan="2" data-empty>Your order is empty. <a href="' + (C.allUrl || "/") + '">Choose a product</a> to add it here.</td></tr>'; grandEl.textContent = money(0); if (countEl) countEl.textContent = "0 " + us; button.disabled = true; return; }
    var total = 0, units = 0;
    linesEl.innerHTML = cart.map(function (l, i) {
      var name = C.catalog[l.slug], lu = prices[l.slug] != null ? Number(prices[l.slug]) : unit, sum = Math.round(l.qty * lu * 100) / 100; total += sum; units += l.qty;
      return "<tr><td><a href=\"/" + esc(l.slug) + "/\">" + esc(name) + "</a><span data-unit>" + money(lu) + " per " + u + '</span><span data-ctl><select data-i="' + i + '" aria-label="Quantity for ' + esc(name) + '">' + options(l.qty) + '</select><button type="button" data-rm="' + i + '" aria-label="Remove ' + esc(name) + '">Remove</button></span></td><td data-sum>' + money(sum) + "</td></tr>";
    }).join("");
    grandEl.textContent = money(total); if (countEl) countEl.textContent = units.toLocaleString("en-US") + " " + plural(units); button.disabled = false;
  }
  linesEl.addEventListener("change", function (e) { var i = e.target.getAttribute("data-i"); if (i === null) return; cart[+i].qty = snap(e.target.value) || pack; save(); render(); });
  linesEl.addEventListener("click", function (e) { var t = e.target.closest("[data-rm]"); if (!t) return; cart.splice(+t.getAttribute("data-rm"), 1); save(); render(); });
  render();

  /* Cash on delivery only where it is offered (never on UK sites: the option is simply absent). */
  var countryEl = $("#co-country"), codIn = $('input[name="payment"][value="cod"]');
  function codRule() {
    if (!countryEl || !codIn) return;
    var ok = (C.cod || []).indexOf(countryEl.value) >= 0, box = codIn.closest("label");
    codIn.disabled = !ok; if (box) { if (ok) box.removeAttribute("data-off"); else box.setAttribute("data-off", ""); }
    if (!ok && codIn.checked) { var pp = $('input[name="payment"][value="paypal"]'); if (pp) pp.checked = true; }
  }
  if (countryEl) { countryEl.addEventListener("change", codRule); codRule(); }

  function status(state, text) { if (!statusEl) return; if (!state) { statusEl.removeAttribute("data-state"); statusEl.textContent = ""; return; } statusEl.setAttribute("data-state", state); statusEl.textContent = text; }
  function labelFor(f) { var l = f.id && form.querySelector('label[for="' + f.id + '"]'); if (!l) { l = f.closest("label"); l = l && l.querySelector("span"); } return l ? l.textContent.trim() : "This field"; }
  function errFor(f) { var w = f.closest("[data-field]") || f.closest("label"); return w && w.querySelector("[data-err]"); }
  form.addEventListener("input", function (e) { var f = e.target; if (f.getAttribute && f.getAttribute("aria-invalid") === "true") { f.setAttribute("aria-invalid", "false"); var er = errFor(f); if (er) { er.hidden = true; er.textContent = ""; } } });
  function files(inp) {
    var list = inp && inp.files ? [].slice.call(inp.files, 0, 5) : [];
    return Promise.all(list.map(function (f) { return new Promise(function (ok) { if (f.size > 3.5e6) return ok(null); var r = new FileReader(); r.onload = function () { ok({ name: f.name, type: f.type || "application/octet-stream", data: String(r.result).split(",")[1] }); }; r.onerror = function () { ok(null); }; r.readAsDataURL(f); }); })).then(function (a) { return a.filter(Boolean); });
  }
  var up = $("input[type=file]");
  if (up) up.addEventListener("change", function () { var s = $("[data-upname]"); if (s) s.textContent = [].map.call(up.files, function (f) { return f.name + (f.size > 3.5e6 ? " (over 3 MB)" : ""); }).join(", ") || s.getAttribute("data-upname"); });

  form.addEventListener("submit", function (e) {
    e.preventDefault(); status(null);
    if (!cart.length) { status("error", "Your order is empty. Choose a product first."); return; }
    var bad = [];
    $$("[required]").forEach(function (f) {
      var v = String(f.value || "").trim(), ok = v && (f.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v));
      var er = errFor(f);
      if (!ok) { f.setAttribute("aria-invalid", "true"); if (er) { er.textContent = f.type === "email" && v ? "Enter an email address in the format name@example.com." : "Enter your " + labelFor(f).toLowerCase() + "."; er.hidden = false; } bad.push(f); }
      else { f.setAttribute("aria-invalid", "false"); if (er) { er.hidden = true; er.textContent = ""; } }
    });
    if (bad.length) { status("error", "Please fill in the highlighted fields."); bad[0].focus(); return; }
    var d = { page: location.pathname, submitted_at: String(LOADED), items: cart };
    new FormData(form).forEach(function (v, k) { if (typeof v === "string") d[k] = v; });
    var total = cart.reduce(function (s, l) { return s + l.qty * (prices[l.slug] != null ? Number(prices[l.slug]) : unit); }, 0);
    var was = button.textContent; button.disabled = true; button.setAttribute("aria-disabled", "true"); button.setAttribute("aria-busy", "true"); button.textContent = "Placing your order…"; form.setAttribute("aria-busy", "true"); status("sending", "Placing your order…");
    if (window.gtag) gtag("event", "begin_checkout", { currency: C.currency || "USD", value: Math.round(total * 100) / 100 });
    files(up).then(function (list) { d.files = list; return fetch("/api/order/", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(d) }); })
      .then(function (r) { return r.json().catch(function () { return { ok: false, error: "We could not place the order just now" }; }); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || "We could not place the order just now");
        if (window.gtag) gtag("event", "purchase", { transaction_id: res.ref, currency: C.currency || "USD", value: res.total });
        try { localStorage.removeItem(KEY); } catch (err) { /* ignore */ }
        location.assign((C.confirmUrl || "/order-confirmed/") + "?ref=" + encodeURIComponent(res.ref) + "&pay=" + encodeURIComponent(res.payment));
      })
      .catch(function (err) { status("error", (err.message || "We could not place the order just now") + ". Please try again, or call " + C.phone + "."); button.disabled = false; button.removeAttribute("aria-disabled"); button.removeAttribute("aria-busy"); button.textContent = was; form.removeAttribute("aria-busy"); });
  });
})();
