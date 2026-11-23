(() => {
  "use strict";

  const header = document.querySelector(".site-header");
  const navigation = document.querySelector(".primary-navigation");
  const navigationList = document.querySelector(".navigation-list");
  const reservationForm = document.querySelector(".reservation-form");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  const announce = (message, className = "site-notice") => {
    const notice = document.createElement("div");
    notice.className = className;
    notice.setAttribute("role", "status");
    notice.setAttribute("aria-live", "polite");
    notice.textContent = message;
    document.body.append(notice);
    return notice;
  };

  const getHeaderOffset = () => (header?.getBoundingClientRect().height ?? 0) + 12;

  const scrollToElement = (target) => {
    const top = target.getBoundingClientRect().top + window.scrollY - getHeaderOffset();
    window.scrollTo({ top, behavior: reducedMotion.matches ? "auto" : "smooth" });
  };

  /* Add an accessible mobile toggle because the supplied markup has no menu button. */
  let menuButton = navigation?.querySelector(".menu-toggle");
  if (navigation && navigationList && !menuButton) {
    menuButton = document.createElement("button");
    menuButton.className = "menu-toggle";
    menuButton.type = "button";
    menuButton.setAttribute("aria-label", "Open navigation menu");
    menuButton.setAttribute("aria-expanded", "false");
    menuButton.setAttribute("aria-controls", "primary-navigation-list");
    menuButton.innerHTML = '<span aria-hidden="true"></span><span aria-hidden="true"></span><span aria-hidden="true"></span>';
    navigationList.id ||= "primary-navigation-list";
    navigation.insertBefore(menuButton, navigationList);
  }

  const setMenuOpen = (isOpen) => {
    if (!menuButton || !navigation) return;
    menuButton.setAttribute("aria-expanded", String(isOpen));
    menuButton.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    navigation.classList.toggle("is-open", isOpen);
    if (navigationList && window.matchMedia("(max-width: 760px)").matches) {
      navigationList.hidden = !isOpen;
    }
  };

  const mobileNavigationQuery = window.matchMedia("(max-width: 760px)");
  const syncNavigationLayout = () => {
    if (!menuButton || !navigationList) return;
    menuButton.hidden = !mobileNavigationQuery.matches;
    navigationList.hidden = mobileNavigationQuery.matches && menuButton.getAttribute("aria-expanded") !== "true";
  };
  syncNavigationLayout();
  mobileNavigationQuery.addEventListener("change", syncNavigationLayout);

  menuButton?.addEventListener("click", () => {
    setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("click", (event) => {
    if (navigation && menuButton?.getAttribute("aria-expanded") === "true" && !navigation.contains(event.target)) {
      setMenuOpen(false);
    }
  });

  navigation?.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (link) setMenuOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton?.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      menuButton.focus();
    }
  });

  /* Smooth in-page navigation and sticky-header offset. */
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const hash = link.getAttribute("href");
    if (!hash || hash === "#") return;

    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;

    event.preventDefault();
    history.pushState(null, "", hash);
    scrollToElement(target);
  });

  const sectionLinks = [...document.querySelectorAll('.navigation-list a[href^="#"]')];
  const sections = sectionLinks
    .map((link) => document.getElementById(link.getAttribute("href").slice(1)))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const activeSectionObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;

      sectionLinks.forEach((link) => {
        const isCurrent = link.hash === `#${visible.target.id}`;
        if (isCurrent) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: `-${Math.ceil(getHeaderOffset())}px 0px -55% 0px`, threshold: [0, 0.15, 0.4] });

    sections.forEach((section) => activeSectionObserver.observe(section));
  }

  /* Lightweight scroll state for the sticky header and back-to-top control. */
  let backToTop = document.querySelector(".back-to-top");
  if (!backToTop && document.querySelector(".site-footer")) {
    backToTop = document.createElement("button");
    backToTop.className = "back-to-top";
    backToTop.type = "button";
    backToTop.setAttribute("aria-label", "Back to top");
    backToTop.textContent = "↑";
    document.body.append(backToTop);
  }

  const updateScrollState = () => {
    const hasScrolled = window.scrollY > 24;
    header?.classList.toggle("is-scrolled", hasScrolled);
    if (backToTop) {
      backToTop.classList.toggle("is-visible", window.scrollY > 450);
      backToTop.setAttribute("aria-hidden", String(window.scrollY <= 450));
      backToTop.tabIndex = window.scrollY > 450 ? 0 : -1;
    }
  };

  window.addEventListener("scroll", updateScrollState, { passive: true });
  updateScrollState();

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? "auto" : "smooth" });
  });

  /* Add category controls to the existing four menu category articles. */
  const menuGrid = document.querySelector(".menu-grid");
  const menuCategories = menuGrid ? [...menuGrid.querySelectorAll(".menu-category")] : [];
  if (menuGrid && menuCategories.length) {
    const filterBar = document.createElement("div");
    filterBar.className = "menu-filters";
    filterBar.setAttribute("role", "group");
    filterBar.setAttribute("aria-label", "Filter menu categories");

    const categories = ["All", ...menuCategories.map((category) => category.querySelector("h3")?.textContent.trim()).filter(Boolean)];
    categories.forEach((categoryName, index) => {
      const button = document.createElement("button");
      button.className = "menu-filter-button";
      button.type = "button";
      button.textContent = categoryName;
      button.dataset.category = categoryName;
      button.setAttribute("aria-pressed", String(index === 0));
      if (index === 0) button.classList.add("is-active");
      filterBar.append(button);
    });

    menuGrid.before(filterBar);
    filterBar.addEventListener("click", (event) => {
      const button = event.target.closest(".menu-filter-button");
      if (!button) return;
      const selected = button.dataset.category;
      filterBar.querySelectorAll(".menu-filter-button").forEach((filterButton) => {
        const isActive = filterButton === button;
        filterButton.classList.toggle("is-active", isActive);
        filterButton.setAttribute("aria-pressed", String(isActive));
      });
      menuCategories.forEach((category) => {
        const categoryName = category.querySelector("h3")?.textContent.trim();
        category.hidden = selected !== "All" && categoryName !== selected;
      });
    });
  }

  /* Form validation uses native constraints plus friendly inline messages. */
  if (reservationForm) {
    const dateInput = reservationForm.querySelector('input[type="date"]');
    const phoneInput = reservationForm.querySelector('input[type="tel"]');
    const emailInput = reservationForm.querySelector('input[type="email"]');
    const submitButton = reservationForm.querySelector('button[type="submit"]');

    if (dateInput) {
      const localToday = new Date();
      const year = localToday.getFullYear();
      const month = String(localToday.getMonth() + 1).padStart(2, "0");
      const day = String(localToday.getDate()).padStart(2, "0");
      dateInput.min = `${year}-${month}-${day}`;
    }

    const getErrorElement = (field) => {
      let error = field.parentElement?.querySelector(".field-error");
      if (!error && field.parentElement) {
        error = document.createElement("p");
        error.className = "field-error";
        error.id = `${field.id || field.name || "reservation-field"}-error`;
        error.setAttribute("aria-live", "polite");
        field.parentElement.append(error);
      }
      return error;
    };

    const setFieldError = (field, message = "") => {
      const error = getErrorElement(field);
      if (!error) return;
      error.textContent = message;
      field.setAttribute("aria-invalid", String(Boolean(message)));
      const describedBy = new Set((field.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean));
      if (message) describedBy.add(error.id);
      else describedBy.delete(error.id);
      if (describedBy.size) field.setAttribute("aria-describedby", [...describedBy].join(" "));
      else field.removeAttribute("aria-describedby");
    };

    const validateField = (field) => {
      let message = "";
      const value = field.value.trim();

      if (field.required && !value) {
        message = "Please complete this field.";
      } else if (field === emailInput && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        message = "Please enter a valid email address.";
      } else if (field === phoneInput && value) {
        const digits = value.replace(/\D/g, "");
        if (digits.length < 7 || digits.length > 15 || !/^[+()\d\s.-]+$/.test(value)) {
          message = "Please enter a valid phone number.";
        }
      } else if (field === dateInput && value && value < dateInput.min) {
        message = "Please choose today or a future date.";
      } else if (!field.checkValidity()) {
        message = field.validationMessage || "Please check this field.";
      }

      setFieldError(field, message);
      return !message;
    };

    const fields = [...reservationForm.querySelectorAll("input, select, textarea")];
    fields.forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") validateField(field);
      });
      field.addEventListener("change", () => {
        if (field.getAttribute("aria-invalid") === "true") validateField(field);
      });
    });

    reservationForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const valid = fields.map(validateField).every(Boolean);
      if (!valid) {
        reservationForm.querySelector('[aria-invalid="true"]')?.focus();
        return;
      }

      const successNotice = announce(
        "Thank you! Your reservation details passed this demo form. No reservation has been sent or stored. Please call Velora to confirm your table.",
        "site-notice site-notice-success"
      );
      successNotice.tabIndex = -1;
      successNotice.focus({ preventScroll: true });
      reservationForm.reset();
      fields.forEach((field) => setFieldError(field));
      if (submitButton) submitButton.blur();
      window.setTimeout(() => successNotice.remove(), 8000);
    });
  }

  /* Subtle entrance treatment; content remains visible without observer support. */
  if (!reducedMotion.matches && "IntersectionObserver" in window) {
    const revealTargets = document.querySelectorAll(
      ".content-section, .dish-card, .menu-category, .benefit-card, .testimonial-card"
    );
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -35px 0px" });

    revealTargets.forEach((element) => {
      element.classList.add("will-reveal");
      revealObserver.observe(element);
    });
  }

  /* Delegate future favorite controls if they are added to a dish card. */
  document.addEventListener("click", (event) => {
    const favoriteButton = event.target.closest(".favorite-button");
    if (!favoriteButton) return;
    const isFavorite = favoriteButton.getAttribute("aria-pressed") !== "true";
    favoriteButton.setAttribute("aria-pressed", String(isFavorite));
    favoriteButton.classList.toggle("is-favorite", isFavorite);
    favoriteButton.setAttribute("aria-label", isFavorite ? "Remove from favorites" : "Add to favorites");
  });

  /* Update the copyright year without changing the HTML structure. */
  const copyright = document.querySelector(".footer-bottom p");
  if (copyright) copyright.textContent = copyright.textContent.replace(/\b\d{4}\b/, String(new Date().getFullYear()));
})();
