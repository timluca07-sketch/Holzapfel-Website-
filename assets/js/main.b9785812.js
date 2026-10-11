/**
 * Holzapfel Private Security — progressive enhancement.
 *
 * Everything here is an *enhancement*. With this file blocked or broken:
 *   - the nav renders solid on every page (server-side class) — see
 *     .nav.is-solid in main.css — and the Menu sidebar falls back to a fixed
 *     75px offset instead of a JS-measured one, which is accurate at most
 *     sizes;
 *   - the Menu and Contact triggers are native <details>/<summary> and still
 *     open and close with no JavaScript at all;
 *   - all [data-reveal] content is shown (see `html:not(.js)` in main.css);
 *   - the hero title and statement band sit still instead of drifting with
 *     scroll;
 *   - the enquiry form submits as an ordinary cross-origin POST and the API
 *     replies with a 303 redirect to the confirmation page.
 *
 * No third-party code, no globals leaked; the whole file is one IIFE.
 */
(function () {
  "use strict";

  /** When the page was loaded — used as a cheap bot-timing signal. */
  var loadedAt = Date.now();

  /* ---------------------------------------------------------------- intro --
     Homepage only — every other page has no .intro-overlay element, so this
     whole block no-ops there. Whether to show the overlay at all (session-
     once) was already decided earlier, synchronously in <head> before first
     paint; by the time this file runs the overlay is already either playing
     or absent.

     Two stages: the logo animation (decorative, .intro-overlay__logo-stage,
     aria-hidden), then the entrance navigator (.intro-overlay__gate-stage,
     a real <nav> of Home / Private Security / Chauffeur Service / Trade).
     The gate does not auto-dismiss — Tim wants a visitor to actively choose
     before seeing anything else — so this block's jobs are: get to the gate
     promptly (skip the logo animation outright under prefers-reduced-motion,
     or on the visitor's first interaction if they click/tap/press a key
     before it finishes on its own), keep the still-covered page out of the
     tab order while any of this is up (so Tab can't reach content that is
     only visually hidden behind the overlay), move focus into the gate once
     it is reachable, and clear everything — the inert lock and the overlay
     itself — the moment "Home" is clicked. Private Security and Chauffeur
     Service are ordinary links; clicking either just navigates, same as
     anywhere else on the site. */
  var introOverlay = document.querySelector(".intro-overlay");
  if (introOverlay && document.documentElement.classList.contains("intro-pending")) {
    var gateStage = introOverlay.querySelector(".intro-overlay__gate-stage");

    var lockedEls = [
      document.querySelector(".skip-link"),
      document.getElementById("siteNav"),
      document.getElementById("main"),
      document.querySelector(".footer"),
    ].filter(Boolean);
    lockedEls.forEach(function (el) {
      el.setAttribute("inert", "");
    });

    var focusGate = function () {
      var first = gateStage.querySelector("a, button");
      if (first) first.focus();
    };

    var skipLogo = function () {
      introOverlay.classList.add("intro-overlay--skip-logo");
      focusGate();
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      skipLogo();
    } else {
      gateStage.addEventListener("animationend", function (event) {
        if (event.animationName === "introGateStageIn") focusGate();
      });
      ["pointerdown", "keydown", "touchstart"].forEach(function (type) {
        window.addEventListener(type, skipLogo, { once: true, passive: true });
      });
      // Backstop in case the animationend above never fires for some reason
      // (an interrupted animation, an unsupported property) — the gate is
      // already visible either way by then (that is driven by CSS alone);
      // this only guarantees focus still lands there.
      window.setTimeout(focusGate, 2600);
    }

    var homeButton = introOverlay.querySelector("[data-intro-home]");
    if (homeButton) {
      homeButton.addEventListener("click", function () {
        introOverlay.classList.add("intro-overlay--leaving");
        lockedEls.forEach(function (el) {
          el.removeAttribute("inert");
        });
        window.setTimeout(function () {
          document.documentElement.classList.remove("intro-pending");
        }, 320);
      });
    }
  }

  /* ------------------------------------------------------------------ nav --
     The header is a fixed, always-solid bar now (see .nav.is-solid in
     main.css, applied server-side on every page). The one thing still
     measured at runtime is its own rendered height, published as --nav-h so
     the Menu sidebar (position: fixed; top: var(--nav-h)) always sits flush
     beneath it, including at breakpoints where the bar's padding changes
     its height. */
  var nav = document.getElementById("siteNav");
  if (nav) {
    var syncNavHeight = function () {
      document.documentElement.style.setProperty("--nav-h", nav.offsetHeight + "px");
    };
    syncNavHeight();
    window.addEventListener("resize", syncNavHeight);
  }

  /* ------------------------------------------------------- scroll motion --
     Two things are tied to scroll position rather than a one-time reveal:
     the hero title drifts slower than the page and fades as it glides into
     the photo, and the statement band drifts as it passes through the
     viewport. Both run off one rAF-throttled scroll listener rather than
     one each. Skipped entirely under prefers-reduced-motion — each element
     just keeps its default, still CSS position. */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /** 0 when el's top edge is at the viewport's bottom edge (just entering),
   *  1 when el's bottom edge is at the viewport's top edge (fully scrolled
   *  past). Ties an element's motion to how far it has travelled through
   *  the viewport, rather than to raw page scroll position. */
  var scrollProgress = function (el) {
    var rect = el.getBoundingClientRect();
    var vh = window.innerHeight;
    var total = rect.height + vh;
    var traveled = vh - rect.top;
    return Math.min(Math.max(traveled / total, 0), 1);
  };

  var heroInner = document.querySelector(".hero__inner");
  var heroSection = document.querySelector(".hero");
  var statementWrap = document.querySelector(".statement .wrap");
  var statementSection = document.querySelector(".statement");
  var scrollFrame = null;

  var applyScrollEffects = function () {
    scrollFrame = null;

    if (heroInner && heroSection) {
      var heroRange = heroSection.offsetHeight || 1;
      var heroProgress = Math.min(Math.max(window.scrollY / heroRange, 0), 1);
      heroInner.style.transform = "translate3d(0, " + Math.round(heroProgress * 160) + "px, 0)";
      heroInner.style.opacity = String(1 - heroProgress * 0.5);
    }

    if (statementWrap && statementSection) {
      var stProgress = scrollProgress(statementSection);
      statementWrap.style.transform = "translate3d(0, " + Math.round(stProgress * 40) + "px, 0)";
    }
  };

  if (!reduceMotion && (heroInner || statementWrap)) {
    var onScroll = function () {
      if (scrollFrame === null) scrollFrame = window.requestAnimationFrame(applyScrollEffects);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", applyScrollEffects);
    applyScrollEffects();
  }

  /* ------------------------------------------------------------ nav menus --
     The Menu and Contact triggers are native <details>/<summary> — they work
     with this script blocked or broken. This only adds two conveniences:
     closing one when the other opens, and closing on an outside click or
     Escape, so they behave like a single dropdown rather than two
     independent ones. Runs on every page, so it sits above the form's early
     return below. */
  var navDetails = Array.prototype.slice.call(
    document.querySelectorAll(".nav__menu, .nav__contact"),
  );
  /* The Menu's panel sits right after its <details>, not inside it (see
     .nav__menu-panel in main.css), so a click inside the panel still counts
     as a click inside the Menu. */
  var menuPanel = document.getElementById("menuPanel");
  var isInside = function (el, target) {
    if (el.contains(target)) return true;
    return el.classList.contains("nav__menu") && !!menuPanel && menuPanel.contains(target);
  };
  if (navDetails.length) {
    navDetails.forEach(function (el) {
      el.addEventListener("toggle", function () {
        if (!el.open) return;
        navDetails.forEach(function (other) {
          if (other !== el) other.open = false;
        });
      });
    });

    document.addEventListener("click", function (event) {
      navDetails.forEach(function (el) {
        if (el.open && !isInside(el, event.target)) el.open = false;
      });
    });

    document.addEventListener("keydown", function (event) {
      if (event.key !== "Escape") return;
      navDetails.forEach(function (el) {
        if (el.open) el.open = false;
      });
    });
  }

  /* Menu unfolds as a fixed sidebar (see .nav__menu-panel in main.css); lock
     page scroll behind it while open so the rest of the page doesn't drift
     under it. Contact's small anchored dropdown does not need this. Without
     this script the <details> still opens and closes natively — the page
     can just also scroll behind it. */
  var menuDetails = document.querySelector(".nav__menu");
  if (menuDetails) {
    menuDetails.addEventListener("toggle", function () {
      document.documentElement.classList.toggle("has-open-menu", menuDetails.open);
      // Backup for the CSS sibling rule that shows the panel.
      var panel = document.getElementById("menuPanel");
      if (panel) panel.classList.toggle("is-open", menuDetails.open);
    });
  }

  /* --------------------------------------------------------------- reveal --
     Fade sections in as they enter the viewport. Falls back to "just show
     everything" where IntersectionObserver is unavailable. */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if ("IntersectionObserver" in window) {
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
      );
      revealEls.forEach(function (el) {
        observer.observe(el);
      });
    } else {
      revealEls.forEach(function (el) {
        el.classList.add("is-visible");
      });
    }
  }

  /* ----------------------------------------------------------------- form --
     Submit the enquiry over fetch and report the result inline, so the visitor
     keeps their place on the page. */
  var form = document.getElementById("enquiryForm");
  if (!form) return;

  var status = document.getElementById("formStatus");
  var submitButton = form.querySelector('button[type="submit"]');
  var serviceField = form.querySelector("#service");

  /**
   * Pre-select the service the visitor arrived from, e.g.
   * /enquire/?service=full-day-option. Values that do not match an existing
   * option are ignored rather than injected.
   */
  if (serviceField) {
    try {
      var wanted = new URLSearchParams(window.location.search).get("service");
      if (wanted) {
        var match = Array.prototype.find.call(serviceField.options, function (option) {
          return option.value === wanted;
        });
        if (match) serviceField.value = match.value;
      }
    } catch (error) {
      /* URLSearchParams unavailable — the field simply stays on its default. */
    }
  }

  /** Write a message into the aria-live region. */
  function setStatus(message, kind) {
    if (!status) return;
    status.textContent = message;
    status.className = "form__status" + (kind ? " form__status--" + kind : "");
  }

  /** Contact fallback appended to error messages when we know a channel. */
  function fallbackHint() {
    var mail = form.getAttribute("data-fallback-email");
    return mail ? " Please email us directly at " + mail + "." : "";
  }

  form.addEventListener("submit", function (event) {
    // Let the browser show its own messages and block the submit if invalid.
    if (!form.checkValidity()) return;

    event.preventDefault();

    var payload = new FormData(form);
    // Seconds spent on the page. The API treats an implausibly fast submission
    // as automated; a human filling six fields never manages it in under two.
    payload.set("elapsed", String(Math.round((Date.now() - loadedAt) / 1000)));

    var body = {};
    payload.forEach(function (value, key) {
      body[key] = value;
    });

    submitButton.disabled = true;
    setStatus("Sending your enquiry…", null);

    fetch(form.action, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      // No cookies are involved; keep the request simple and same-origin-safe.
      credentials: "omit",
      mode: "cors",
    })
      .then(function (response) {
        return response
          .json()
          .catch(function () {
            return {};
          })
          .then(function (data) {
            return { ok: response.ok, statusCode: response.status, data: data };
          });
      })
      .then(function (result) {
        if (result.ok) {
          form.reset();
          var target = form.getAttribute("data-success-url");
          if (target) {
            window.location.assign(target);
            return;
          }
          setStatus("Thank you. Your enquiry is with us.", "success");
          return;
        }

        if (result.statusCode === 429) {
          setStatus(
            "Too many enquiries from this connection. Please try again shortly." +
              fallbackHint(),
            "error",
          );
          return;
        }

        setStatus(
          (result.data && result.data.message) ||
            "We could not send that." + fallbackHint(),
          "error",
        );
      })
      .catch(function () {
        setStatus(
          "The enquiry service is unreachable." + fallbackHint(),
          "error",
        );
      })
      .finally(function () {
        submitButton.disabled = false;
      });
  });
})();
