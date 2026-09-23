HOLZAPFEL PRIVATE SECURITY — ready-to-upload website
=====================================================

Finished, built files. No build step, no Node, no server needed.
Upload the CONTENTS of this folder to your web directory.

All paths are relative, so this works at a domain root, in a subfolder,
or opened locally by double-clicking index.html.


BUILT WITH
----------
  Base URL   https://holzapfel.co.za
  Phone      +27 78 654 1161   (tel: and WhatsApp links live)
  Email      tim@holzapfel.co.za

If the domain is not holzapfel.co.za, rebuild — the base URL is baked into
the canonical tags, Open Graph, sitemap.xml, robots.txt and structured data.
See "Rebuild" below.


WHAT TO UPLOAD
--------------
Copy the contents of this folder — index.html, assets/, services/,
services-rates/, enquire/, privacy/, 404.html, sitemap.xml, robots.txt —
not the folder itself.

On GitHub Pages: commit and push them. They replace the old
holzapfel-private-security.html, services-rates.html and services/ files.


FILES
-----
  index.html               Home
  services-rates/          Services & Rates overview
  services/<name>/         The 7 service detail pages
  enquire/                 Enquiry form
  enquiry-received/        Confirmation page
  privacy/                 Privacy notice (DRAFT — see below)
  404.html                 Error page
  assets/                  CSS, JavaScript, fonts, icon
  sitemap.xml, robots.txt  For search engines

Fonts (Fraunces, Inter, IBM Plex Mono) are served from assets/fonts/ on your
own domain. No Google Fonts request, so no third party sees your visitors.


THE ENQUIRY FORM
----------------
enquire/ posts to https://holzapfel.co.za/api/enquiry — the small service in
the repository under api/. Until that is running the form cannot send
anything; phone, WhatsApp and email work normally regardless.

If you do not want to run a server, delete the enquire/ folder and point the
"Enquire" links at the contact details instead.


STILL TO REVIEW
---------------
privacy/ is an accurate description of what the code does with personal data,
but it is a DRAFT, not legal advice. Have it checked against POPIA and the
GDPR before launch. Values in [square brackets] are unfilled.

The PSIRA registration number is not set. Pass SITE_PSIRA_NUMBER when
rebuilding and it appears in the footer automatically.


REBUILD
-------
Repository: github.com/tomatensaft31135/Linuxtooling
Branch:     claude/production-website-build-ofr6wl

  npm ci

  SITE_BASE_URL="https://holzapfel.co.za" \
  SITE_API_URL="https://holzapfel.co.za" \
  SITE_PHONE="+27 78 654 1161" \
  SITE_EMAIL="tim@holzapfel.co.za" \
  SITE_PSIRA_NUMBER="..." \
  SITE_REQUIRE_CONTACT=1 \
  npm run build:portable --workspace site

Output lands in site/portable/ — exactly this folder.

SITE_REQUIRE_CONTACT=1 makes the build FAIL if a contact detail is missing,
so a version with placeholder details can never go live by accident.
