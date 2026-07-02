/**
 * Standing Ovation Cleaning Company - Main JavaScript
 * Pure vanilla JS, no dependencies.
 */

document.addEventListener('DOMContentLoaded', () => {

  // -------------------------------------------------------
  // 1. Mobile Hamburger Menu Toggle
  // -------------------------------------------------------

  const menuToggle = document.querySelector('.mobile-menu-toggle');
  const mainNav = document.getElementById('main-nav');

  /** Open or close the mobile menu. */
  const toggleMenu = (forceClose = false) => {
    if (!menuToggle || !mainNav) return;

    const shouldOpen = forceClose ? false : !mainNav.classList.contains('active');

    mainNav.classList.toggle('active', shouldOpen);
    menuToggle.classList.toggle('active', shouldOpen);
    menuToggle.setAttribute('aria-expanded', String(shouldOpen));

    // Prevent body scroll while menu is open
    document.body.style.overflow = shouldOpen ? 'hidden' : '';
  };

  if (menuToggle) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
    });
  }

  // Close menu when clicking a nav link
  if (mainNav) {
    mainNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        if (mainNav.classList.contains('active')) {
          toggleMenu(true);
        }
      });
    });
  }

  // Close menu when clicking outside the nav
  document.addEventListener('click', (e) => {
    if (
      mainNav &&
      mainNav.classList.contains('active') &&
      !mainNav.contains(e.target) &&
      !menuToggle.contains(e.target)
    ) {
      toggleMenu(true);
    }
  });

  // Close menu on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && mainNav && mainNav.classList.contains('active')) {
      toggleMenu(true);
      menuToggle.focus(); // return focus to the toggle button
    }
  });

  // -------------------------------------------------------
  // 2. Smooth Scrolling for Anchor Links
  // -------------------------------------------------------

  const getHeaderHeight = () => {
    const header = document.querySelector('.site-header');
    return header ? header.getBoundingClientRect().height : 0;
  };

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');

      // Skip bare "#" links (e.g. the Home / logo links)
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      const offset = getHeaderHeight() + 16; // 16px breathing room
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top, behavior: 'smooth' });

      // Close mobile menu if open
      if (mainNav && mainNav.classList.contains('active')) {
        toggleMenu(true);
      }
    });
  });

  // -------------------------------------------------------
  // 3. Submenu Dropdown on Mobile
  // -------------------------------------------------------

  const MOBILE_BREAKPOINT = 991;

  document.querySelectorAll('.has-submenu').forEach((item) => {
    const parentLink = item.querySelector(':scope > a');
    const submenu = item.querySelector('.submenu');

    if (!parentLink || !submenu) return;

    parentLink.addEventListener('click', (e) => {
      // Only handle on mobile
      if (window.innerWidth > MOBILE_BREAKPOINT) return;

      e.preventDefault();
      const isOpen = submenu.classList.contains('open');

      // Close any other open submenus first
      document.querySelectorAll('.submenu.open').forEach((s) => {
        if (s !== submenu) s.classList.remove('open');
      });

      submenu.classList.toggle('open', !isOpen);
    });
  });

  // -------------------------------------------------------
  // 4. Carousel Auto-Scroll
  // -------------------------------------------------------

  const carouselTrack = document.querySelector('.carousel-track');

  if (carouselTrack) {
    let autoScrollInterval = null;
    let resumeTimeout = null;
    const AUTO_SCROLL_DELAY = 4000; // 4 seconds between scrolls
    const RESUME_DELAY = 3000;      // 3 seconds after interaction

    /** Scroll to the next card, or wrap to the start. */
    const scrollNext = () => {
      const card = carouselTrack.querySelector('.carousel-card');
      if (!card) return;

      const cardWidth = card.offsetWidth;
      const gap = parseInt(getComputedStyle(carouselTrack).gap, 10) || 0;
      const scrollStep = cardWidth + gap;
      const maxScroll = carouselTrack.scrollWidth - carouselTrack.clientWidth;

      if (carouselTrack.scrollLeft >= maxScroll - 2) {
        // Wrap to the beginning
        carouselTrack.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        carouselTrack.scrollBy({ left: scrollStep, behavior: 'smooth' });
      }
    };

    const startAutoScroll = () => {
      if (autoScrollInterval) return;
      autoScrollInterval = setInterval(scrollNext, AUTO_SCROLL_DELAY);
    };

    const stopAutoScroll = () => {
      clearInterval(autoScrollInterval);
      autoScrollInterval = null;
      clearTimeout(resumeTimeout);
    };

    const pauseAndResume = () => {
      stopAutoScroll();
      resumeTimeout = setTimeout(startAutoScroll, RESUME_DELAY);
    };

    // Pause on hover
    carouselTrack.addEventListener('mouseenter', stopAutoScroll);
    carouselTrack.addEventListener('mouseleave', () => {
      resumeTimeout = setTimeout(startAutoScroll, RESUME_DELAY);
    });

    // Pause on touch
    carouselTrack.addEventListener('touchstart', stopAutoScroll, { passive: true });
    carouselTrack.addEventListener('touchend', pauseAndResume, { passive: true });

    // Pause when user manually scrolls
    carouselTrack.addEventListener('scroll', () => {
      if (autoScrollInterval) pauseAndResume();
    }, { passive: true });

    // Kick things off
    startAutoScroll();
  }

  // -------------------------------------------------------
  // 5. Sticky Header Shadow on Scroll
  // -------------------------------------------------------

  const siteHeader = document.querySelector('.site-header');

  if (siteHeader) {
    const SCROLL_THRESHOLD = 50;

    /** Debounced scroll handler for the header shadow. */
    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      ticking = true;

      requestAnimationFrame(() => {
        siteHeader.classList.toggle('scrolled', window.scrollY > SCROLL_THRESHOLD);
        ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // Run once on load in case the page is already scrolled
    onScroll();
  }

  // -------------------------------------------------------
  // 6. Intersection Observer - Active Nav Link Highlighting
  // -------------------------------------------------------

  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.main-nav .nav-list a[href^="#"]');

  if (sections.length && navLinks.length) {
    const observerOptions = {
      root: null,
      rootMargin: `-${getHeaderHeight() + 20}px 0px -40% 0px`,
      threshold: 0
    };

    /** Set the active class on the matching nav link. */
    const setActiveLink = (id) => {
      navLinks.forEach((link) => {
        const href = link.getAttribute('href');
        link.classList.toggle('active', href === `#${id}`);
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    }, observerOptions);

    sections.forEach((section) => observer.observe(section));
  }

  // -------------------------------------------------------
  // 7. Gallery Filter Buttons
  // -------------------------------------------------------

  const filterBtns = document.querySelectorAll('.filter-btn');
  const galleryItems = document.querySelectorAll('.gallery-item');

  if (filterBtns.length && galleryItems.length) {
    filterBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        // Update active state on buttons
        filterBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        // Show or hide items based on selected filter
        galleryItems.forEach((item) => {
          if (filter === 'all' || item.getAttribute('data-category') === filter) {
            item.removeAttribute('hidden');
            item.classList.remove('hidden');
          } else {
            item.setAttribute('hidden', '');
            item.classList.add('hidden');
          }
        });
      });
    });
  }

  // -------------------------------------------------------
  // 8. Gallery Lightbox
  // -------------------------------------------------------

  const lightboxOverlay = document.querySelector('.lightbox-overlay');

  if (lightboxOverlay && galleryItems.length) {
    const lightboxImg = lightboxOverlay.querySelector('.lightbox-content img');
    const lightboxClose = lightboxOverlay.querySelector('.lightbox-close');
    const lightboxPrev = lightboxOverlay.querySelector('.lightbox-prev');
    const lightboxNext = lightboxOverlay.querySelector('.lightbox-next');
    let currentIndex = -1;

    /** Return only visible (not hidden) gallery items. */
    const getVisibleItems = () => {
      return Array.from(document.querySelectorAll('.gallery-item:not([hidden]):not(.hidden)'));
    };

    /** Open the lightbox at a given index within visible items. */
    const openLightbox = (index) => {
      const items = getVisibleItems();
      if (index < 0 || index >= items.length) return;

      currentIndex = index;
      const img = items[index].querySelector('img');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
      lightboxOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
      lightboxClose.focus();
    };

    /** Close the lightbox and restore scrolling. */
    const closeLightbox = () => {
      lightboxOverlay.classList.remove('active');
      document.body.style.overflow = '';
      lightboxImg.src = '';
    };

    /** Navigate prev (-1) or next (+1) through visible items. */
    const navigateLightbox = (direction) => {
      const items = getVisibleItems();
      if (!items.length) return;
      currentIndex = (currentIndex + direction + items.length) % items.length;
      const img = items[currentIndex].querySelector('img');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt;
    };

    // Click a gallery item to open lightbox
    galleryItems.forEach((item) => {
      item.addEventListener('click', () => {
        const items = getVisibleItems();
        const idx = items.indexOf(item);
        if (idx !== -1) openLightbox(idx);
      });
    });

    // Close button
    lightboxClose.addEventListener('click', closeLightbox);

    // Prev / Next buttons
    lightboxPrev.addEventListener('click', () => navigateLightbox(-1));
    lightboxNext.addEventListener('click', () => navigateLightbox(1));

    // Click on overlay background (not the image or controls) to close
    lightboxOverlay.addEventListener('click', (e) => {
      if (e.target === lightboxOverlay) closeLightbox();
    });

    // Keyboard navigation (Escape, ArrowLeft, ArrowRight)
    document.addEventListener('keydown', (e) => {
      if (!lightboxOverlay.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') navigateLightbox(-1);
      if (e.key === 'ArrowRight') navigateLightbox(1);
    });
  }

  // -------------------------------------------------------
  // 9. Form Submission Success Message
  // -------------------------------------------------------

  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('submitted') === 'true') {
    const successMsg = document.getElementById('form-success');
    const form = document.querySelector('.contact-form, .booking-form');
    if (successMsg && form) {
      form.style.display = 'none';
      successMsg.style.display = 'block';
      // Scroll to the success message
      successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

});
