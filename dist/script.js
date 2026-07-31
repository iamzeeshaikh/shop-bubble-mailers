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


  /* ── Configurator ───────────────────────────────────────────────────────
     Keeps the summary and price estimate in step with the option buttons, and
     writes the finished spec into hidden fields so the existing quote endpoint
     receives it like any other submission. */
  document.querySelectorAll("[data-configurator]").forEach((form) => {
    const LABELS = {
      size: "Size",
      material: "Material",
      closure: "Closure",
      printing: "Printing",
      quantity: "Quantity",
      addOn: "Add-ons"
    };
    const QTY_SCALE = [
      [50000, 0.72],
      [25000, 0.8],
      [10000, 0.9],
      [5000, 1],
      [2500, 1.15],
      [1000, 1.35],
      [500, 1.6],
      [250, 1.9],
      [1, 2.3]
    ];

    const estimate = form.querySelector("[data-estimate]");
    const specField = form.querySelector("[data-spec-field]");
    const qtyField = form.querySelector("[data-qty-field]");
    const sizeField = form.querySelector("[data-size-field]");
    const notes = form.querySelector("[data-notes]");
    const customQty = form.querySelector("[data-custom-qty]");
    const dims = form.querySelector("[data-dims]");
    const dimsWrap = form.querySelector("[data-custom-size]");
    const fileInput = form.querySelector(".cfg-file");
    const uploadLabel = form.querySelector("[data-upload-label]");

    const chosen = {};
    const picks = (group) => chosen[group] || [];

    const quantity = () => {
      const typed = Number(String(customQty && customQty.value ? customQty.value : "").replace(/[^0-9]/g, ""));
      if (typed > 0) return typed;
      const picked = picks("quantity")[0];
      return picked ? Number(picked.dataset.value) : 0;
    };

    const priceOf = (group) =>
      picks(group).reduce((total, node) => total + Number(node.dataset.price || 0), 0);

    const labelFor = (group) => {
      if (group === "quantity") {
        const count = quantity();
        return count > 0 ? count.toLocaleString("en-US") + " units" : "";
      }
      const labels = picks(group).map((node) => node.dataset.label || "");
      if (group === "size" && labels[0] && dims && dims.value.trim()) {
        return labels[0] + " (" + dims.value.trim() + ")";
      }
      return labels.join(", ");
    };

    const money = (value) =>
      value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

    const currentRange = () => {
      const count = quantity();
      const material = priceOf("material");
      if (!material || !count) return "";
      const scaleRow = QTY_SCALE.find((row) => count >= row[0]);
      const scale = scaleRow ? scaleRow[1] : 2.3;
      const unit = (material + priceOf("closure") + priceOf("printing") + priceOf("addOn")) * scale;
      const total = unit * count;
      return money(total * 0.88) + " – " + money(total * 1.14);
    };

    const refresh = () => {
      Object.keys(LABELS).forEach((group) => {
        const cell = form.querySelector('[data-summary="' + group + '"]');
        if (!cell) return;
        const value = labelFor(group);
        cell.textContent = value || (group === "addOn" ? "None" : "Not selected");
        cell.dataset.empty = value ? "false" : "true";
      });

      const artworkCell = form.querySelector('[data-summary="artwork"]');
      const file = fileInput && fileInput.files ? fileInput.files[0] : null;
      if (artworkCell) {
        artworkCell.textContent = file ? file.name : "Not attached";
        artworkCell.dataset.empty = file ? "false" : "true";
      }

      const range = currentRange();
      if (estimate) estimate.textContent = range || "Select material & quantity";

      const lines = Object.keys(LABELS).map((group) => LABELS[group] + ": " + (labelFor(group) || "Not selected"));
      lines.push("Estimated budget: " + (range || "pending review"));
      const extra = notes && notes.value.trim();
      if (extra) lines.push("Notes: " + extra);
      if (specField) specField.value = lines.join("\n");
      if (qtyField) qtyField.value = labelFor("quantity") || "Not selected";
      if (sizeField) sizeField.value = labelFor("size") || "Not selected";
    };

    form.querySelectorAll(".cfg-option, .cfg-pill").forEach((button) => {
      button.addEventListener("click", () => {
        const group = button.dataset.group;
        const fieldset = button.closest("[data-mode]");
        const multi = fieldset && fieldset.dataset.mode === "multi";
        const wasOn = button.getAttribute("aria-pressed") === "true";

        if (!multi && fieldset) {
          fieldset.querySelectorAll(".cfg-option, .cfg-pill").forEach((sibling) => {
            sibling.setAttribute("aria-pressed", "false");
          });
        }
        button.setAttribute("aria-pressed", wasOn ? "false" : "true");

        const scope = fieldset || form;
        chosen[group] = Array.prototype.slice.call(scope.querySelectorAll('[aria-pressed="true"]'));

        if (group === "quantity" && customQty) customQty.value = "";
        if (group === "size" && dimsWrap) {
          dimsWrap.hidden = !(button.dataset.value === "custom" && !wasOn);
        }
        refresh();
      });
    });

    if (customQty) {
      customQty.addEventListener("input", () => {
        if (customQty.value.trim()) {
          form.querySelectorAll('.cfg-pill[aria-pressed="true"]').forEach((pill) => {
            pill.setAttribute("aria-pressed", "false");
          });
          chosen.quantity = [];
        }
        refresh();
      });
    }

    if (dims) dims.addEventListener("input", refresh);
    if (notes) notes.addEventListener("input", refresh);
    if (fileInput) {
      fileInput.addEventListener("change", () => {
        const file = fileInput.files && fileInput.files[0];
        if (uploadLabel) {
          uploadLabel.textContent = file
            ? file.name
            : "Upload artwork (optional) — PDF, AI, EPS, PNG, JPG";
        }
        refresh();
      });
    }

    refresh();
  });

  const yearTarget = document.querySelector("[data-current-year]");
  if (yearTarget) {
    yearTarget.textContent = String(new Date().getFullYear());
  }
});
