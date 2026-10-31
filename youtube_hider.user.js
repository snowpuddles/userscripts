// ==UserScript==
// @name         YouTube Element Hider
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Hides specific sections of YouTube
// @author       You
// @match        *://*.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  // --- METHOD 1: Hide by CSS Selector ---
  // Best for elements with unique IDs or tags (like the sidebar)
  const selectorsToHide = [
    "#secondary", // Hides the recommended sidebar (except on watch pages, see below)
    // 'ytd-rich-section-renderer', // Uncomment this to hide ALL horizontal shelves on the homepage
  ].join(", ");

  if (selectorsToHide) {
    const style = document.createElement("style");
    style.textContent = `${selectorsToHide} { display: none !important; }`;
    document.head.appendChild(style);

    // Keep the recommended sidebar visible on the actual video watch page.
    // YouTube is a single-page app, so re-check on every navigation.
    const updateForPage = () => {
      const onWatchPage = location.pathname === "/watch";
      style.disabled = onWatchPage;
    };
    updateForPage();
    window.addEventListener("yt-navigate-finish", updateForPage);
  }

  // --- METHOD 2: Hide by Text Content ---
  // Best for YouTube shelves (Shorts, Most relevant, etc) that share the same HTML tags.
  // It looks for a specific tag that contains specific text, and hides its parent container.
  const textElementsToHide = [
    {
      text: "Most relevant", // The exact title text to look for
      selector: "span#title", // The element containing the text
      parentToHide: "ytd-rich-section-renderer", // The top-level container to actually hide
    },
    {
      text: "Shorts",
      selector: "span#title",
      parentToHide: "ytd-rich-section-renderer",
    },
  ];

  // Use a MutationObserver to watch the page for changes (since YouTube loads dynamically)
  const observer = new MutationObserver(() => {
    textElementsToHide.forEach((item) => {
      // Find all matching text elements
      const elements = document.querySelectorAll(item.selector);
      elements.forEach((el) => {
        // If the text matches, find the parent container and hide it
        if (el.textContent.trim() === item.text) {
          const parent = el.closest(item.parentToHide);
          if (parent && parent.style.display !== "none") {
            parent.style.display = "none";
          }
        }
      });
    });
  });

  // Start observing the whole page for added elements
  observer.observe(document.body, { childList: true, subtree: true });
})();
