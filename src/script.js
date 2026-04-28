document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
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
