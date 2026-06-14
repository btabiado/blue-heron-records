/* ============================================================
   Blue Heron Records — interactions
   ============================================================ */
(function () {
  "use strict";

  var BUSINESS_EMAIL = "joeleduc@msn.com";
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Respect reduced-motion for autoplay video (show poster instead) ---- */
  if (reduceMotion) {
    document.querySelectorAll("video[autoplay]").forEach(function (v) {
      v.removeAttribute("autoplay");
      try { v.pause(); } catch (e) {}
    });
  }

  /* ---- Year in footer ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---- Sticky header state ---- */
  var header = document.getElementById("header");
  function onScroll() {
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- Mobile nav (focus management, Escape, trap, outside-click, resize) ---- */
  var navToggle = document.getElementById("navToggle");
  var nav = document.getElementById("nav");
  function navIsOpen() { return nav && nav.classList.contains("open"); }
  function openNav() {
    nav.classList.add("open");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close menu");
    var first = nav.querySelector("a");
    if (first) first.focus();
  }
  function closeNav(returnFocus) {
    nav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
    if (returnFocus && navToggle) navToggle.focus();
  }
  if (navToggle && nav) {
    navToggle.addEventListener("click", function () {
      if (navIsOpen()) closeNav(true); else openNav();
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { closeNav(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (!navIsOpen()) return;
      if (e.key === "Escape") { closeNav(true); return; }
      if (e.key === "Tab") {
        var links = Array.prototype.slice.call(nav.querySelectorAll("a"));
        if (!links.length) return;
        var i = links.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); links[links.length - 1].focus(); }
        else if (!e.shiftKey && i === links.length - 1) { e.preventDefault(); links[0].focus(); }
      }
    });
    document.addEventListener("click", function (e) {
      if (navIsOpen() && !nav.contains(e.target) && e.target !== navToggle && !navToggle.contains(e.target)) {
        closeNav(false);
      }
    });
    if (window.matchMedia) {
      var mqDesktop = window.matchMedia("(min-width: 881px)");
      var onMq = function (ev) { if (ev.matches) closeNav(false); };
      if (mqDesktop.addEventListener) mqDesktop.addEventListener("change", onMq);
      else if (mqDesktop.addListener) mqDesktop.addListener(onMq);
    }
  }

  /* ---- Scroll reveal ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in-view"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + "ms";
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---- Lightbox (studio tour photos) ---- */
  var shots = Array.prototype.slice.call(document.querySelectorAll(".shot"));
  var lb = document.getElementById("lightbox");
  var lbImg = document.getElementById("lbImg");
  var lbClose = document.getElementById("lbClose");
  var lbPrev = document.getElementById("lbPrev");
  var lbNext = document.getElementById("lbNext");
  var current = 0;
  var lastFocus = null;

  function srcFor(shot) { return shot.getAttribute("data-full") || (shot.querySelector("img") && shot.querySelector("img").src); }
  function altFor(shot) { var img = shot.querySelector("img"); return img ? img.alt : ""; }
  function show(i) {
    current = (i + shots.length) % shots.length;
    lbImg.src = srcFor(shots[current]);
    lbImg.alt = altFor(shots[current]);
  }
  function openLb(i) {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lbClose.focus();
  }
  function closeLb() {
    lb.hidden = true;
    lbImg.src = "";
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  shots.forEach(function (shot, i) { shot.addEventListener("click", function () { openLb(i); }); });
  if (lb) {
    lbClose.addEventListener("click", closeLb);
    lbPrev.addEventListener("click", function () { show(current - 1); });
    lbNext.addEventListener("click", function () { show(current + 1); });
    lb.addEventListener("click", function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener("keydown", function (e) {
      if (lb.hidden) return;
      if (e.key === "Escape") { closeLb(); return; }
      if (e.key === "ArrowLeft") { show(current - 1); return; }
      if (e.key === "ArrowRight") { show(current + 1); return; }
      if (e.key === "Tab") {
        var f = [lbClose, lbPrev, lbNext];
        var i = f.indexOf(document.activeElement);
        if (i === -1) { e.preventDefault(); f[0].focus(); }
        else if (e.shiftKey && i === 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    });
  }

  /* ---- Contact form -> pre-filled email ---- */
  var form = document.getElementById("contactForm");
  var formStatus = document.getElementById("formStatus");
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var d = new FormData(form);
      var subject = "Blue Heron Records inquiry — " + (d.get("topic") || "General");
      var lines = [
        "Hi Joe,",
        "",
        (d.get("message") || ""),
        "",
        "— " + (d.get("name") || ""),
        "Email: " + (d.get("email") || ""),
        (d.get("phone") ? "Phone: " + d.get("phone") : ""),
        "Interested in: " + (d.get("topic") || "")
      ].filter(function (l) { return l !== false; });
      var body = encodeURIComponent(lines.join("\n"));
      var mail = "mailto:" + BUSINESS_EMAIL + "?subject=" + encodeURIComponent(subject) + "&body=" + body;

      if (formStatus) {
        formStatus.hidden = false;
        formStatus.innerHTML = "Opening your email app with your message ready to send…";
      }
      window.location.href = mail;

      setTimeout(function () {
        if (formStatus) {
          formStatus.innerHTML =
            "<strong>Almost there.</strong> If your email app didn’t open, write to " +
            '<a href="' + esc(mail) + '">' + BUSINESS_EMAIL + "</a> or call " +
            '<a href="tel:+16309260446">(630) 926-0446</a>.';
        }
      }, 1400);
    });
  }
})();
