/* Client portal reminder preview. Local preferences only; no delivery service. */
(function (root, factory) {
  "use strict";
  var reminders = factory();
  if (typeof module === "object" && module.exports) module.exports = reminders;
  if (root && root.document) {
    if (root.document.readyState === "loading") {
      root.document.addEventListener("DOMContentLoaded", function () { reminders.mount(root); });
    } else reminders.mount(root);
  }
})(typeof window === "undefined" ? null : window, function () {
  "use strict";
  var channels = { off: "Vypnuto", email: "E-mail", sms: "SMS", push: "Push" };
  var allowedDays = [1, 3, 7, 14];

  function normalizeSettings(value) {
    value = value && typeof value === "object" ? value : {};
    return {
      feeChannel: Object.prototype.hasOwnProperty.call(channels, value.feeChannel) ? value.feeChannel : "off",
      feeDays: allowedDays.indexOf(Number(value.feeDays)) >= 0 ? Number(value.feeDays) : 3,
      buybackChannel: Object.prototype.hasOwnProperty.call(channels, value.buybackChannel) ? value.buybackChannel : "off",
      buybackDays: allowedDays.indexOf(Number(value.buybackDays)) >= 0 ? Number(value.buybackDays) : 7
    };
  }

  // UTC arithmetic keeps calendar-day offsets stable over daylight-saving changes.
  function parseDate(value) {
    var match = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})$/.exec(String(value || ""));
    if (!match) return null;
    var day = Number(match[1]), month = Number(match[2]) - 1, year = Number(match[3]);
    var date = new Date(Date.UTC(year, month, day));
    return date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day ? date : null;
  }

  function dateBefore(date, days) {
    return new Date(date.getTime() - days * 86400000);
  }

  function formatDate(date) {
    return date ? new Intl.DateTimeFormat("cs-CZ", { timeZone: "UTC" }).format(date) : "Termín není uveden";
  }

  function money(amount) {
    return typeof amount === "number" && isFinite(amount) ? new Intl.NumberFormat("cs-CZ").format(amount) + " Kč" : "částka není uvedena";
  }

  function buildPreview(data, value) {
    var settings = normalizeSettings(value);
    var activeCase = data.activeCase || {};
    var due = parseDate(activeCase.nextPaymentDate);
    return [
      {
        title: "Splatnost rezervačního poplatku",
        channel: settings.feeChannel,
        date: due && settings.feeChannel !== "off" ? dateBefore(due, settings.feeDays) : null,
        text: "Rezervační poplatek " + money(activeCase.fee) + ". Splatnost: " + formatDate(due) + ".",
        available: !!due
      },
      {
        title: "Připomenutí možnosti zpětného odkupu",
        channel: settings.buybackChannel,
        date: due && activeCase.earlyBuybackAvailable === true && settings.buybackChannel !== "off" ? dateBefore(due, settings.buybackDays) : null,
        text: activeCase.earlyBuybackAvailable === true
          ? "Vůz můžete odkoupit kdykoliv za " + money(activeCase.buyback) + ". Připomenutí před platbou " + formatDate(due) + "; odkup je dobrovolný."
          : "Možnost předčasného odkupu není v datech potvrzena. Termín nelze určit.",
        available: !!due && activeCase.earlyBuybackAvailable === true
      }
    ];
  }

  function mount(win) {
    var doc = win.document;
    var form = doc.getElementById("reminderForm");
    if (!form) return;
    var data = win.AK || {};
    var activeCase = data.activeCase || {};
    var storageKey = "cashauto.reminders.v1." + String(activeCase.id || "demo");
    var status = doc.getElementById("reminderSaveStatus");
    var preview = doc.getElementById("reminderPreview");
    var controls = {
      feeChannel: doc.getElementById("feeReminderChannel"), feeDays: doc.getElementById("feeReminderDays"),
      buybackChannel: doc.getElementById("buybackReminderChannel"), buybackDays: doc.getElementById("buybackReminderDays")
    };
    var settings = normalizeSettings();
    try {
      var saved = win.localStorage.getItem(storageKey);
      if (saved) {
        settings = normalizeSettings(JSON.parse(saved));
        status.textContent = "Načteno nastavení z tohoto prohlížeče. Demo nic neodesílá.";
      }
    } catch (error) {
      status.textContent = "Uložené nastavení nelze načíst. Náhled můžete používat bez uložení.";
    }

    function readForm() {
      var value = {};
      Object.keys(controls).forEach(function (key) { value[key] = controls[key].value; });
      return normalizeSettings(value);
    }

    function fillForm(value) {
      Object.keys(controls).forEach(function (key) { controls[key].value = String(value[key]); });
    }

    function render() {
      var value = readForm();
      controls.feeDays.disabled = value.feeChannel === "off";
      controls.buybackDays.disabled = value.buybackChannel === "off";
      preview.replaceChildren();
      buildPreview(data, value).forEach(function (reminder) {
        var card = doc.createElement("div");
        card.className = "card pad tint";
        var heading = doc.createElement("h4");
        heading.textContent = reminder.title;
        var schedule = doc.createElement("p");
        schedule.className = "mt-3";
        schedule.textContent = reminder.channel === "off" ? "Vypnuto — vyberte kanál pro náhled."
          : reminder.available ? "Ukázka: " + formatDate(reminder.date) + " · " + channels[reminder.channel]
          : "Chybí potvrzený termín v datech — připomenutí nelze naplánovat.";
        var message = doc.createElement("p");
        message.className = "muted mb-0";
        message.textContent = reminder.text;
        card.append(heading, schedule, message);
        preview.appendChild(card);
      });
    }

    var due = parseDate(activeCase.nextPaymentDate);
    var now = new Date();
    var today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    doc.getElementById("reminderDataNote").textContent = due
      ? "Náhled vychází z ukázkové splatnosti " + formatDate(due) + ". " + (due.getTime() < today ? "Tento termín je již v minulosti; nejde o aktuální výzvu k platbě. " : "") + "Datum konce smlouvy není v demo datech uvedeno."
      : "V demo datech chybí platné datum splatnosti. Termíny upozornění nelze určit.";
    doc.getElementById("reminderOverview").textContent = "Ukázkový poplatek: " + money(activeCase.fee) + " · splatnost " + formatDate(due) + ". Nastavte si náhled připomenutí; demo nic neodesílá.";
    fillForm(settings);
    render();
    form.addEventListener("change", function () {
      render();
      status.textContent = "Náhled byl upraven. Změny zatím nejsou uložené; demo nic neodesílá.";
    });
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      try {
        win.localStorage.setItem(storageKey, JSON.stringify(readForm()));
        status.textContent = "Nastavení uloženo pouze v tomto prohlížeči. E-mail, SMS ani push se neodesílají.";
      } catch (error) {
        status.textContent = "Prohlížeč nepovolil uložení. Náhled funguje, ale nastavení se po obnovení stránky neuchová.";
      }
    });
    doc.getElementById("clearReminders").addEventListener("click", function () {
      try {
        win.localStorage.removeItem(storageKey);
        fillForm(normalizeSettings());
        render();
        status.textContent = "Uložené nastavení bylo smazáno. Obě připomenutí jsou vypnutá.";
      } catch (error) {
        status.textContent = "Prohlížeč nepovolil smazání uloženého nastavení. Nic se nezměnilo.";
      }
    });
    doc.getElementById("openReminders").addEventListener("click", function () {
      var paymentsLink = doc.querySelector('.side-link[data-target="platby"]');
      if (paymentsLink) paymentsLink.click();
      doc.getElementById("remindersTitle").focus();
    });
  }

  return { normalizeSettings: normalizeSettings, parseDate: parseDate, dateBefore: dateBefore, buildPreview: buildPreview, mount: mount };
});
