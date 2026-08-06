const beadArt = [
  { id: "regnbue", title: "Regnbue", image: "images/regnbue.svg" },
  { id: "raket", title: "Raket", image: "images/raket.svg" },
  { id: "blomst", title: "Blomst", image: "images/blomst.svg" },
  { id: "hjerte", title: "Hjerte", image: "images/hjerte.svg" },
  { id: "sol", title: "Solskin", image: "images/sol.svg" },
  { id: "robot", title: "Robot", image: "images/robot.svg" },
  { id: "sommerfugl", title: "Sommerfugl", image: "images/sommerfugl.svg" },
  { id: "spilfigur", title: "Spilfigur", image: "images/spilfigur.svg" },
];

const STORAGE_KEY = "perlegalleriet-favorites";

const gallery = document.querySelector("#gallery");
const cardTemplate = document.querySelector("#gallery-card-template");
const viewButtons = document.querySelectorAll("[data-view]");
const favoriteCount = document.querySelector(".favorite-count");
const resultCount = document.querySelector(".result-count");
const galleryKicker = document.querySelector("#gallery-kicker");
const galleryTitle = document.querySelector("#gallery-title");
const emptyState = document.querySelector("#empty-state");
const showAllButton = document.querySelector("[data-show-all]");
const dialog = document.querySelector("#image-dialog");
const dialogImage = document.querySelector("#dialog-image");
const dialogTitle = document.querySelector("#dialog-title");
const dialogFavoriteButton = document.querySelector(".dialog-favorite-button");
const closeButton = document.querySelector(".close-button");

let currentView = "all";
let currentDialogId = null;
let favorites = loadFavorites();

function loadFavorites() {
  try {
    const savedFavorites = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return new Set(Array.isArray(savedFavorites) ? savedFavorites : []);
  } catch {
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...favorites]));
  } catch {
    // Favoritterne virker stadig i den aktuelle session, hvis lokal lagring er blokeret.
  }
}

function isFavorite(id) {
  return favorites.has(id);
}

function setHeart(button, selected, title) {
  button.classList.toggle("is-favorite", selected);
  button.setAttribute("aria-pressed", String(selected));
  button.querySelector("[aria-hidden='true']").textContent = selected ? "♥" : "♡";

  const accessibleLabel = button.querySelector(".visually-hidden");
  if (accessibleLabel) {
    accessibleLabel.textContent = selected
      ? `Fjern ${title} fra favoritter`
      : `Gem ${title} som favorit`;
  }
}

function toggleFavorite(id) {
  if (isFavorite(id)) {
    favorites.delete(id);
  } else {
    favorites.add(id);
  }

  saveFavorites();
  renderGallery();
  updateDialogFavoriteButton();
}

function createCard(item) {
  const card = cardTemplate.content.firstElementChild.cloneNode(true);
  const imageButton = card.querySelector(".image-button");
  const image = card.querySelector("img");
  const title = card.querySelector("h3");
  const favoriteButton = card.querySelector(".favorite-button");

  image.src = item.image;
  image.alt = `Perleplade med motivet ${item.title}`;
  title.textContent = item.title;
  imageButton.setAttribute("aria-label", `Vis ${item.title} i stor størrelse`);
  imageButton.addEventListener("click", () => openDialog(item));

  setHeart(favoriteButton, isFavorite(item.id), item.title);
  favoriteButton.addEventListener("click", () => toggleFavorite(item.id));

  return card;
}

function renderGallery() {
  const visibleItems = currentView === "favorites"
    ? beadArt.filter((item) => isFavorite(item.id))
    : beadArt;

  gallery.replaceChildren(...visibleItems.map(createCard));
  gallery.hidden = visibleItems.length === 0;
  emptyState.hidden = !(currentView === "favorites" && visibleItems.length === 0);

  favoriteCount.textContent = String(favorites.size);
  favoriteCount.setAttribute(
    "aria-label",
    `${favorites.size} ${favorites.size === 1 ? "favorit" : "favoritter"}`,
  );

  resultCount.textContent = `${visibleItems.length} ${visibleItems.length === 1 ? "motiv" : "motiver"}`;
  galleryKicker.textContent = currentView === "favorites" ? "Din samling" : "Hele samlingen";
  galleryTitle.textContent = currentView === "favorites" ? "Favoritter" : "Perleplader";
}

function setView(view) {
  currentView = view;

  viewButtons.forEach((button) => {
    const isActive = button.dataset.view === view;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });

  renderGallery();
  document.querySelector(".gallery-section").scrollIntoView({ behavior: "smooth", block: "start" });
}

function openDialog(item) {
  currentDialogId = item.id;
  dialogImage.src = item.image;
  dialogImage.alt = `Perleplade med motivet ${item.title}`;
  dialogTitle.textContent = item.title;
  updateDialogFavoriteButton();
  dialog.showModal();
}

function updateDialogFavoriteButton() {
  if (!currentDialogId) return;

  const item = beadArt.find((candidate) => candidate.id === currentDialogId);
  const selected = isFavorite(currentDialogId);
  setHeart(dialogFavoriteButton, selected, item.title);
  dialogFavoriteButton.querySelector(".favorite-label").textContent = selected
    ? "Fjern fra favoritter"
    : "Gem som favorit";
}

viewButtons.forEach((button) => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

showAllButton.addEventListener("click", () => setView("all"));
closeButton.addEventListener("click", () => dialog.close());
dialogFavoriteButton.addEventListener("click", () => toggleFavorite(currentDialogId));

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

dialog.addEventListener("close", () => {
  currentDialogId = null;
  dialogImage.src = "";
});

renderGallery();
