const plansTabs = document.getElementById("plans-tabs");
const tabUpcoming = document.getElementById("tab-upcoming");
const tabCompleted = document.getElementById("tab-completed");
const upcomingCount = document.getElementById("upcoming-count");
const completedCount = document.getElementById("completed-count");

const plansSearchForm = document.getElementById("plans-search-form");
const planSearchInput = document.getElementById("plan-search");
const plansStatus = document.getElementById("plans-status");

const plansGrid = document.getElementById("plans-grid");

const STORAGE_KEY = "datespark.savedPlans.v1";
const TAB_UPCOMING = "upcoming";
const TAB_COMPLETED = "completed";
const PLAN_QUERY_PARAM = "plan";

let allPlans = [];
let activeTab = TAB_UPCOMING;
let searchTerm = "";
let detailsModalOverlay = null;
let detailsModalBody = null;
let detailsModalClose = null;
let lastFocusedElement = null;

function setStatus(message) {
  if (!plansStatus) return;
  plansStatus.textContent = message || "";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatPlanDate(isoString) {
  const timestamp = Date.parse(isoString || "");
  if (Number.isNaN(timestamp)) return "Unknown";

  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function normalizePlan(plan) {
  return {
    id: plan.id,
    title: plan.title || "Untitled Date Plan",
    content: plan.content || "No description available.",
    imageUrl: plan.imageUrl || "",
    imageAlt: plan.imageAlt || "Saved date plan image",
    priceRange: plan.priceRange || "Flexible",
    category: plan.category || "Date",
    duration: plan.duration || "Flexible",
    essentials: plan.essentials || "",
    romanticTip: plan.romanticTip || "",
    savedAt: plan.savedAt || new Date().toISOString(),
    isCompleted: Boolean(plan.isCompleted),
    completedAt: plan.isCompleted ? plan.completedAt || null : null,
  };
}

function getStoredPlans() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((plan) => plan && typeof plan === "object" && plan.id !== undefined && plan.id !== null)
      .map(normalizePlan);
  } catch (error) {
    console.error("Could not load saved plans:", error);
    setStatus("Could not read saved plans. Showing an empty list.");
    return [];
  }
}

function savePlans(plans) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
    return true;
  } catch (error) {
    console.error("Could not save plans:", error);
    setStatus("Could not save your changes. Please try again.");
    return false;
  }
}

function getPlanTimestamp(plan) {
  const time = Date.parse(plan.savedAt || "");
  return Number.isNaN(time) ? 0 : time;
}

function sortPlans(plans) {
  return [...plans].sort((a, b) => getPlanTimestamp(b) - getPlanTimestamp(a));
}

function isVisibleForTab(plan) {
  if (activeTab === TAB_COMPLETED) {
    return plan.isCompleted;
  }

  return !plan.isCompleted;
}

function matchesSearch(plan, term) {
  if (!term) return true;

  const text = [
    plan.title,
    plan.content,
    plan.category,
    plan.essentials,
    plan.romanticTip,
  ]
    .join(" ")
    .toLowerCase();

  return text.includes(term);
}

function getVisiblePlans() {
  const filtered = allPlans
    .filter(isVisibleForTab)
    .filter((plan) => matchesSearch(plan, searchTerm));

  return sortPlans(filtered);
}

function getCounts(plans) {
  return plans.reduce(
    (counts, plan) => {
      if (plan.isCompleted) {
        counts.completed += 1;
      } else {
        counts.upcoming += 1;
      }

      return counts;
    },
    { upcoming: 0, completed: 0 }
  );
}

function renderCounts() {
  const counts = getCounts(allPlans);

  upcomingCount.textContent = `(${counts.upcoming})`;
  completedCount.textContent = `(${counts.completed})`;

  upcomingCount.setAttribute("aria-label", `${counts.upcoming} upcoming plans`);
  completedCount.setAttribute("aria-label", `${counts.completed} completed plans`);
}

function renderTabState() {
  tabUpcoming.classList.toggle("plans-tab-active", activeTab === TAB_UPCOMING);
  tabCompleted.classList.toggle("plans-tab-active", activeTab === TAB_COMPLETED);

  if (activeTab === TAB_UPCOMING) {
    tabUpcoming.setAttribute("aria-current", "page");
    tabCompleted.removeAttribute("aria-current");
    plansGrid.setAttribute("aria-label", "Upcoming plans");
  } else {
    tabCompleted.setAttribute("aria-current", "page");
    tabUpcoming.removeAttribute("aria-current");
    plansGrid.setAttribute("aria-label", "Completed plans");
  }
}

function createEmptyStateCard() {
  return `
    <article class="plan-card card" aria-label="No saved plans">
      <h2 class="plan-title">No saved plans yet</h2>
      <p>Save ideas from the Generate page and they will appear here.</p>
      <div class="plan-actions" aria-label="Empty state actions">
        <a href="generate.html" class="plan-link">Go to Generate</a>
      </div>
    </article>
  `;
}

function createNoResultsCard() {
  const tabLabel = activeTab === TAB_UPCOMING ? "upcoming" : "completed";
  const escapedSearchTerm = escapeHtml(searchTerm);
  const message = searchTerm
    ? `No ${tabLabel} plans match "${escapedSearchTerm}".`
    : `No ${tabLabel} plans available.`;

  return `
    <article class="plan-card card" aria-label="No matching plans">
      <h2 class="plan-title">No matching plans</h2>
      <p>${message}</p>
      <div class="plan-actions" aria-label="No result actions">
        <a href="generate.html" class="plan-link">Find New Ideas</a>
      </div>
    </article>
  `;
}

function getPlanById(planId) {
  return allPlans.find((plan) => String(plan.id) === String(planId)) || null;
}

function getPlanIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  return params.get(PLAN_QUERY_PARAM);
}

function updatePlanQuery(planId) {
  const params = new URLSearchParams(window.location.search);

  if (planId === null || planId === undefined || planId === "") {
    params.delete(PLAN_QUERY_PARAM);
  } else {
    params.set(PLAN_QUERY_PARAM, String(planId));
  }

  const queryString = params.toString();
  const nextUrl = `${window.location.pathname}${queryString ? `?${queryString}` : ""}${window.location.hash}`;
  window.history.replaceState({}, "", nextUrl);
}

function ensureDetailsModal() {
  detailsModalOverlay = document.getElementById("plan-details-modal");

  if (!detailsModalOverlay) {
    const modalNode = document.createElement("div");
    modalNode.id = "plan-details-modal";
    modalNode.className = "modal-overlay";
    modalNode.setAttribute("aria-hidden", "true");
    modalNode.setAttribute("role", "dialog");
    modalNode.setAttribute("aria-modal", "true");
    modalNode.setAttribute("aria-labelledby", "plan-details-title");
    modalNode.innerHTML = `
      <article class="modal-content card plan-details-modal-content">
        <button id="plan-details-close" class="modal-close" aria-label="Close plan details dialog">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M18 6 6 18"/>
            <path d="m6 6 12 12"/>
          </svg>
        </button>
        <div id="plan-details-body"></div>
      </article>
    `;

    document.body.appendChild(modalNode);
    detailsModalOverlay = modalNode;
  }

  detailsModalBody = document.getElementById("plan-details-body");
  detailsModalClose = document.getElementById("plan-details-close");

  if (!detailsModalOverlay || !detailsModalBody || !detailsModalClose) {
    console.error("Plan details modal hooks are missing.");
    return false;
  }

  if (detailsModalOverlay.dataset.bound !== "true") {
    detailsModalClose.addEventListener("click", () => {
      closePlanDetailsModal();
    });

    detailsModalOverlay.addEventListener("click", (event) => {
      if (event.target === detailsModalOverlay) {
        closePlanDetailsModal();
      }
    });

    detailsModalOverlay.dataset.bound = "true";
  }

  return true;
}

function openPlanDetailsModal(planId, options = {}) {
  const { updateQuery = true } = options;
  const targetPlan = getPlanById(planId);
  if (!targetPlan) return;
  if (!ensureDetailsModal()) return;

  const escapedTitle = escapeHtml(targetPlan.title);
  const escapedContent = escapeHtml(targetPlan.content);
  const escapedCategory = escapeHtml(targetPlan.category);
  const escapedPriceRange = escapeHtml(targetPlan.priceRange);
  const escapedDuration = escapeHtml(targetPlan.duration);
  const escapedEssentials = escapeHtml(targetPlan.essentials || "None listed");
  const escapedTip = escapeHtml(targetPlan.romanticTip || "No tip available yet.");
  const escapedImageAlt = escapeHtml(targetPlan.imageAlt);
  const escapedImageUrl = escapeHtml(targetPlan.imageUrl);
  const savedAt = formatPlanDate(targetPlan.savedAt);
  const completedAt = targetPlan.completedAt ? formatPlanDate(targetPlan.completedAt) : "Not yet";
  const statusLabel = targetPlan.isCompleted ? "Completed" : "Upcoming";
  const statusClass = targetPlan.isCompleted ? "plan-status-done" : "plan-status-upcoming";

  detailsModalBody.innerHTML = `
    <figure style="margin: 0;">
      <img src="${escapedImageUrl}" alt="${escapedImageAlt}" class="modal-hero">
    </figure>

    <div class="modal-details">
      <header>
        <div class="modal-tags">
          <span>${escapedCategory}</span>
          <span>${escapedPriceRange}</span>
          <span>${escapedDuration}</span>
        </div>
        <p class="plan-status-badge ${statusClass}">${statusLabel}</p>
        <h2 id="plan-details-title">${escapedTitle}</h2>
      </header>

      <p>${escapedContent}</p>

      <section class="modal-meta plan-details-meta" aria-label="Plan details">
        <p><strong>Saved:</strong> ${savedAt}</p>
        <p><strong>Completed:</strong> ${completedAt}</p>
        <p><strong>Essentials:</strong> ${escapedEssentials}</p>
      </section>

      <aside class="romantic-tip" aria-label="Romantic Tip">
        <p><strong>Tip:</strong> ${escapedTip}</p>
      </aside>
    </div>
  `;

  lastFocusedElement = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  detailsModalOverlay.dataset.planId = String(targetPlan.id);
  detailsModalOverlay.classList.add("active");
  detailsModalOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");

  if (updateQuery) {
    updatePlanQuery(targetPlan.id);
  }
}

function closePlanDetailsModal(options = {}) {
  const { updateQuery = true } = options;
  if (updateQuery) {
    updatePlanQuery(null);
  }

  if (!detailsModalOverlay || !detailsModalOverlay.classList.contains("active")) {
    return;
  }

  detailsModalOverlay.classList.remove("active");
  detailsModalOverlay.setAttribute("aria-hidden", "true");
  detailsModalOverlay.removeAttribute("data-plan-id");
  document.body.classList.remove("modal-open");

  if (lastFocusedElement && document.body.contains(lastFocusedElement)) {
    lastFocusedElement.focus();
  }

  lastFocusedElement = null;
}

function openPlanFromQuery() {
  const queriedPlanId = getPlanIdFromQuery();
  if (!queriedPlanId) return;

  const targetPlan = getPlanById(queriedPlanId);
  if (!targetPlan) {
    updatePlanQuery(null);
    return;
  }

  activeTab = targetPlan.isCompleted ? TAB_COMPLETED : TAB_UPCOMING;
  renderPage();
  openPlanDetailsModal(targetPlan.id, { updateQuery: false });
}

function createPlanCard(plan) {
  const completeLabel = plan.isCompleted ? "Mark Upcoming" : "Mark Completed";
  const escapedId = escapeHtml(plan.id);
  const escapedTitle = escapeHtml(plan.title);
  const escapedContent = escapeHtml(plan.content);
  const escapedImageUrl = escapeHtml(plan.imageUrl);
  const escapedImageAlt = escapeHtml(plan.imageAlt);
  const escapedCategory = escapeHtml(plan.category);
  const escapedPriceRange = escapeHtml(plan.priceRange);
  const escapedDuration = escapeHtml(plan.duration);

  return `
    <article class="plan-card card" data-id="${escapedId}">
      <figure class="plan-media card-media">
        <img
          src="${escapedImageUrl}"
          alt="${escapedImageAlt}"
          width="600"
          height="360"
          loading="lazy"
        />
      </figure>

      <button type="button" aria-label="Remove ${escapedTitle}" class="plan-remove" data-action="remove-plan">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 6h18"/>
          <path d="M8 6V4h8v2"/>
          <path d="M19 6l-1 14H6L5 6"/>
          <path d="M10 11v6"/>
          <path d="M14 11v6"/>
        </svg>
        <span>Remove</span>
      </button>

      <h2 class="plan-title">${escapedTitle}</h2>

      <p aria-label="Plan tags" class="plan-tags tag-list">
        <span>${escapedCategory}</span>
        <span>${escapedPriceRange}</span>
        <span>${escapedDuration}</span>
      </p>

      <p>${escapedContent}</p>

        <div aria-label="Plan actions" class="plan-actions">
          <button type="button" class="plan-link" data-action="view-details">View Details</button>
          <button type="button" class="plan-done" data-action="toggle-complete">${completeLabel}</button>
        </div>
    </article>
  `;
}

function renderPlansGrid() {
  if (allPlans.length === 0) {
    plansGrid.innerHTML = createEmptyStateCard();
    return;
  }

  const visiblePlans = getVisiblePlans();

  if (visiblePlans.length === 0) {
    plansGrid.innerHTML = createNoResultsCard();
    return;
  }

  plansGrid.innerHTML = visiblePlans.map(createPlanCard).join("");
  }

  function renderPage() {
  renderCounts();
  renderTabState();
  renderPlansGrid();
}

function togglePlanCompletion(planId) {
  allPlans = allPlans.map((plan) => {
    if (String(plan.id) !== planId) return plan;

    const nextCompleted = !plan.isCompleted;

    return {
      ...plan,
      isCompleted: nextCompleted,
      completedAt: nextCompleted ? new Date().toISOString() : null,
    };
  });

  if (savePlans(allPlans)) {
    setStatus("Plan status updated.");
    renderPage();
  }
}

function removePlan(planId) {
  const targetPlan = getPlanById(planId);
  if (!targetPlan) return;

  const shouldRemove = window.confirm(`Remove "${targetPlan.title}" from My Plans?`);
  if (!shouldRemove) return;

  const previousLength = allPlans.length;
  allPlans = allPlans.filter((plan) => String(plan.id) !== planId);

  if (allPlans.length === previousLength) return;

  if (savePlans(allPlans)) {
    if (detailsModalOverlay?.dataset.planId === String(planId)) {
      closePlanDetailsModal();
    }

    setStatus("Plan removed from My Plans.");
    renderPage();
  }
}

function setActiveTab(tab) {
  if (tab !== TAB_UPCOMING && tab !== TAB_COMPLETED) return;

  activeTab = tab;
  setStatus("");
  renderPage();
}

function attachEventListeners() {
  plansTabs.addEventListener("click", (event) => {
    const tabButton = event.target.closest("button[data-tab]");
    if (!tabButton) return;

    setActiveTab(tabButton.getAttribute("data-tab"));
  });

  plansSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
  });

  planSearchInput.addEventListener("input", () => {
    searchTerm = planSearchInput.value.trim().toLowerCase();
    renderPlansGrid();
  });

  plansGrid.addEventListener("click", (event) => {
    const actionButton = event.target.closest("button[data-action]");
    if (!actionButton) return;

    const planCard = actionButton.closest(".plan-card");
    if (!planCard) return;

    const planId = planCard.getAttribute("data-id");
    if (!planId) return;

    const action = actionButton.getAttribute("data-action");

    if (action === "view-details") {
      openPlanDetailsModal(planId);
      return;
    }

    if (action === "toggle-complete") {
      togglePlanCompletion(planId);
      return;
    }

    if (action === "remove-plan") {
      removePlan(planId);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && detailsModalOverlay?.classList.contains("active")) {
      closePlanDetailsModal();
    }
  });
}

function initializeMyPlans() {
  if (
    !plansTabs ||
    !tabUpcoming ||
    !tabCompleted ||
    !upcomingCount ||
    !completedCount ||
    !plansSearchForm ||
    !planSearchInput ||
    !plansStatus ||
    !plansGrid
  ) {
    console.error("My Plans page hooks are missing. Could not initialize plans.");
    return;
  }

  ensureDetailsModal();
  attachEventListeners();

  allPlans = getStoredPlans();
  renderPage();
  openPlanFromQuery();
}

initializeMyPlans();
