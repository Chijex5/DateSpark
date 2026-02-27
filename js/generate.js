const generateForm = document.getElementById("generate-form");
const budgetSelect = document.getElementById("budget");
const activitySelect = document.getElementById("activity");
const durationSelect = document.getElementById("duration");

const statusText = document.getElementById("generate-status");

const featuredImage = document.getElementById("featured-idea-image");
const featuredTags = document.getElementById("featured-idea-tags");
const featuredTitle = document.getElementById("featured-idea-title");
const featuredContent = document.getElementById("featured-idea-content");
const featuredEssentialsList = document.getElementById("featured-idea-essentials-list");
const featuredTip = document.getElementById("featured-idea-tip");

const savePlanBtn = document.getElementById("save-plan-btn");
const tryAnotherBtn = document.getElementById("try-another-btn");

const inspirationIdeas = document.getElementById("inspiration-ideas");

const STORAGE_KEY = "datespark.savedPlans.v1";
const IDEA_QUERY_PARAM = "idea";

const budgetAliases = {
  low: ["Free", "₦"],
  mid: ["₦₦", "₦₦₦"],
  high: ["₦₦₦₦"],
};

const activityAliases = {
  outdoor: ["Outdoor", "Active"],
  cozy: ["Cozy", "Romantic"],
  foodie: ["Foodie"],
  creative: ["Creative"],
  romantic: ["Romantic"]
};

const filterLabel = {
  duration: "duration",
  activity: "activity",
  budget: "budget",
};

let allDateIdeas = [];
let currentIdea = null;
let currentPool = [];
let activeFilters = {
  budget: "",
  activity: "",
  duration: "",
};
let inspirationModalOverlay = null;
let inspirationModalBody = null;
let inspirationModalClose = null;
let lastFocusedElement = null;

function setStatus(message) {
  if (!statusText) return;
  statusText.textContent = message || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getIdeaById(ideaId) {
  return allDateIdeas.find((idea) => String(idea.id) === String(ideaId)) || null;
}

function getIdeaIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get(IDEA_QUERY_PARAM);
}

function updateIdeaQuery(ideaId) {
  const params = new URLSearchParams(window.location.search);

  if (ideaId === null || ideaId === undefined || ideaId === "") {
    params.delete(IDEA_QUERY_PARAM);
  } else {
    params.set(IDEA_QUERY_PARAM, String(ideaId));
  }

  const queryString = params.toString();
  const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", nextUrl);
}

function ensureInspirationModal() {
  inspirationModalOverlay = document.getElementById("generate-idea-modal");

  if (!inspirationModalOverlay) {
    const modalNode = document.createElement("div");
    modalNode.id = "generate-idea-modal";
    modalNode.className = "modal-overlay";
    modalNode.setAttribute("aria-hidden", "true");
    modalNode.setAttribute("role", "dialog");
    modalNode.setAttribute("aria-modal", "true");
    modalNode.setAttribute("aria-labelledby", "generate-modal-title");
    modalNode.innerHTML = `
      <article class="modal-content card">
        <button id="generate-modal-close" class="modal-close" aria-label="Close dialog">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
        <div id="generate-modal-body"></div>
      </article>
    `;

    document.body.appendChild(modalNode);
    inspirationModalOverlay = modalNode;
  }

  inspirationModalBody = document.getElementById("generate-modal-body");
  inspirationModalClose = document.getElementById("generate-modal-close");

  if (!inspirationModalOverlay || !inspirationModalBody || !inspirationModalClose) {
    console.error("Generate inspiration modal hooks are missing.");
    return false;
  }

  if (inspirationModalOverlay.dataset.bound !== "true") {
    inspirationModalClose.addEventListener("click", () => {
      closeInspirationModal();
    });

    inspirationModalOverlay.addEventListener("click", (event) => {
      if (event.target === inspirationModalOverlay) {
        closeInspirationModal();
      }
    });

    inspirationModalOverlay.dataset.bound = "true";
  }

  return true;
}

function openInspirationModal(ideaId, options = {}) {
  const { updateQuery = true } = options;
  const selectedIdea = getIdeaById(ideaId);
  if (!selectedIdea) return;
  if (!ensureInspirationModal()) return;

  const escapedTitle = escapeHtml(selectedIdea.title);
  const escapedContent = escapeHtml(selectedIdea.content);
  const escapedImageUrl = escapeHtml(selectedIdea.imageUrl);
  const escapedImageAlt = escapeHtml(selectedIdea.imageAlt);
  const escapedCategory = escapeHtml(selectedIdea.category);
  const escapedPriceRange = escapeHtml(selectedIdea.priceRange);
  const escapedDuration = escapeHtml(selectedIdea.duration);
  const escapedEssentials = escapeHtml(selectedIdea.essentials || "None listed");
  const escapedTip = escapeHtml(selectedIdea.romanticTip || "No tip available yet.");

  inspirationModalBody.innerHTML = `
    <figure style="margin: 0;">
      <img src="${escapedImageUrl}" alt="${escapedImageAlt}" class="modal-hero">
    </figure>
    
    <div class="modal-details">
      <header>
        <div class="modal-tags">
          <span>${escapedCategory}</span>
          <span>${escapedPriceRange}</span>
        </div>
        <h2 id="generate-modal-title">${escapedTitle}</h2>
      </header>
      
      <p>${escapedContent}</p>
      
      <section class="modal-meta" aria-label="Date Details">
        <p><strong>Duration:</strong> ${escapedDuration}</p>
        <p><strong>Essentials:</strong> ${escapedEssentials}</p>
      </section>
      
      <aside class="romantic-tip" aria-label="Romantic Tip">
        <p><strong>Tip:</strong> ${escapedTip}</p>
      </aside>
    </div>
  `;

  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  inspirationModalOverlay.classList.add("active");
  inspirationModalOverlay.setAttribute("aria-hidden", "false");
  inspirationModalOverlay.dataset.ideaId = String(selectedIdea.id);
  document.body.classList.add("modal-open");

  if (updateQuery) {
    updateIdeaQuery(selectedIdea.id);
  }
}

function closeInspirationModal(options = {}) {
  const { updateQuery = true } = options;
  if (updateQuery) {
    updateIdeaQuery(null);
  }

  if (!inspirationModalOverlay || !inspirationModalOverlay.classList.contains("active")) {
    return;
  }

  inspirationModalOverlay.classList.remove("active");
  inspirationModalOverlay.setAttribute("aria-hidden", "true");
  inspirationModalOverlay.removeAttribute("data-idea-id");
  document.body.classList.remove("modal-open");

  if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
    lastFocusedElement.focus();
  }

  lastFocusedElement = null;
}

function openIdeaFromQuery() {
  const queriedIdeaId = getIdeaIdFromQuery();
  if (!queriedIdeaId) return;

  const selectedIdea = getIdeaById(queriedIdeaId);
  if (!selectedIdea) {
    updateIdeaQuery(null);
    return;
  }

  openInspirationModal(selectedIdea.id, { updateQuery: false });
}

function getDurationBucket(durationText) {
  const matches = (durationText || "").match(/\d+(?:\.\d+)?/g);
  if (!matches || matches.length === 0) return "";

  const values = matches.map(Number);
  const maxDuration = Math.max(...values);

  if (maxDuration <= 2) return "1-2";
  if (maxDuration <= 4) return "2-4";
  return "4plus";
}

function matchesBudget(idea, budgetValue) {
  if (!budgetValue) return true;
  const allowedBudget = budgetAliases[budgetValue] || [];
  return allowedBudget.includes((idea.priceRange || "").trim());
}

function matchesActivity(idea, activityValue) {
  if (!activityValue) return true;
  const allowedCategories = activityAliases[activityValue] || [];
  return allowedCategories.includes((idea.category || "").trim());
}

function matchesDuration(idea, durationValue) {
  if (!durationValue) return true;
  return getDurationBucket(idea.duration) === durationValue;
}

function filterIdeas(ideas, filters, ignoredFilters) {
  return ideas.filter((idea) => {
    if (!ignoredFilters.includes("budget") && !matchesBudget(idea, filters.budget)) {
      return false;
    }

    if (!ignoredFilters.includes("activity") && !matchesActivity(idea, filters.activity)) {
      return false;
    }

    if (!ignoredFilters.includes("duration") && !matchesDuration(idea, filters.duration)) {
      return false;
    }

    return true;
  });
}

function resolvePool(filters) {
  const ignoredFilters = [];
  let pool = filterIdeas(allDateIdeas, filters, ignoredFilters);

  if (pool.length > 0) {
    return { pool, message: "" };
  }

  const relaxedFilters = [];
  for (const filterKey of ["duration", "activity", "budget"]) {
    if (filters[filterKey]) {
      ignoredFilters.push(filterKey);
      relaxedFilters.push(filterKey);
      pool = filterIdeas(allDateIdeas, filters, ignoredFilters);
    }

    if (pool.length > 0) {
      break;
    }
  }

  if (pool.length > 0) {
    const readableRelaxed = relaxedFilters.map((key) => filterLabel[key]).join(", ");
    return {
      pool,
      message: `No exact match found. Relaxed ${readableRelaxed} filter(s).`,
    };
  }

  return {
    pool: [...allDateIdeas],
    message: "No close match found. Showing ideas from all categories.",
  };
}

function pickRandomIdea(ideas, excludeIdea) {
  if (!ideas || ideas.length === 0) return null;

  if (!excludeIdea || ideas.length === 1) {
    return ideas[Math.floor(Math.random() * ideas.length)];
  }

  const filteredIdeas = ideas.filter((idea) => idea.id !== excludeIdea.id);
  const pool = filteredIdeas.length > 0 ? filteredIdeas : ideas;

  return pool[Math.floor(Math.random() * pool.length)];
}

function shuffleIdeas(ideas) {
  const copy = [...ideas];

  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }

  return copy;
}

function getBudgetTagLabel(priceRange) {
  if (["Free", "₦"].includes(priceRange)) return "Low Cost";
  if (["₦₦", "₦₦₦"].includes(priceRange)) return "Mid Range";
  if (priceRange === "₦₦₦₦") return "High End";
  return priceRange || "Budget Friendly";
}

function getDurationTagLabel(durationText) {
  const bucket = getDurationBucket(durationText);

  if (bucket === "1-2") return "1-2 Hours";
  if (bucket === "2-4") return "2-4 Hours";
  if (bucket === "4plus") return "4+ Hours";
  return durationText || "Flexible";
}

function renderIdeaTags(idea) {
  featuredTags.innerHTML = `
    <span>${getBudgetTagLabel(idea.priceRange)}</span>
    <span>${getDurationTagLabel(idea.duration)}</span>
    <span>${idea.category}</span>
  `;
}

function renderEssentials(idea) {
  const essentials = (idea.essentials || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (essentials.length === 0) {
    featuredEssentialsList.innerHTML = "<p>Bring your favorite essentials.</p>";
    return;
  }

  featuredEssentialsList.innerHTML = essentials.map((item) => `<p>${item}</p>`).join("");
}

function renderFeaturedIdea(idea) {
  if (!idea) return;

  featuredImage.src = idea.imageUrl;
  featuredImage.alt = idea.imageAlt;

  renderIdeaTags(idea);

  featuredTitle.textContent = idea.title;
  featuredContent.textContent = idea.content;
  featuredTip.textContent = idea.romanticTip;

  renderEssentials(idea);
}

function buildInspirationCards(ideas) {
  return ideas
    .map(
      (item) => `
      <article aria-label="${escapeHtml(item.title)} idea">
        <figure>
          <img src="${escapeHtml(item.imageUrl)}" alt="${escapeHtml(item.imageAlt)}" width="400" height="280" loading="lazy" />
        </figure>

        <p aria-label="Idea categories">
          <span>${escapeHtml(item.category)}</span>
          <span>${escapeHtml(item.priceRange)}</span>
        </p>

        <h3>${escapeHtml(item.title)}</h3>
        <a href="browse.html?idea=${encodeURIComponent(item.id)}" data-action="view-details" data-id="${escapeHtml(item.id)}">View Details</a>
      </article>
    `
    )
    .join("");
}

function renderInspirationIdeas(featuredIdea) {
  if (!inspirationIdeas) return;

  let sourceIdeas = allDateIdeas.filter((idea) => idea.id !== featuredIdea.id);

  if (sourceIdeas.length < 4) {
    sourceIdeas = [...allDateIdeas];
  }

  const selectedIdeas = shuffleIdeas(sourceIdeas).slice(0, 4);

  if (selectedIdeas.length === 0) return;

  inspirationIdeas.innerHTML = buildInspirationCards(selectedIdeas);
}

function toSavableIdea(idea) {
  return {
    id: idea.id,
    title: idea.title,
    content: idea.content,
    imageUrl: idea.imageUrl,
    imageAlt: idea.imageAlt,
    priceRange: idea.priceRange,
    category: idea.category,
    duration: idea.duration,
    essentials: idea.essentials,
    romanticTip: idea.romanticTip,
    savedAt: new Date().toISOString(),
  };
}

function getSavedIdeas() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Could not read saved plans:", error);
    return [];
  }
}

function flashSaveButton(label) {
  if (!savePlanBtn) return;

  const originalLabel = "Save to My Plans";
  savePlanBtn.textContent = label;
  savePlanBtn.disabled = true;

  window.setTimeout(() => {
    savePlanBtn.textContent = originalLabel;
    savePlanBtn.disabled = false;
  }, 1200);
}

function saveCurrentIdea() {
  if (!currentIdea) {
    setStatus("Generate an idea before saving.");
    return;
  }

  const savedIdeas = getSavedIdeas();
  const alreadySaved = savedIdeas.some((idea) => idea.id === currentIdea.id);

  if (alreadySaved) {
    flashSaveButton("Already Saved");
    setStatus("This date idea is already in your saved plans.");
    return;
  }

  savedIdeas.push(toSavableIdea(currentIdea));

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedIdeas));
    flashSaveButton("Saved");
    setStatus("Date idea saved to My Plans.");
  } catch (error) {
    console.error("Could not save plan:", error);
    setStatus("Could not save right now. Please try again.");
  }
}

function getSelectedFilters() {
  return {
    budget: budgetSelect.value,
    activity: activitySelect.value,
    duration: durationSelect.value,
  };
}

function generateIdeaFromFilters() {
  if (allDateIdeas.length === 0) {
    setStatus("Could not load new ideas yet.");
    return;
  }

  activeFilters = getSelectedFilters();
  const { pool, message } = resolvePool(activeFilters);

  currentPool = pool;

  const nextIdea = pickRandomIdea(currentPool, currentIdea);

  if (!nextIdea) {
    setStatus("No ideas available right now.");
    return;
  }

  currentIdea = nextIdea;
  renderFeaturedIdea(currentIdea);
  renderInspirationIdeas(currentIdea);

  if (message) {
    setStatus(message);
  } else {
    setStatus("");
  }
}

function tryAnotherIdea() {
  if (allDateIdeas.length === 0) {
    setStatus("Could not load new ideas yet.");
    return;
  }

  if (currentPool.length === 0) {
    const { pool } = resolvePool(activeFilters);
    currentPool = pool;
  }

  const nextIdea = pickRandomIdea(currentPool, currentIdea);

  if (!nextIdea) {
    setStatus("No other ideas found. Try updating your filters.");
    return;
  }

  if (currentIdea && currentPool.length === 1 && nextIdea.id === currentIdea.id) {
    setStatus("Only one idea matches these filters. Try changing filters for more options.");
    return;
  }

  currentIdea = nextIdea;
  renderFeaturedIdea(currentIdea);
  renderInspirationIdeas(currentIdea);
  setStatus("");
}

function attachEventListeners() {
  generateForm.addEventListener("submit", (event) => {
    event.preventDefault();
    generateIdeaFromFilters();
  });

  tryAnotherBtn.addEventListener("click", tryAnotherIdea);
  savePlanBtn.addEventListener("click", saveCurrentIdea);

  inspirationIdeas?.addEventListener("click", (event) => {
    const detailsLink = event.target.closest('a[data-action="view-details"][data-id]');
    if (!detailsLink) return;

    event.preventDefault();
    const ideaId = detailsLink.getAttribute("data-id");
    if (!ideaId) return;

    openInspirationModal(ideaId);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && inspirationModalOverlay?.classList.contains("active")) {
      closeInspirationModal();
    }
  });
}

function initializeGenerator() {
  if (
    !generateForm ||
    !budgetSelect ||
    !activitySelect ||
    !durationSelect ||
    !featuredImage ||
    !featuredTags ||
    !featuredTitle ||
    !featuredContent ||
    !featuredEssentialsList ||
    !featuredTip ||
    !savePlanBtn ||
    !tryAnotherBtn
  ) {
    console.error("Generate page hooks are missing. Could not initialize generator.");
    return;
  }

  attachEventListeners();
  ensureInspirationModal();

  fetch("../data/dateIdeas.json")
    .then((res) => res.json())
    .then((data) => {
      allDateIdeas = data;

      if (!Array.isArray(allDateIdeas) || allDateIdeas.length === 0) {
        console.error("No date ideas found in data/dateIdeas.json");
        return;
      }

      currentPool = [...allDateIdeas];
      currentIdea = pickRandomIdea(currentPool, null);

      renderFeaturedIdea(currentIdea);
      renderInspirationIdeas(currentIdea);
      openIdeaFromQuery();
      setStatus("");
    })
    .catch((err) => {
      console.error("Failed to load generated date ideas:", err);
    });
}

initializeGenerator();
