/* =========================================================================
   CashAuto — odeslání žádosti z formuláře (zadost.html)
   Po úspěšné kontrole kontaktu volá app.js funkci AK.submitApplication(button, pokračuj).
   Žádost se uloží přes AKbackend: v ostrém režimu do databáze (fáze „Nový lead“),
   v ukázkovém režimu jen do tohoto prohlížeče.
   ========================================================================= */
(function () {
  "use strict";
  var AK = window.AK = window.AK || {}, B = window.AKbackend;
  if (!B) return;
  var t0 = Date.now(), sent = false;
  var val = function (id) { var e = document.getElementById(id); return e ? String(e.value || "").trim() : ""; };
  var LINE = { agro: "agro", tech: "tech" };
  function payload() {
    var o = AK.lastOffer || {}, seg = document.getElementById("w_segment");
    var typ = new URLSearchParams(location.search).get("typ"), line = LINE[typ] || "auto";
    var label = seg && seg.selectedOptions && seg.selectedOptions[0] ? seg.selectedOptions[0].textContent.trim() : "";
    var name = val("c_name").slice(0, 120);
    return {
      line: line, name: name, contact: name, ico: val("c_ico").replace(/\D/g, "").slice(0, 8), phone: val("c_phone").slice(0, 30), email: val("c_email").toLowerCase().slice(0, 160),
      car: (label || (line === "agro" ? "Stroj" : "Vozidlo")).slice(0, 80), year: Number(o.year) || "", km: Number(o.mileage) || "",
      market: Number(o.marketValue) || 0, vykup: Number(o.vykup) || 0, fee: Number(o.fee) || 0, term: Number(o.months) || 3,
      segment: "žádost", channel: "Web — žádost", risk: "low", purpose: val("c_purpose").slice(0, 40), condition: String(o.condition || "").slice(0, 20),
      created: new Date().toISOString()
    };
  }
  AK.submitApplication = function (btn, proceed) {
    var step = btn.closest(".wizard-step"), base = step && step.querySelector(".wizard-error"), err = document.getElementById("applyError");
    if (!err && base) { err = document.createElement("div"); err.id = "applyError"; err.className = "wizard-error hide"; err.setAttribute("role", "alert"); base.parentNode.insertBefore(err, base.nextSibling); }
    if (err) err.classList.add("hide");
    var trap = document.getElementById("c_web");                       // past na roboty: skryté pole musí zůstat prázdné
    if ((trap && trap.value) || Date.now() - t0 < 2500) { proceed(); return; }
    if (sent) { proceed(); return; }                                   // žádost už odešla, podruhé se neposílá
    var c = payload();
    if (!c.vykup) { if (err) { err.textContent = "Nabídku se nepodařilo spočítat. Vraťte se prosím o krok zpět a zkuste to znovu."; err.classList.remove("hide"); } return; }
    var label = btn.textContent; btn.disabled = true; btn.textContent = "Odesílám…";
    B.submitApplication(c).then(function () {
      sent = true; btn.disabled = false; btn.textContent = label;
      AK.toast(B.live ? btn.getAttribute("data-submit-toast") : "Ukázkový režim: žádost je uložená jen v tomto prohlížeči.");
      var note = document.getElementById("applyDemoNote"); if (note) note.hidden = B.live;
      proceed();
    }, function (e) {
      btn.disabled = false; btn.textContent = label;
      if (err) { err.textContent = (e && e.message ? e.message : "Žádost se nepodařilo odeslat.") + " Můžete nám také zavolat."; err.classList.remove("hide"); err.focus && err.focus(); }
    });
  };
})();
