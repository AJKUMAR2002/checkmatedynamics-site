/* Checkmate Dynamics: site behaviour. Mobile nav, booking links, forms, enter motion (brand section 8). */
(function () {
  var cfg = window.CM_CONFIG || {};

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.textContent = open ? "Close" : "Menu";
      document.body.classList.toggle("nav-open", open);
    });
    // Accordion: each menu family opens from its own toggle on small screens.
    nav.querySelectorAll(".sub-toggle").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var item = btn.parentNode;
        var open = item.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  }

  // Callouts: flip each label to the side with room, or wrap it, so it stays inside its plate.
  // Below 700 px the labels become a numbered key under the figure (CSS shows it).
  var pinsDone = false;
  function layoutPins() {
    document.querySelectorAll(".plate").forEach(function (plate) {
      var pins = plate.querySelectorAll(".pin");
      if (!pins.length) return;
      var fig = plate.closest(".fig");
      if (!pinsDone && fig) {
        var ol = document.createElement("ol");
        ol.className = "pin-key";
        pins.forEach(function (pin, i) {
          pin.setAttribute("data-n", i + 1);
          var li = document.createElement("li");
          var b = document.createElement("b");
          b.textContent = i + 1;
          li.appendChild(b);
          var src = pin.firstElementChild;
          var em = src && src.firstElementChild ? src.firstElementChild : src;
          // clone the real nodes so unit-bearing numbers keep their Geist Mono spans
          var txt = document.createElement("span");
          Array.prototype.forEach.call(em ? em.childNodes : [], function (c) { txt.appendChild(c.cloneNode(true)); });
          li.appendChild(txt);
          ol.appendChild(li);
        });
        var cap = fig.querySelector("figcaption");
        fig.insertBefore(ol, cap);
      }
      var pw = plate.clientWidth;
      pins.forEach(function (pin) {
        if (pin.dataset.pref === undefined) pin.dataset.pref = pin.classList.contains("l") ? "l" : "r";
        pin.classList.remove("l", "cmp");
        pin.style.removeProperty("--w");
        if (window.innerWidth <= 700) return;
        var x = pin.offsetLeft, span = pin.firstElementChild;
        var need = span.getBoundingClientRect().width;
        var roomR = pw - x - 4 - 6, roomL = x - 4 - 6;
        var pref = pin.dataset.pref, other = pref === "l" ? "r" : "l";
        var room = function (side) { return side === "l" ? roomL : roomR; };
        var side = pref;
        if (need <= room(pref)) side = pref;
        else if (need <= room(other)) side = other;
        else {
          side = roomL > roomR ? "l" : "r";
          pin.classList.add("cmp");
          pin.style.setProperty("--w", Math.max(80, room(side)) + "px");
        }
        if (side === "l") pin.classList.add("l");
      });
    });
    pinsDone = true;
  }
  var pinTimer;
  function schedulePins() { clearTimeout(pinTimer); pinTimer = setTimeout(layoutPins, 80); }
  window.addEventListener("resize", schedulePins);
  window.addEventListener("load", layoutPins);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layoutPins);


  // Enter motion: 6 px rise, 480 ms, 40 ms stagger (max 8 steps); hairlines draw on.
  // Off entirely with prefers-reduced-motion. Without script or with IntersectionObserver
  // missing, everything stays in its finished state.
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    var sel = ".sec-head, .point, .stat, .plan, .door, .variant, .index-row:not(.head), .tile, .fig, .copy, .card-doc, .faq details, .ph-side, .ph .d1";
    var items = document.querySelectorAll(sel);
    var groups = new Map();
    items.forEach(function (el) {
      el.classList.add("rv");
      var n = groups.get(el.parentNode) || 0;
      el.style.setProperty("--i", Math.min(n, 7));
      groups.set(el.parentNode, n + 1);
    });
    document.documentElement.classList.add("js-rv");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.05 });
    items.forEach(function (el) { io.observe(el); });
  }

  // "Book a call" buttons go to the scheduling link once one is set.
  if (cfg.bookingUrl) {
    document.querySelectorAll("[data-booking]").forEach(function (a) {
      a.href = cfg.bookingUrl;
      a.target = "_blank";
      a.rel = "noopener";
    });
  }

  // Contact route: a mailto link only when the founder has set an address; otherwise the static "Contact details coming soon" stays.
  if (cfg.contactEmail) {
    document.querySelectorAll("[data-contact]").forEach(function (el) {
      var a = document.createElement("a");
      a.className = "link";
      a.href = "mailto:" + cfg.contactEmail;
      a.textContent = cfg.contactEmail;
      el.textContent = "";
      el.appendChild(a);
    });
  }
  // The calendar button only exists once there is a booking link.
  document.querySelectorAll("[data-booking-only]").forEach(function (el) { el.hidden = !cfg.bookingUrl; });

  // Forms: they stay hidden behind a "Registration opens soon" notice until an endpoint is configured.
  document.querySelectorAll("form[data-form]").forEach(function (form) {
    if (!cfg.formEndpoint) return;
    form.hidden = false;
    document.querySelectorAll("[data-reg]").forEach(function (n) { n.hidden = true; });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var note = form.querySelector(".form-note");
      var data = new FormData(form);
      data.append("form", form.getAttribute("data-form"));
      fetch(cfg.formEndpoint, { method: "POST", body: data, headers: { Accept: "application/json" } })
        .then(function (r) {
          if (!r.ok) throw new Error(r.status);
          form.reset();
          if (note) { note.textContent = "Thanks. We\u2019ll be in touch."; note.classList.add("show"); }
        })
        .catch(function () {
          if (note) { note.textContent = "That didn\u2019t go through. Please try again in a minute."; note.classList.add("show"); }
        });
    });
  });

  // Pre-select a product on the contact page from ?product=...
  var params = new URLSearchParams(location.search);
  var product = params.get("product");
  if (product) {
    document.querySelectorAll('input[name="interest"][value="' + product + '"]').forEach(function (c) { c.checked = true; });
  }
  var need = params.get("need");
  if (need) {
    document.querySelectorAll('select[name="need"]').forEach(function (s) {
      if (s.querySelector('option[value="' + need + '"]')) s.value = need;
    });
  }
})();
