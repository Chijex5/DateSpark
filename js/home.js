const track = document.getElementById("experience");
const prevBtn = document.querySelector('[aria-label="Previous experiences"]');
const nextBtn = document.querySelector('[aria-label="Next experiences"]');

// Build one card from a JSON item
function createCard(item) {
  return `
    <article class="experience-card card">
      <figure class="experience-media card-media">
        <img src="${item.imageUrl}" alt="${item.imageAlt}" loading="lazy" />
      </figure>
      <p class="experience-tags tag-list">
        <span>${item.category}</span>
        <span>${item.priceRange}</span>
      </p>
      <h3 class="experience-title">${item.title}</h3>
      <p class="experience-text">${item.content}</p>
    </article>
  `;
}

// Fetch JSON and render cards
fetch("../data/dateIdeas.json")
  .then((res) => res.json())
  .then((experiences) => {
    track.innerHTML = experiences.map(createCard).join("");
    initCarousel();
  })
  .catch((err) => {
    console.error("Could not load experiences:", err);
    // Static cards in the HTML remain as fallback
    initCarousel();
  });

// Carousel behaviour 
function initCarousel() {
  function getScrollAmount() {
    const card = track.querySelector(".experience-card");
    if (!card) return 320;
    const gap = parseFloat(getComputedStyle(track).gap) || 0;
    return card.offsetWidth + gap;
  }

  function updateButtons() {
    const maxScroll = track.scrollWidth - track.clientWidth;
    prevBtn.disabled = track.scrollLeft <= 2;
    nextBtn.disabled = track.scrollLeft >= maxScroll - 2;
  }

  function scrollBy(direction) {
    track.scrollBy({ left: direction * getScrollAmount(), behavior: "smooth" });
  }

  prevBtn.addEventListener("click", () => scrollBy(-1));
  nextBtn.addEventListener("click", () => scrollBy(1));
  track.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons, { passive: true });

  /* Drag to scroll */
  let isDown = false, startX = 0, scrollStart = 0;

  track.addEventListener("pointerdown", (e) => {
    isDown = true;
    startX = e.clientX;
    scrollStart = track.scrollLeft;
    track.style.cursor = "grabbing";
    track.setPointerCapture(e.pointerId);
  });

  track.addEventListener("pointermove", (e) => {
    if (!isDown) return;
    track.scrollLeft = scrollStart + (startX - e.clientX);
  });

  ["pointerup", "pointercancel"].forEach((evt) =>
    track.addEventListener(evt, () => {
      isDown = false;
      track.style.cursor = "";
      updateButtons();
    })
  );

// Arrow key support
  track.setAttribute("tabindex", "0");
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft")  { e.preventDefault(); scrollBy(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); scrollBy(1);  }
  });

  updateButtons();
}