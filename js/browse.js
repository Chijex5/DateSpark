const grid = document.getElementById("browse-grid");
const filterBtns = document.querySelectorAll(".filter-btn");

// Modal Elements
const modalOverlay = document.getElementById("idea-modal");
const modalBody = document.getElementById("modal-body");
const modalClose = document.getElementById("modal-close");

let allDateIdeas = [];

function getIdeaIdFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const rawId = params.get("idea");
  if (!rawId) return null;

  const parsedId = parseInt(rawId, 10);
  return Number.isNaN(parsedId) ? null : parsedId;
}

// Render the grid cards
function renderCards(ideas) {
  const titleHtml = `<h2 class="browse-grid-title" id="curated-title">Curated Date Experiences</h2>`;
  
  if (ideas.length === 0) {
    grid.innerHTML = titleHtml + `<p style="grid-column: 1/-1; text-align: center;">No date ideas found for this category yet.</p>`;
    return;
  }

  const cardsHtml = ideas.map(item => `
    <article class="browse-card card" data-id="${item.id}" tabindex="0" role="button">
      <picture class="browse-media card-media">
        <img src="${item.imageUrl}" alt="${item.imageAlt}" loading="lazy">
      </picture>
      <p class="browse-tags tag-list">
        <span>${item.category}</span>
        <span>${item.priceRange}</span>
      </p>
      <h3>${item.title}</h3>
      <p>${item.content}</p>
    </article>
  `).join("");

  grid.innerHTML = titleHtml + cardsHtml;
}

// Fetch the JSON data
fetch("../data/dateIdeas.json")
  .then((res) => res.json())
  .then((data) => {
    allDateIdeas = data;
    renderCards(allDateIdeas);
    openIdeaFromQuery();
  })
  .catch((err) => console.error("Failed to load date ideas:", err));

// Filter logic
filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const selectedCategory = btn.getAttribute("data-category");
    
    if (selectedCategory === "All") {
      renderCards(allDateIdeas);
    } else {
      const filteredIdeas = allDateIdeas.filter(
        idea => idea.category.toLowerCase() === selectedCategory.toLowerCase()
      );
      renderCards(filteredIdeas);
    }
  });
});

function openModal(idea) {
  modalBody.innerHTML = `
    <figure style="margin: 0;">
      <img src="${idea.imageUrl}" alt="${idea.imageAlt}" class="modal-hero">
    </figure>
    
    <div class="modal-details">
      <header>
        <div class="modal-tags">
          <span>${idea.category}</span>
          <span>${idea.priceRange}</span>
        </div>
        <h2 id="modal-title">${idea.title}</h2>
      </header>
      
      <p>${idea.content}</p>
      
      <section class="modal-meta" aria-label="Date Details">
        <p><strong>Duration:</strong> ${idea.duration}</p>
        <p><strong>Essentials:</strong> ${idea.essentials}</p>
      </section>
      
      <aside class="romantic-tip" aria-label="Romantic Tip">
        <p><strong>Tip:</strong> ${idea.romanticTip}</p>
      </aside>
    </div>
  `;
  
  // Show the modal and lock the background scroll
  modalOverlay.classList.add("active");
  document.body.classList.add("modal-open");
}

function openIdeaFromQuery() {
  const ideaId = getIdeaIdFromQuery();
  if (!ideaId) return;

  const selectedIdea = allDateIdeas.find((idea) => idea.id === ideaId);
  if (!selectedIdea) {
    console.warn(`Idea id ${ideaId} not found in browse data.`);
    return;
  }

  openModal(selectedIdea);

  const matchingCard = grid.querySelector(`.browse-card[data-id="${ideaId}"]`);
  if (matchingCard) {
    matchingCard.focus();
  }
}

function closeModal() {
  modalOverlay.classList.remove("active");
  document.body.classList.remove("modal-open");
}

// Event Listeners for Opening Modal
grid.addEventListener("click", (e) => {
  const card = e.target.closest(".browse-card");
  if (card) {
    const ideaId = parseInt(card.getAttribute("data-id"));
    const selectedIdea = allDateIdeas.find(idea => idea.id === ideaId);
    if (selectedIdea) {
      openModal(selectedIdea);
    }
  }
});

// Allows opening of cards with the Enter key for accessibility
grid.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const card = e.target.closest(".browse-card");
    if (card) {
      const ideaId = parseInt(card.getAttribute("data-id"));
      const selectedIdea = allDateIdeas.find(idea => idea.id === ideaId);
      if (selectedIdea) {
        openModal(selectedIdea);
      }
    }
  }
});

// Event Listeners for Closing Modal
modalClose.addEventListener("click", closeModal);

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) {
    closeModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalOverlay.classList.contains("active")) {
    closeModal();
  }
});
