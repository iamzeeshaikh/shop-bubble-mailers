document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const productsToggle = document.querySelector("[data-products-toggle]");
  const productsMenu = document.querySelector("[data-products-menu]");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  if (productsToggle && productsMenu) {
    productsToggle.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = productsMenu.classList.toggle("is-open");
      productsToggle.setAttribute("aria-expanded", String(isOpen));
    });

    document.addEventListener("click", (event) => {
      if (!productsMenu.contains(event.target) && !productsToggle.contains(event.target)) {
        productsMenu.classList.remove("is-open");
        productsToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.querySelectorAll(".faq-item").forEach((item, index) => {
    const button = item.querySelector(".faq-question");
    if (!button) return;

    if (index === 0) {
      item.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
    } else {
      button.setAttribute("aria-expanded", "false");
    }

    button.addEventListener("click", () => {
      const isOpen = item.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
    });
  });

  const yearTarget = document.querySelector("[data-current-year]");
  if (yearTarget) {
    yearTarget.textContent = String(new Date().getFullYear());
  }
});
