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

  /* ---- Shows: add (Supabase) -> on the site + notify Joe; the corner heron opens an add/remove panel ---- */
  (function () {
    /* === CONFIG: paste your Supabase values here (see SETUP-shows.md). Blank = fall back to events.json + text Joe. === */
    var SUPABASE_URL = "https://ofolxqldojhifnqmmsws.supabase.co";
    var SUPABASE_KEY = "sb_publishable_zRFhmQ8qwrJygM4P9WT8sA_dBxP14c0";
    var WEB3_KEY = "27123b13-8671-41c1-bab4-2f08aee37de1"; // notify on new submissions
    var NOTIFY_CC = "joeleduc@msn.com";                    // Joe gets a copy

    var listEl = document.getElementById("showsList");
    var emptyEl = document.getElementById("showsEmpty");
    if (!listEl) return;
    var ready = !!(SUPABASE_URL && SUPABASE_KEY);
    var REST = ready ? SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/shows" : null;
    var lastRows = [];

    function sb(qs, opts) {
      opts = opts || {}; var h = opts.headers || {};
      h.apikey = SUPABASE_KEY; h.Authorization = "Bearer " + SUPABASE_KEY;
      opts.headers = h; return fetch(REST + (qs || ""), opts);
    }
    function upcoming(rows) {
      var t = new Date(); t.setHours(0, 0, 0, 0);
      return (rows || []).filter(function (e) { return e && e.date && new Date(e.date + "T23:59:59") >= t; })
                         .sort(function (a, b) { return new Date(a.date) - new Date(b.date); });
    }
    function render(rows) {
      lastRows = rows || [];
      var events = upcoming(lastRows);
      if (!events.length) { listEl.hidden = true; listEl.innerHTML = ""; if (emptyEl) emptyEl.hidden = false; renderManage(); return; }
      listEl.innerHTML = events.map(function (e) {
        var dt = new Date(e.date + "T00:00:00");
        var mo = isNaN(dt) ? "" : dt.toLocaleString("en-US", { month: "short" }).toUpperCase();
        var day = isNaN(dt) ? "" : dt.getDate();
        var safe = e.ticketUrl && /^https?:\/\//i.test(e.ticketUrl) ? e.ticketUrl : "";
        var ticket = safe ? '<a class="show-ticket" href="' + esc(safe) + '" target="_blank" rel="noopener">Tickets</a>' : "";
        var meta = [e.venue, e.city, e.time].filter(Boolean).map(esc).join(" &middot; ");
        return '<div class="show-row"><div class="show-date">' + day + '<span>' + mo + '</span></div>'
          + '<div class="show-info"><h4>' + esc(e.description || e.title || "Live show") + "</h4>"
          + (meta ? "<p>" + meta + "</p>" : "") + "</div>" + ticket + "</div>";
      }).join("");
      listEl.hidden = false;
      if (emptyEl) emptyEl.hidden = true;
      renderManage();
    }
    function fileFallback() {
      fetch("events.json", { cache: "no-store" }).then(function (r) { return r.ok ? r.json() : { events: [] }; })
        .then(function (d) { render(d.events || []); }).catch(function () {});
    }
    function load() {
      if (!ready) { fileFallback(); return; }
      sb("?select=*").then(function (r) { return r.json(); }).then(function (rows) { render(rows || []); }).catch(fileFallback);
    }

    /* --- Modal: add form + (heron) manage/remove list --- */
    var modal = document.getElementById("showModal");
    var openBtn = document.getElementById("submitShowBtn");
    var heron = document.getElementById("editToggle");
    var closeBtn = document.getElementById("showModalClose");
    var form = document.getElementById("showForm");
    var note = document.getElementById("showFormNote");
    var titleEl = document.getElementById("showModalTitle");
    var manageWrap = document.getElementById("manageList");
    var manageItems = document.getElementById("manageItems");

    function renderManage() {
      if (!manageItems) return;
      var rows = upcoming(lastRows).filter(function (e) { return e.id != null; });
      if (!rows.length) { manageItems.innerHTML = '<p class="manage-empty">Nothing to remove yet.</p>'; return; }
      manageItems.innerHTML = rows.map(function (e) {
        var dt = new Date(e.date + "T00:00:00");
        var when = isNaN(dt) ? esc(e.date) : dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        return '<div class="manage-row"><span><strong>' + when + "</strong> &middot; " + esc(e.description || e.title || "Live show") + "</span>"
          + '<button type="button" class="show-del" data-id="' + esc(String(e.id)) + '" aria-label="Remove this show">&times;</button></div>';
      }).join("");
    }
    function openModal(manage) {
      if (!modal) return;
      if (manageWrap) manageWrap.hidden = !manage;
      if (titleEl) titleEl.textContent = manage ? "Manage shows" : "Add a show";
      if (manage) renderManage();
      modal.hidden = false; document.body.style.overflow = "hidden";
      var i = modal.querySelector("input,textarea"); if (i) i.focus();
    }
    function closeModal() { if (!modal) return; modal.hidden = true; document.body.style.overflow = ""; if (note) note.textContent = ""; }

    if (openBtn) openBtn.addEventListener("click", function () { openModal(false); });
    if (heron) heron.addEventListener("click", function () { window.location.href = "admin.html"; });
    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (modal) modal.addEventListener("click", function (e) { if (e.target.hasAttribute("data-close")) closeModal(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal && !modal.hidden) closeModal(); });

    function notifyJoe(row) {
      try {
        var fd = new FormData();
        fd.append("access_key", WEB3_KEY);
        fd.append("cc", NOTIFY_CC);
        fd.append("subject", "New show added to blueheronrecords.com");
        fd.append("from_name", "Blue Heron Records site");
        fd.append("name", "Website show submission");
        fd.append("email", "noreply@blueheronrecords.com");
        fd.append("message", "Someone just added a show to the site:\n\nDate: " + (row.date || "") + "\nTime: " + (row.time || "") + "\n" + (row.description || ""));
        fetch("https://api.web3forms.com/submit", { method: "POST", headers: { Accept: "application/json" }, body: fd });
      } catch (e) {}
    }
    // Real phone-to-phone SMS to Joe (works on Verizon — this is a normal text, not the dead email-gateway).
    // Opens the sender's Messages pre-filled to Joe's number; programmatic anchor click is the most reliable trigger.
    function textJoe(row) {
      var body = "New show added to Blue Heron Records:\nDate: " + (row.date || "") + "\nTime: " + (row.time || "") + "\n" + (row.description || "");
      var a = document.createElement("a");
      a.href = "sms:+16309260446?&body=" + encodeURIComponent(body);
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, 0);
    }
    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }
        var row = { date: form.date.value, time: (form.time.value || "").trim(), description: (form.description.value || "").trim() };
        if (!ready) { textJoe(row); return; } // no database yet -> just text Joe (old behavior)
        // Process 1: save to the site + email notify
        if (note) note.textContent = "Adding…";
        sb("", { method: "POST", headers: { "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify(row) })
          .then(function (r) { if (!r.ok) throw new Error("insert failed"); return r.json(); })
          .then(function () { notifyJoe(row); form.reset(); if (note) note.textContent = "Added! ✓ — sending Joe a text…"; load(); setTimeout(closeModal, 1600); })
          .catch(function () { if (note) note.innerHTML = "Couldn&rsquo;t add it &mdash; text the details to <a href='tel:+16309260446'>(630) 926-0446</a>."; });
        // Process 2: fire the real SMS to Joe (within the click gesture)
        textJoe(row);
      });
    }
    if (manageItems) {
      manageItems.addEventListener("click", function (e) {
        var b = e.target.closest ? e.target.closest(".show-del") : null;
        if (!b || !ready) return;
        if (!window.confirm("Remove this show from the site?")) return;
        b.disabled = true;
        sb("?id=eq." + encodeURIComponent(b.getAttribute("data-id")), { method: "DELETE", headers: { Prefer: "return=minimal" } })
          .then(function () { load(); }).catch(function () { b.disabled = false; });
      });
    }

    load();
  })();

  /* ---- Blog / Posts (data source: posts.json) ---- */
  var postsGrid = document.getElementById("postsGrid");
  var postsNote = document.getElementById("postsNote");
  if (postsGrid) {
    fetch("posts.json", { cache: "no-store" })
      .then(function (r) { return r.ok ? r.json() : { posts: [] }; })
      .then(function (data) {
        var posts = (data.posts || []).slice();
        if (!posts.length) return; // keep the static fallback cards
        posts.sort(function (a, b) { return (b.date ? new Date(b.date) : 0) - (a.date ? new Date(a.date) : 0); });
        postsGrid.innerHTML = posts.map(function (p) {
          var u = p.url;
          var okUrl = u && (/^https:\/\//i.test(u) || !/:/.test(u)); // same-site relative or https only
          var open = okUrl ? '<a class="post-card" href="' + esc(u) + '">' : '<article class="post-card">';
          var close = okUrl ? "</a>" : "</article>";
          var tag = p.tag ? '<span class="post-tag">' + esc(p.tag) + "</span>" : "";
          var date = p.date ? '<span class="post-date">' + esc(new Date(p.date + "T00:00:00").toLocaleDateString("en-US", { month: "long", year: "numeric" })) + "</span>" : "";
          var more = okUrl ? '<span class="post-more">' + esc(p.linkText || "Read more") + " &rarr;</span>" : "";
          return open + tag + '<h3>' + esc(p.title || "") + "</h3>" + date + "<p>" + esc(p.body || "") + "</p>" + more + close;
        }).join("");
        if (postsNote) postsNote.hidden = true;
      })
      .catch(function () {});
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

      function mailtoFallback(prefix) {
        if (formStatus) {
          formStatus.hidden = false;
          formStatus.innerHTML = (prefix ? prefix + " " : "") +
            'Write to <a href="' + esc(mail) + '">' + BUSINESS_EMAIL + "</a> or call " +
            '<a href="tel:+16309260446">(630) 926-0446</a>.';
        }
        window.location.href = mail;
      }

      var keyEl = form.querySelector('input[name="access_key"]');
      var key = keyEl ? keyEl.value : "";
      if (!key || key.indexOf("YOUR_") === 0) { mailtoFallback(""); return; } // backend key not set yet

      d.set("subject", subject);
      if (formStatus) { formStatus.hidden = false; formStatus.textContent = "Sending…"; }
      fetch("https://api.web3forms.com/submit", { method: "POST", headers: { Accept: "application/json" }, body: d })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (!j || !j.success) throw new Error("send failed");
          form.reset();
          if (formStatus) formStatus.innerHTML = "<strong>Thanks &mdash; your message is on its way!</strong> We&rsquo;ll be in touch soon.";
        })
        .catch(function () { mailtoFallback("<strong>Couldn&rsquo;t send automatically.</strong>"); });
    });
  }

  /* ---- Newsletter (Buttondown) ---- */
  var nlForm = document.getElementById("newsletterForm");
  var nlMsg = document.getElementById("newsletterMsg");
  if (nlForm) {
    nlForm.addEventListener("submit", function () {
      // Native POST goes to the hidden iframe; show an optimistic confirmation.
      if (nlMsg) { nlMsg.hidden = false; nlMsg.textContent = "Thanks for subscribing! Check your inbox to confirm."; }
      setTimeout(function () { try { nlForm.reset(); } catch (e) {} }, 400);
    });
  }

  /* ---- Artists & bands roster (homepage), data-driven from Supabase ---- */
  (function () {
    var SB = "https://ofolxqldojhifnqmmsws.supabase.co";
    var KEY = "sb_publishable_zRFhmQ8qwrJygM4P9WT8sA_dBxP14c0";
    var ag = document.getElementById("artistGrid");
    var bg = document.getElementById("bandGrid");
    if (!ag && !bg) return;
    function e2(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
    function card(a) {
      var slug = encodeURIComponent(a.slug || "");
      var ok = a.photo && (/^https?:\/\//i.test(a.photo) || !/:/.test(a.photo));
      var photo = ok ? '<span class="artist-photo"><img src="' + e2(a.photo) + '" alt="' + e2(a.name) + '" loading="lazy" /></span>'
                     : '<span class="artist-photo placeholder"><img src="images/heron-mark.png" alt="' + e2(a.name) + '" loading="lazy" /></span>';
      var role = a.role ? '<p class="artist-role">' + e2(a.role) + "</p>" : "";
      var tag = a.tagline ? "<p>" + e2(a.tagline) + "</p>" : "";
      return '<a class="artist-card" href="artist.html?a=' + slug + '">' + photo +
        '<span class="artist-body"><h3>' + e2(a.name) + "</h3>" + role + tag + '<span class="artist-link">View page &rarr;</span></span></a>';
    }
    fetch(SB + "/rest/v1/artists?select=*&order=sort.asc,name.asc", { headers: { apikey: KEY, Authorization: "Bearer " + KEY } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (rows) {
        if (!rows || !rows.length) return;
        var pub = rows.filter(function (a) { return a.published !== false; });
        var sortv = function (a) { return a.sort == null ? 100 : a.sort; };
        var arts = pub.filter(function (a) { return sortv(a) < 100; });
        var bands = pub.filter(function (a) { return sortv(a) >= 100; });
        if (ag && arts.length) ag.innerHTML = arts.map(card).join("");
        if (bg && bands.length) bg.innerHTML = bands.map(card).join("");
      })
      .catch(function () {});
  })();
})();
