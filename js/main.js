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

});
