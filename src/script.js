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

  document.querySelectorAll("[data-quote-form]").forEach((form) => {
    const status = form.querySelector("[data-form-status]");
    const submitButton = form.querySelector('button[type="submit"]');

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());
      const attachment = form.querySelector('input[type="file"][name="attachment"]');

      if (attachment && attachment.files && attachment.files[0]) {
        payload.attachmentName = attachment.files[0].name;
      }

      if (status) {
        status.textContent = "Sending your quote request...";
        status.classList.remove("is-error", "is-success");
      }

      if (submitButton) {
        submitButton.disabled = true;
      }

      try {
        const response = await fetch("/api/send-quote", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(result.error || "We could not send your request right now.");
        }

        form.reset();
        if (status) {
          status.textContent = result.message || "Your request has been sent. We will reply shortly.";
          status.classList.add("is-success");
        }
      } catch (error) {
        if (status) {
          status.textContent = error.message || "There was a problem sending your request.";
          status.classList.add("is-error");
        }
      } finally {
        if (submitButton) {
          submitButton.disabled = false;
        }
      }
    });
  });

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
