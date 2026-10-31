# Userscripts (Tampermonkey / Violentmonkey)

Browser userscripts for decluttering feeds and improving web UIs.

Install the loader: <https://raw.githubusercontent.com/snowpuddles/userscripts/main/userscripts.user.js>

`userscripts.user.js` pulls in each script below with `@require`, referencing `main`. In Tampermonkey, set Settings → Advanced → Externals → Update Interval so pushed changes get picked up.

To add a script, add the file with a site check at the top, then add its `@match` and `@require` lines to the loader and bump the loader's `@version`.

- **`youtube_hider.js`**: Hides YouTube Shorts shelves, "Most relevant" shelves, and non-watch-page sidebars.
- **`facebook_marketplace_hider.js`**: Adds a persistent one-click `×` Hide button directly onto Facebook Marketplace browse tiles and listing photo galleries (persisted via `localStorage`).
