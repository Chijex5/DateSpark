# DateSpark ✨

**Team Members:** Grace Olabode & Chijioke Uzodinma

**Live Site URL:** https://date-spark-lovat.vercel.app/

**Presentation Link:** 

---

## Case Study Summary

DateSpark solves date planning fatigue by providing instant and personalized date ideas filtered by budget, type, and duration. Targeted at couples aged 25-45, the platform helps maintain relationship excitement through curated experiences.

**Core Features:**
- Date generator with filters (budget/type/duration)
- Personal library to save and track dates
- Browse curated categories

---

## CSS Design System

DateSpark uses a comprehensive CSS custom properties system for maintainable and consistent styling across all pages.

### Typography
**Playfair Display** (serif) for headings and **Inter** (sans-serif) for body text. Responsive sizing with fluid hero text scaling between 2.2rem–3.2rem.

### Colors
**Brand:** Rose/pink palette with `--color-brand-600` (#E11D48) as primary, darker shades for links/headings, lighter tints for backgrounds.  
**Neutrals:** Warm cream background (`--color-bg-cream`), white surfaces, gray text tones.  
**Overlays:** Brand-tinted transparencies for gradients and frosted glass effects.

### Spacing
8-point system with `--space-4` (16px) as base, scaling from 4px to 64px with fine-tuned intermediate values.

### Shadows
Component-specific: `--shadow-card` for standard cards, `--shadow-primary-btn` for CTAs, `--shadow-feature-card` for prominent elements. Hover states intensify shadows.

### Radius & Motion
`--radius-lg` (1rem) for cards, `--radius-full` for pills. Transitions use `--duration-fast` (0.15s) or `--duration-medium` (0.2s).

### Backgrounds
Layered radial gradients create romantic atmospheres. Pages use dual gradients over rose bases, hero sections overlay white gradients on images.

---

## JavaScript Implementation & Logic Flow

DateSpark uses vanilla JavaScript to handle state, data fetching, and DOM manipulation. The application relies on a local JSON file (`dateIdeas.json`) as a read-only database and utilizes the browser's `localStorage` to persist user-specific data.

### 1. Generate Flow (`generate.js`)
The core feature of the app dynamically filters and selects date ideas based on user input.
* **Data Fetching:** On page load, the app fetches `dateIdeas.json` and stores it in memory.
* **User Input & Filtering:** When the user submits the form, JS reads the `budget`, `activity`, and `duration` preferences. It maps these inputs to data aliases (e.g., mapping a "low" budget to "Free" and "₦").
* **Resolution Logic:** The JS filters the array of ideas. If no exact match is found, the system implements a "relaxation" fallback, systematically ignoring filters (first duration, then activity, then budget) until a pool of viable ideas is found, ensuring the user never hits a dead end.
* **Selection & Rendering:** A random idea is picked from the resolved pool and injected into the DOM. Additional random ideas are shuffled and rendered as "inspiration cards."
* **Persistence:** Clicking "Save to My Plans" packages the current idea into an object with a timestamp and pushes it to `localStorage`.

### 2. My Plans Flow (`my-plans.js`)
This page acts as the user's personal dashboard and it manages saved states.
* **Data Retrieval:** On initialization, JS parses the `datespark.savedPlans.v1` array from `localStorage`. 
* **State Management:** The data is split into "Upcoming" and "Completed" views based on an `isCompleted` boolean property.
* **User Interactions:** * **Search:** Typing in the search bar dynamically filters the displayed grid by matching the input string against titles, content, and tags.
    * **Toggle/Remove:** Clicking "Mark Completed" or "Remove" mutates the specific object within the array, overwrites `localStorage` with the updated array, and immediately re-renders the DOM to reflect the new state.

### 3. Browse Flow (`browse.js`)
Provides a categorized library of all available experiences.
* **Initialization:** Fetches the JSON data and renders the entire list as a grid of cards.
* **Filtering:** Clicking category buttons filters the array by the `category` string and updates the DOM grid.
* **Modal & Deep Linking:** Clicking an idea opens a dynamically populated modal. The app actively updates the URL parameter (`?idea=ID`) when a modal is opened, allowing users to share direct links to specific date ideas.

### 4. Home Page Flow (`home.js`)
Handles landing page interactivity.
* **Carousel:** Fetches the JSON data to populate the "Curated Experiences" track, implementing custom drag-to-scroll and button-click horizontal scrolling logic.
* **Form Validation:** Intercepts the newsletter subscription submission, runs a strict Regular Expression check on the email format, simulates a network delay, and toggles DOM text to display success/error states without page reloads.

---

## Project Links

- **Case Study Document:** https://docs.google.com/document/d/1tHve7CsD9D6dTgPMSRubQRcTPnC0W4qeCIg-JEmx1dk/edit?usp=sharing
- **Design System Document:** https://docs.google.com/document/d/1-u5192GngomLsibRUiVEgM_cRI_Ylro0jkZNV8637IA/edit?usp=sharing
- **Contribution Sheet:** https://docs.google.com/spreadsheets/d/1FSdq-cqXdRekEZIyM0pM_wvPRan7m7D5k2QOV2yXyig/edit?usp=sharing

---

## Case Study Links

- **Chijioke Uzodinma:** https://dev.to/chijioke_uzodinma_d6ae6ef/building-datespark-a-simple-date-planning-website-31lc
- **Grace Olabode:** https://dev.to/grace_olabode_3be546efe9b/building-datespark-a-date-planning-app-for-couples-2d46

---

