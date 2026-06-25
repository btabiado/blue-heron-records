/* artist.js — Blue Heron Records artist profile page
   Vanilla JS, IIFE-wrapped, no external dependencies.
   Reads ?a=<slug> from the URL, fetches from Supabase, renders the page.
*/
(function () {
  'use strict';

  /* ── Config ────────────────────────────────────────────────── */
  var SUPA_URL = 'https://ofolxqldojhifnqmmsws.supabase.co';
  var SUPA_KEY = 'sb_publishable_zRFhmQ8qwrJygM4P9WT8sA_dBxP14c0';

  var VALID_THEMES = ['navy', 'whiskey', 'vintage', 'forest', 'rose', 'mono'];

  var LINK_LABELS = {
    spotify:   'Spotify',
    apple:     'Apple Music',
    youtube:   'YouTube',
    instagram: 'Instagram',
    facebook:  'Facebook',
    website:   'Website',
  };

  /* SVG icons as data URIs — inline-safe, no external fetch needed */
  var LINK_ICONS = {
    spotify: '<svg class="chip-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.623.623 0 01-.857.208c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 01-.277-1.215c3.809-.87 7.076-.496 9.71 1.115a.623.623 0 01.209.856zm1.223-2.722a.78.78 0 01-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.78.78 0 01-.45-1.492c3.632-1.102 8.147-.568 11.23 1.329a.78.78 0 01.257 1.072zm.105-2.835C14.692 8.95 9.375 8.775 6.297 9.71a.937.937 0 11-.543-1.793c3.543-1.073 9.433-.865 13.157 1.368a.937.937 0 01-.997 1.582z"/></svg>',
    apple:    '<svg class="chip-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>',
    youtube:  '<svg class="chip-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    instagram:'<svg class="chip-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
    facebook: '<svg class="chip-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
    website:  '<svg class="chip-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
  };

  /* ── Helpers ───────────────────────────────────────────────── */

  /** Escape HTML special chars to prevent XSS */
  function esc(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Returns true only for http/https URLs */
  function isHttpUrl(str) {
    if (typeof str !== 'string') return false;
    return /^https?:\/\//i.test(str);
  }

  /**
   * Validate a photo value: allow http(s) URLs OR relative paths
   * (e.g. "images/foo.jpg") but reject anything with a scheme that
   * isn't http/https (data:, javascript:, etc.).
   */
  function isSafePhotoSrc(str) {
    if (typeof str !== 'string' || str.trim() === '') return false;
    // If it contains a colon before the first slash (or has no slash), it's a scheme — only allow http(s)
    var colonIdx = str.indexOf(':');
    var slashIdx = str.indexOf('/');
    if (colonIdx !== -1 && (slashIdx === -1 || colonIdx < slashIdx)) {
      return isHttpUrl(str);
    }
    // Relative path: disallow traversal attempts and null bytes
    return !/\0/.test(str) && !/^\/\//.test(str);
  }

  /** Get ?a= param from current URL */
  function getSlug() {
    try {
      var params = new URLSearchParams(window.location.search);
      var slug = (params.get('a') || '').trim();
      // Allow only safe slug chars: letters, digits, hyphens, underscores
      return /^[a-zA-Z0-9_-]{1,120}$/.test(slug) ? slug : '';
    } catch (e) {
      return '';
    }
  }

  /** Supabase REST fetch helper */
  function supa(path) {
    return fetch(SUPA_URL + path, {
      headers: {
        'apikey': SUPA_KEY,
        'Authorization': 'Bearer ' + SUPA_KEY,
        'Accept': 'application/json',
      },
    }).then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    });
  }

  /* ── DOM helpers ───────────────────────────────────────────── */

  function show(el) { el.classList.add('visible'); }
  function hide(el) { el.classList.remove('visible'); el.style.display = ''; }

  function getEl(id) { return document.getElementById(id); }

  /* ── Render functions ──────────────────────────────────────── */

  function renderHero(artist) {
    var hero = getEl('artist-hero');
    if (!hero) return;

    var photoHtml = '';
    if (isSafePhotoSrc(artist.photo)) {
      photoHtml = '<img class="hero-photo" src="' + esc(artist.photo) + '" alt="Photo of ' + esc(artist.name) + '" width="260" height="260" loading="eager" />';
    } else {
      // Initial placeholder — first letter of name, or music note
      var initial = artist.name ? artist.name.charAt(0).toUpperCase() : '♫';
      photoHtml = '<div class="hero-photo-placeholder" aria-hidden="true">' + esc(initial) + '</div>';
    }

    var eyebrow = artist.role ? '<span class="hero-eyebrow">' + esc(artist.role) + '</span>' : '';
    var tagline = artist.tagline ? '<p class="hero-tagline">' + esc(artist.tagline) + '</p>' : '';

    hero.innerHTML =
      '<div class="hero-photo-wrap">' + photoHtml + '</div>' +
      '<div class="hero-text">' +
        eyebrow +
        '<h1 class="hero-name" id="artist-name">' + esc(artist.name) + '</h1>' +
        tagline +
      '</div>';
  }

  function renderBio(artist) {
    var bio = getEl('artist-bio');
    if (!bio) return;
    if (!artist.bio || !artist.bio.trim()) {
      bio.style.display = 'none';
      return;
    }
    // Split on blank lines (one or more blank lines = paragraph break)
    var paras = artist.bio.split(/\n{2,}/).map(function (p) { return p.trim(); }).filter(Boolean);
    var html = '<h2 class="section-heading">About</h2>';
    paras.forEach(function (p) {
      html += '<p>' + esc(p).replace(/\n/g, '<br>') + '</p>';
    });
    bio.innerHTML = html;
  }

  function renderMusic(tracks) {
    var section = getEl('artist-music');
    if (!section) return;
    if (!tracks || tracks.length === 0) {
      section.style.display = 'none';
      return;
    }
    var html = '<h2 class="section-heading">Listen</h2><ul class="track-list" aria-label="Tracks">';
    tracks.forEach(function (track) {
      if (!track.title || !isHttpUrl(track.audio)) return;
      html +=
        '<li class="track-item">' +
          '<div class="track-title">' + esc(track.title) + '</div>' +
          '<audio class="track-audio" controls controlslist="nodownload noplaybackrate" preload="none" src="' + esc(track.audio) + '" aria-label="' + esc(track.title) + '"></audio>' +
        '</li>';
    });
    html += '</ul>';
    section.innerHTML = html;
    Array.prototype.forEach.call(section.querySelectorAll('audio'), function (a) {
      a.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    });
    section.style.display = '';
  }

  function renderLinks(links) {
    var section = getEl('artist-links');
    if (!section) return;
    if (!links || typeof links !== 'object') {
      section.style.display = 'none';
      return;
    }
    var keys = Object.keys(LINK_LABELS);
    var chips = '';
    keys.forEach(function (key) {
      var url = links[key];
      if (!isHttpUrl(url)) return;
      var label = LINK_LABELS[key] || key;
      var icon = LINK_ICONS[key] || '';
      chips +=
        '<a class="chip" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(label) + ' (opens in new tab)">' +
          icon + esc(label) +
        '</a>';
    });
    if (!chips) {
      section.style.display = 'none';
      return;
    }
    section.innerHTML = '<h2 class="section-heading">Find Us</h2><div class="chips">' + chips + '</div>';
    section.style.display = '';
  }

  function renderGallery(gallery) {
    var section = getEl('artist-gallery');
    if (!section) return;
    if (!Array.isArray(gallery) || gallery.length === 0) {
      section.style.display = 'none';
      return;
    }
    var safeImgs = gallery.filter(function (url) { return isSafePhotoSrc(url); });
    if (safeImgs.length === 0) {
      section.style.display = 'none';
      return;
    }
    var html = '<h2 class="section-heading">Gallery</h2><div class="gallery-grid">';
    safeImgs.forEach(function (url, i) {
      html +=
        '<img class="gallery-img" src="' + esc(url) + '" alt="Gallery photo ' + (i + 1) + '" loading="lazy" />';
    });
    html += '</div>';
    section.innerHTML = html;
    section.style.display = '';
  }

  function applyTheme(theme) {
    var safe = (typeof theme === 'string' && VALID_THEMES.indexOf(theme) !== -1) ? theme : 'navy';
    document.body.setAttribute('data-theme', safe);
  }

  function updatePageTitle(name) {
    if (name) {
      document.title = esc(name) + ' — Blue Heron Records';
    }
  }

  /* ── Error display ─────────────────────────────────────────── */

  function showError(heading, sub) {
    var loadEl = getEl('state-loading');
    var errEl  = getEl('state-error');
    var contentEl = getEl('artist-content');
    if (loadEl)   hide(loadEl);
    if (contentEl) hide(contentEl);
    if (errEl) {
      var h = getEl('error-heading');
      var s = getEl('error-sub');
      if (h && heading) h.textContent = heading;
      if (s && sub)     s.textContent = sub;
      show(errEl);
    }
  }

  /* ── Main init ─────────────────────────────────────────────── */

  function init() {
    var slug = getSlug();
    var loadEl    = getEl('state-loading');
    var errEl     = getEl('state-error');
    var contentEl = getEl('artist-content');

    if (!slug) {
      showError('Artist not found', 'No artist slug was provided in the URL.');
      return;
    }

    // Show spinner
    if (loadEl) show(loadEl);

    // Fetch artist row
    supa('/rest/v1/artists?slug=eq.' + encodeURIComponent(slug) + '&select=*')
      .then(function (rows) {
        if (!Array.isArray(rows) || rows.length === 0) {
          throw new Error('NOT_FOUND');
        }
        var artist = rows[0];

        // Fetch tracks in parallel
        return supa('/rest/v1/tracks?artist_id=eq.' + encodeURIComponent(artist.id) + '&select=*&order=sort.asc')
          .catch(function () { return []; }) // tracks are optional — don't fail the whole page
          .then(function (tracks) {
            return { artist: artist, tracks: tracks };
          });
      })
      .then(function (data) {
        var artist = data.artist;
        var tracks = data.tracks;

        // Apply theme before revealing content (avoids flash)
        applyTheme(artist.theme);
        updatePageTitle(artist.name);

        // Render all sections
        renderHero(artist);
        renderBio(artist);
        renderMusic(tracks);
        renderLinks(artist.links);
        renderGallery(artist.gallery);

        // Hide spinner, show content
        if (loadEl) hide(loadEl);
        if (contentEl) show(contentEl);
      })
      .catch(function (err) {
        if (err && err.message === 'NOT_FOUND') {
          showError('Artist not found', 'We couldn’t find an artist at that address. Check the link and try again.');
        } else {
          showError('Something went wrong', 'We had trouble loading this artist profile. Please try again in a moment.');
        }
      });
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
