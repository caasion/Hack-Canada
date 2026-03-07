"use strict";

/**
 * iTrack Firefox extension – content script
 * Injects right-side product panel on Instagram
 * Clicking a product opens the product URL directly
 */

const PANEL_ID = "itrack-panel";
const REOPEN_ID = "itrack-reopen-pill";
const RECOMMENDED_SECTION_ID = "itrack-recommended-section";

/* ---------------- MOCK DATA ---------------- */

const MOCK_RECOMMENDED = [
  {
    id: "rec-1",
    name: "Pegasus Runner",
    shortDescription: "Lightweight road-running shoe",
    imageUrl:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=280&h=280&fit=crop",
    price: "$120",
    url: "https://www.nike.com",
  },
  {
    id: "rec-2",
    name: "Studio Headphones",
    shortDescription: "Noise-cancelling over-ear",
    imageUrl:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=280&h=280&fit=crop",
    price: "$349",
    url: "https://example.com/headphones",
  },
  {
    id: "rec-3",
    name: "Everyday Tote",
    shortDescription: "Soft leather carry-all",
    imageUrl:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=280&h=280&fit=crop",
    price: "$245",
    url: "https://example.com/tote",
  },
];

const MOCK_ALL = [
  {
    id: "all-1",
    name: "Classic Tee",
    shortDescription: "Organic cotton",
    imageUrl:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=280&h=280&fit=crop",
    price: "$25",
    url: "https://example.com/tshirt",
  },
  {
    id: "all-2",
    name: "Daypack",
    shortDescription: "Minimal backpack",
    imageUrl:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=280&h=280&fit=crop",
    price: "$89",
    url: "https://example.com/backpack",
  },
  {
    id: "all-3",
    name: "Smart Bottle",
    shortDescription: "Tracks hydration",
    imageUrl:
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=280&h=280&fit=crop",
    price: "$59",
    url: "https://example.com/bottle",
  },
];

/* ---------------- HELPERS ---------------- */

function isInstagram() {
  return window.location.hostname.includes("instagram.com");
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function attachImageFallback(img) {
  img.addEventListener(
    "error",
    () => {
      img.src = "https://placehold.co/280x280/111827/F9FAFB?text=Product";
    },
    { once: true }
  );
}

/* ---------------- PANEL ---------------- */

function getOrCreatePanel() {
  let panel = document.getElementById(PANEL_ID);

  if (panel) return panel;

  panel = document.createElement("div");
  panel.id = PANEL_ID;
  panel.className = "itrack-panel";

  document.body.appendChild(panel);

  return panel;
}

/* ---------------- REOPEN PILL ---------------- */

function createReopenPill() {
  if (document.getElementById(REOPEN_ID)) return;

  const pill = document.createElement("button");

  pill.id = REOPEN_ID;
  pill.className = "itrack-reopen-pill itrack-reopen-hidden";
  pill.textContent = "iTrack";

  pill.addEventListener("click", () => {
    const panel = document.getElementById(PANEL_ID);

    if (!panel) return;

    panel.classList.remove("itrack-panel-hidden");

    pill.classList.add("itrack-reopen-hidden");
  });

  document.body.appendChild(pill);
}

/* ---------------- SECTIONS ---------------- */

function createSection(parent, title, id) {
  const section = document.createElement("div");

  section.className = "itrack-section";

  section.innerHTML = `
    <h2 class="itrack-section-title">${escapeHtml(title)}</h2>
    <div id="${id}" class="itrack-tiles"></div>
  `;

  parent.appendChild(section);

  return section.querySelector(".itrack-tiles");
}

/* ---------------- PRODUCT TILE ---------------- */

function renderTile(container, product) {
  const tile = document.createElement("div");

  tile.className = "itrack-tile";

  const price = product.price
    ? `<span class="itrack-tile-price">${escapeHtml(product.price)}</span>`
    : "";

  tile.innerHTML = `
    <div class="itrack-tile-media">
      <img src="${escapeHtml(product.imageUrl)}" width="56" height="56" loading="lazy"/>
    </div>

    <div class="itrack-tile-body">
      <span class="itrack-tile-name">${escapeHtml(product.name)}</span>
      ${price}
    </div>
  `;

  const img = tile.querySelector("img");

  if (img) attachImageFallback(img);

  tile.addEventListener("click", () => {
    window.open(product.url, "_blank");
  });

  container.appendChild(tile);
}

/* ---------------- CREATE PANEL ---------------- */

function createPanel() {
  const panel = getOrCreatePanel();

  panel.innerHTML = "";

  panel.classList.remove("itrack-panel-hidden");

  const content = document.createElement("div");

  content.className = "itrack-content";

  panel.appendChild(content);

  const recContainer = createSection(
    content,
    "Product in Video",
    "itrack-recommended-tiles"
  );

  const allContainer = createSection(
    content,
    "For you",
    "itrack-all-tiles"
  );

  MOCK_RECOMMENDED.forEach((p) => renderTile(recContainer, p));

  MOCK_ALL.forEach((p) => renderTile(allContainer, p));

  createReopenPill();
}

/* ---------------- INIT ---------------- */

function init() {
  if (!isInstagram()) return;

  if (document.getElementById(PANEL_ID)) return;

  createPanel();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}

/* ---------------- API HOOK ---------------- */

window.addEventListener("itrack-products", (e) => {
  const { recommended = [], all = [] } = e.detail || {};

  const rec = document.getElementById("itrack-recommended-tiles");
  const allTiles = document.getElementById("itrack-all-tiles");

  if (!rec || !allTiles) return;

  rec.innerHTML = "";
  allTiles.innerHTML = "";

  recommended.forEach((p) => renderTile(rec, p));
  all.forEach((p) => renderTile(allTiles, p));
});