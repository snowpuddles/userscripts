(function () {
  "use strict";

  if (location.hostname !== "www.facebook.com") return;

  const STORAGE_KEY = "fbMarketplaceHiddenIds";

  const loadHiddenIds = () => {
    try {
      return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
    } catch {
      return new Set();
    }
  };

  const hiddenIds = loadHiddenIds();

  const saveHiddenIds = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...hiddenIds]));
  };

  const getItemId = (href) => {
    const match = href.match(/\/marketplace\/item\/(\d+)/);
    return match ? match[1] : null;
  };

  // Marks an item hidden and immediately hides any matching tile(s)
  // already on the page (there can be more than one, or none, depending
  // on whether we're on the grid or a single item's page).
  function hideItemEverywhere(itemId) {
    hiddenIds.add(itemId);
    saveHiddenIds();
    document
      .querySelectorAll(`a[href*="/marketplace/item/${itemId}/"]`)
      .forEach((link) => {
        const tile = findTile(link);
        if (tile) tile.style.display = "none";
      });
  }

  const processedLinks = new WeakSet();
  const processedItemPageIds = new Set();
  const ITEM_LINK_SELECTOR = 'a[href*="/marketplace/item/"]';
  const TILE_CLASS = "fb-mp-hider-tile";
  const BUTTON_CLASS = "fb-mp-hider-btn";

  // Inline styles can't express :hover, so the show-on-hover behavior
  // needs a real stylesheet rule keyed off a class on the tile.
  const style = document.createElement("style");
  style.textContent = `
    .${BUTTON_CLASS} {
      opacity: 0;
      transition: opacity 0.15s ease;
      pointer-events: none;
    }
    .${TILE_CLASS}:hover .${BUTTON_CLASS} {
      opacity: 1;
      pointer-events: auto;
    }
  `;
  document.head.appendChild(style);

  // Facebook's marketplace grid has no stable class or attribute marking
  // where one listing's tile ends, and it nests a different number of
  // wrapper divs depending on the layout. So instead of guessing a
  // selector, walk up from the listing link until we reach the ancestor
  // whose parent has 2+ children that each contain a listing link - that's
  // the boundary between "this listing" and "the grid of many listings".
  function findTile(link) {
    let current = link;
    while (current.parentElement && current.parentElement !== document.body) {
      const parent = current.parentElement;
      let itemSiblingCount = 0;
      for (const child of parent.children) {
        if (child.matches(ITEM_LINK_SELECTOR) || child.querySelector(ITEM_LINK_SELECTOR)) {
          itemSiblingCount++;
          if (itemSiblingCount >= 2) break;
        }
      }
      if (itemSiblingCount >= 2) return current;
      current = parent;
    }
    return link.parentElement || link;
  }

  function addHideButton(link) {
    const itemId = getItemId(link.getAttribute("href") || "");
    if (!itemId) return;

    const tile = findTile(link);
    if (!tile) return;

    // Re-checked on every scan (even for already-processed links) so that
    // hiding an item from its own detail page also hides it here if this
    // same tile is still mounted after navigating back.
    if (hiddenIds.has(itemId)) {
      tile.style.display = "none";
      return;
    }

    if (processedLinks.has(link)) return;
    processedLinks.add(link);

    const btn = document.createElement("button");
    btn.textContent = "×"; // ×
    btn.type = "button";
    btn.className = BUTTON_CLASS;
    btn.setAttribute("aria-label", "Hide listing");
    Object.assign(btn.style, {
      position: "absolute",
      top: "8px",
      right: "8px",
      zIndex: "9999",
      width: "24px",
      height: "24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#e41e3f",
      color: "#fff",
      border: "none",
      borderRadius: "50%",
      padding: "0",
      fontSize: "16px",
      fontWeight: "700",
      lineHeight: "1",
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
    });

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideItemEverywhere(itemId);
    });

    if (getComputedStyle(tile).position === "static") {
      tile.style.position = "relative";
    }
    tile.classList.add(TILE_CLASS);
    tile.appendChild(btn);
  }

  const getItemIdFromLocation = () => getItemId(location.pathname);

  // The single-item page's photo gallery has no stable class either, but
  // it always contains "View previous/next image" controls alongside the
  // photo, so climb from the main photo until an ancestor holds both -
  // that's the gallery's outer boundary.
  function findGalleryContainer(mainImg) {
    let el = mainImg;
    while (el && el !== document.body) {
      if (
        el.querySelector('[aria-label="View previous image"]') &&
        el.querySelector('[aria-label="View next image"]')
      ) {
        return el;
      }
      el = el.parentElement;
    }
    return mainImg.parentElement;
  }

  function addHideButtonOnItemPage() {
    const itemId = getItemIdFromLocation();
    if (!itemId || processedItemPageIds.has(itemId)) return;

    // The large photo and each thumbnail share the same alt-text prefix;
    // thumbnails are wrapped in a "Thumbnail N" labeled element, so the
    // one photo NOT inside a thumbnail wrapper is the main hero image.
    const mainImg = Array.from(
      document.querySelectorAll('img[alt^="Product photo of"]')
    ).find((img) => !img.closest('[aria-label^="Thumbnail"]'));
    if (!mainImg) return; // photo hasn't rendered yet - try again next scan

    processedItemPageIds.add(itemId);

    const container = findGalleryContainer(mainImg);
    if (getComputedStyle(container).position === "static") {
      container.style.position = "relative";
    }

    const btn = document.createElement("button");
    btn.textContent = "×";
    btn.type = "button";
    btn.setAttribute("aria-label", "Hide listing");
    Object.assign(btn.style, {
      position: "absolute",
      top: "12px",
      right: "12px",
      zIndex: "9999",
      width: "32px",
      height: "32px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#e41e3f",
      color: "#fff",
      border: "none",
      borderRadius: "50%",
      padding: "0",
      fontSize: "20px",
      fontWeight: "700",
      lineHeight: "1",
      cursor: "pointer",
      boxShadow: "0 1px 3px rgba(0,0,0,0.5)",
    });

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      hideItemEverywhere(itemId);
      history.back();
    });

    container.appendChild(btn);
  }

  function scan() {
    document.querySelectorAll(ITEM_LINK_SELECTOR).forEach(addHideButton);
    addHideButtonOnItemPage();
  }

  scan();

  // Facebook is a single-page app that streams in new listings as you
  // scroll, so keep watching for new tiles. Batch bursts of mutations
  // into a single scan per animation frame to avoid excessive scanning.
  let scanScheduled = false;
  const observer = new MutationObserver(() => {
    if (scanScheduled) return;
    scanScheduled = true;
    requestAnimationFrame(() => {
      scanScheduled = false;
      scan();
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
