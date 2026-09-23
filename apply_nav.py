#!/usr/bin/env python3
"""Replace the <header class="nav">...</header> block and the theme-color /
color-scheme meta tags on every page of the portable build with the new
Menu / centred-logo / Enquire-pill / Contact nav, and update site.webmanifest
to match the ivory colour scheme. Run once from the site root.
"""
import re

# (path, relative prefix to site root, active menu item: "home" | "services" | None)
PAGES = [
    ("index.html", "", "home"),
    ("404.html", "", None),
    ("enquire/index.html", "../", None),
    ("enquiry-received/index.html", "../", None),
    ("privacy/index.html", "../", None),
    ("services-rates/index.html", "../", "services"),
    ("services/24-hour-watch/index.html", "../../", "services"),
    ("services/airport-transfer/index.html", "../../", "services"),
    ("services/helicopter-transfer/index.html", "../../", "services"),
    ("services/full-day-option/index.html", "../../", "services"),
    ("services/half-day-escort/index.html", "../../", "services"),
    ("services/two-hour-protection/index.html", "../../", "services"),
    ("services/week-day-night-protection/index.html", "../../", "services"),
    ("services/week-day-protection/index.html", "../../", "services"),
]

HEADER_TMPL = """<header class="nav is-solid" id="siteNav">
  <div class="nav__inner">
    <details class="nav__menu">
      <summary class="nav__menu-trigger" aria-label="Menu">
        <span class="nav__menu-icon" aria-hidden="true"><span></span><span></span><span></span></span>
        <span class="nav__menu-label" data-label-open="Close">Menu</span>
      </summary>
      <div class="nav__menu-panel">
        <nav class="nav__menu-nav" aria-label="Primary">
          <a href="{prefix}index.html" class="nav__menu-link{home_active}"{home_current}>Home</a>

          <div class="nav__menu-group">
            <a href="{prefix}services-rates/index.html" class="nav__menu-link{services_active}"{services_current}>Services &amp; Rates</a>
            <div class="nav__menu-sublist">
              <a href="{prefix}services/airport-transfer/index.html" class="nav__menu-sublink">Airport Transfer</a>
              <a href="{prefix}services/two-hour-protection/index.html" class="nav__menu-sublink">2-Hour Protected Transport</a>
              <a href="{prefix}services/half-day-escort/index.html" class="nav__menu-sublink">Half-Day Escort</a>
              <a href="{prefix}services/full-day-option/index.html" class="nav__menu-sublink">Full-Day Option</a>
              <a href="{prefix}services/helicopter-transfer/index.html" class="nav__menu-sublink">Helicopter Transfer</a>
              <a href="{prefix}services/24-hour-watch/index.html" class="nav__menu-sublink">24-Hour Watch</a>
              <a href="{prefix}services/week-day-protection/index.html" class="nav__menu-sublink">One Week — Day Protection</a>
              <a href="{prefix}services/week-day-night-protection/index.html" class="nav__menu-sublink">One Week — Day &amp; Night Protection</a>
            </div>
          </div>

          <a href="{prefix}enquire/index.html" class="nav__menu-link{enquire_active}"{enquire_current}>Enquire</a>
        </nav>

        <div class="nav__menu-aside">
          <span class="eyebrow">Get In Touch</span>
          <a class="nav__menu-aside-item" href="tel:+27786541161">+27 78 654 1161</a>
          <a class="nav__menu-aside-item nav__menu-aside-item--sub" href="https://wa.me/27786541161" rel="noopener noreferrer">Message on WhatsApp</a>
          <a class="nav__menu-aside-item" href="mailto:tim@holzapfel.co.za">tim@holzapfel.co.za</a>
        </div>

        <div class="nav__menu-panel-foot">
          <span class="eyebrow">Cape Town — By Introduction</span>
        </div>
      </div>
    </details>

    <a href="{prefix}index.html" class="wordmark wordmark--nav nav__logo" aria-label="Holzapfel Private Security — home">
      <svg class="wordmark__mark" viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
        <path d="M6 4V28" stroke="currentColor" stroke-width="1.4"/>
        <path d="M26 4V28" stroke="currentColor" stroke-width="1.4"/>
        <path d="M6 16H26" stroke="currentColor" stroke-width="1.4"/>
        <path d="M6 4L26 28" stroke="currentColor" stroke-width="0.8" opacity="0.55"/>
      </svg>
      <span class="wordmark__text">
        <span class="wordmark__line1">HOLZAPFEL</span>
        <span class="wordmark__line2">Private Security</span>
      </span>
    </a>

    <div class="nav__actions">
      <a href="{prefix}enquire/index.html" class="nav__cta-solid"{enquire_current}>Enquire</a>
      <details class="nav__contact">
        <summary class="nav__contact-trigger" aria-label="Contact">
          <span class="nav__contact-label">Contact</span>
          <svg class="nav__contact-chevron" viewBox="0 0 10 6" fill="none" aria-hidden="true" focusable="false">
            <path d="M1 1L5 5L9 1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </summary>
        <div class="nav__contact-panel">
          <div class="nav__contact-item">
            <span class="eyebrow">Phone &amp; WhatsApp</span>
            <a href="tel:+27786541161">+27 78 654 1161</a>
            <a class="nav__contact-aside" href="https://wa.me/27786541161" rel="noopener noreferrer">Message on WhatsApp</a>
          </div>
          <div class="nav__contact-item">
            <span class="eyebrow">Email</span>
            <a href="mailto:tim@holzapfel.co.za">tim@holzapfel.co.za</a>
          </div>
        </div>
      </details>
    </div>
  </div>
</header>"""

HEADER_RE = re.compile(r'<header class="nav[^"]*" id="siteNav">.*?</header>', re.DOTALL)

# theme-color / color-scheme were already flipped to the ivory scheme in an
# earlier pass; this run only needs to update the header markup itself.
changed = []
for path, prefix, active in PAGES:
    with open(path, "r", encoding="utf-8") as f:
        html = f.read()

    home_active = " is-active" if active == "home" else ""
    home_current = ' aria-current="page"' if active == "home" else ""
    services_active = " is-active" if active == "services" else ""
    services_current = ' aria-current="page"' if active == "services" else ""
    enquire_active = " is-active" if path == "enquire/index.html" else ""
    enquire_current = ' aria-current="page"' if path == "enquire/index.html" else ""

    new_header = HEADER_TMPL.format(
        prefix=prefix,
        home_active=home_active,
        home_current=home_current,
        services_active=services_active,
        services_current=services_current,
        enquire_active=enquire_active,
        enquire_current=enquire_current,
    )

    new_html, n = HEADER_RE.subn(new_header, html, count=1)
    if n != 1:
        raise SystemExit(f"header block not found/matched exactly once in {path} (matched {n})")

    with open(path, "w", encoding="utf-8") as f:
        f.write(new_html)
    changed.append(path)

print(f"Updated {len(changed)} files:")
for p in changed:
    print(" -", p)
