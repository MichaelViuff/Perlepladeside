const beadArt = [
  { id: "furnace", title: "Furnace", author: "anonymous", image: "images/furnace.jpg" },
  {
    id: "green_circuit",
    title: "Green Circuit",
    author: "anonymous",
    image: "images/green circuit.jpg",
  },
  {
    id: "green_science_pack",
    title: "Green Science Peak",
    author: "anonymous",
    image: "images/green science pack.jpg",
  },
  { id: "lab", title: "Lab", author: "anonymous", image: "images/lab.jpg" },
  { id: "transport", title: "Transport", author: "anonymous", image: "images/transport.jpg" },
  {
    id: "red_science_pack",
    title: "Red Science Pack",
    author: "anonymous",
    image: "images/red science pack.jpg",
  },
  {
    id: "long_inserter",
    title: "Long Inserter",
    author: "anonymous",
    image: "images/long inserter.jpg",
  },
];

const STORAGE_KEY = "perlegalleriet-favorites";
const artworkIds = new Set(beadArt.map((item) => item.id));

const gallery = document.querySelector("#gallery");
const cardTemplate = document.querySelector("#gallery-card-template");
const viewButtons = document.querySelectorAll("[data-view]");
const favoriteCount = document.querySelector(".favorite-count");
const favoriteTransferActions = document.querySelector(".favorite-transfer-actions");
const favoriteTransferStatus = document.querySelector(".favorite-transfer-status");
const exportFavoritesButton = document.querySelector("[data-export-favorites]");
const importFavoritesButton = document.querySelector("[data-import-favorites]");
const favoriteImportInput = document.querySelector("#favorite-import-input");
const resultCount = document.querySelector(".result-count");
const galleryKicker = document.querySelector("#gallery-kicker");
const galleryTitle = document.querySelector("#gallery-title");
const emptyState = document.querySelector("#empty-state");
const showAllButton = document.querySelector("[data-show-all]");
const dialog = document.querySelector("#image-dialog");
const dialogImage = document.querySelector("#dialog-image");
const dialogTitle = document.querySelector("#dialog-title");
const dialogAuthor = document.querySelector("#dialog-author");
const dialogPreviousButton = document.querySelector(".dialog-previous-button");
const dialogNextButton = document.querySelector(".dialog-next-button");
const dialogFavoriteButton = document.querySelector(".dialog-favorite-button");
const closeButton = document.querySelector(".close-button");

let currentView = "all";
let currentDialogId = null;
let favorites = loadFavorites();
saveFavorites();

function loadFavorites() {
  try {
    const savedFavorites = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return normalizeFavorites(savedFavorites);
  } catch {
    return new Set();
  }
}

function normalizeFavorites(candidateIds) {
  const validFavorites = Array.isArray(candidateIds)
    ? candidateIds.filter((id) => artworkIds.has(id))
    : [];

  return new Set(validFavorites);
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

function showFavoriteTransferStatus(message, isError = false) {
  favoriteTransferStatus.textContent = message;
  favoriteTransferStatus.classList.toggle("is-error", isError);
  favoriteTransferStatus.hidden = false;
}

function exportFavorites() {
  const backup = {
    version: 1,
    favorites: [...favorites],
  };
  const file = new Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: "application/json" });
  const downloadUrl = URL.createObjectURL(file);
  const downloadLink = document.createElement("a");

  downloadLink.href = downloadUrl;
  downloadLink.download = "perlegalleriet-favoritter.json";
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);

  showFavoriteTransferStatus(
    `${favorites.size} ${favorites.size === 1 ? "favorit eksporteret" : "favoritter eksporteret"}.`,
  );
}

async function importFavorites(event) {
  const [file] = event.target.files;
  if (!file) return;

  try {
    const backup = JSON.parse(await file.text());
    const candidateIds = Array.isArray(backup) ? backup : backup?.favorites;
    if (!Array.isArray(candidateIds)) throw new Error("Invalid favorites backup");

    favorites = normalizeFavorites(candidateIds);
    saveFavorites();
    renderGallery();
    showFavoriteTransferStatus(
      `${favorites.size} ${favorites.size === 1 ? "favorit importeret" : "favoritter importeret"}.`,
    );
  } catch {
    showFavoriteTransferStatus("Filen kunne ikke importeres.", true);
  } finally {
    favoriteImportInput.value = "";
  }
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
  if (currentDialogId) {
    updateDialogFavoriteButton();
    updateDialogNavigation();
  }
}

function createCard(item) {
  const card = cardTemplate.content.firstElementChild.cloneNode(true);
  const imageButton = card.querySelector(".image-button");
  const image = card.querySelector("img");
  const title = card.querySelector("h3");
  const author = card.querySelector(".art-author");
  const favoriteButton = card.querySelector(".favorite-button");

  image.src = item.image;
  image.alt = `Perleplade med motivet ${item.title}`;
  title.textContent = item.title;
  author.textContent = `Af ${item.author}`;
  imageButton.setAttribute("aria-label", `Vis ${item.title} i stor størrelse`);
  imageButton.addEventListener("click", () => openDialog(item));

  setHeart(favoriteButton, isFavorite(item.id), item.title);
  favoriteButton.addEventListener("click", () => toggleFavorite(item.id));

  return card;
}

function getVisibleItems() {
  return currentView === "favorites"
    ? beadArt.filter((item) => isFavorite(item.id))
    : beadArt;
}

function renderGallery() {
  const visibleItems = getVisibleItems();

  gallery.replaceChildren(...visibleItems.map(createCard));
  gallery.hidden = visibleItems.length === 0;
  emptyState.hidden = !(currentView === "favorites" && visibleItems.length === 0);

  favoriteCount.textContent = String(favorites.size);
  favoriteCount.setAttribute(
    "aria-label",
    `${favorites.size} ${favorites.size === 1 ? "favorit" : "favoritter"}`,
  );
  favoriteTransferActions.hidden = currentView !== "favorites";

  resultCount.textContent = `${visibleItems.length} ${visibleItems.length === 1 ? "motiv" : "motiver"}`;
  galleryKicker.textContent = currentView === "favorites" ? "Din samling" : "Hele samlingen";
  galleryTitle.textContent = currentView === "favorites" ? "Favoritter" : "Perleplader";
}

function setView(view) {
  currentView = view;
  favoriteTransferStatus.hidden = true;

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
  updateDialogContent(item);
  dialog.showModal();
}

function updateDialogContent(item) {
  currentDialogId = item.id;
  dialogImage.src = item.image;
  dialogImage.alt = `Perleplade med motivet ${item.title}`;
  dialogTitle.textContent = item.title;
  dialogAuthor.textContent = `Af ${item.author}`;
  updateDialogFavoriteButton();
  updateDialogNavigation();
}

function updateDialogNavigation() {
  const visibleItems = getVisibleItems();
  const currentItemIsVisible = visibleItems.some((item) => item.id === currentDialogId);
  const canNavigate = visibleItems.length > 1 || (visibleItems.length === 1 && !currentItemIsVisible);

  dialogPreviousButton.disabled = !canNavigate;
  dialogNextButton.disabled = !canNavigate;
}

function navigateDialog(direction) {
  const visibleItems = getVisibleItems();
  if (visibleItems.length === 0) return;

  const currentIndex = visibleItems.findIndex((item) => item.id === currentDialogId);
  if (visibleItems.length === 1 && currentIndex === 0) return;

  let nextIndex;
  if (currentIndex === -1) {
    nextIndex = direction > 0 ? 0 : visibleItems.length - 1;
  } else {
    nextIndex = (currentIndex + direction + visibleItems.length) % visibleItems.length;
  }

  updateDialogContent(visibleItems[nextIndex]);
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
exportFavoritesButton.addEventListener("click", exportFavorites);
importFavoritesButton.addEventListener("click", () => favoriteImportInput.click());
favoriteImportInput.addEventListener("change", importFavorites);
closeButton.addEventListener("click", () => dialog.close());
dialogPreviousButton.addEventListener("click", () => navigateDialog(-1));
dialogNextButton.addEventListener("click", () => navigateDialog(1));
dialogFavoriteButton.addEventListener("click", () => toggleFavorite(currentDialogId));

dialog.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    event.preventDefault();
    navigateDialog(-1);
  } else if (event.key === "ArrowRight") {
    event.preventDefault();
    navigateDialog(1);
  }
});

dialog.addEventListener("click", (event) => {
  if (event.target === dialog) dialog.close();
});

dialog.addEventListener("close", () => {
  currentDialogId = null;
  dialogImage.src = "";
});

renderGallery();
