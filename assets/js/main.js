// Weave Graph - Main UI Script

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Drawer Toggle
  const menuToggle = document.querySelector('.mobile-menu-toggle, .mobile-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      navLinks.classList.toggle('active');
      const isExpanded = navLinks.classList.contains('active');
      menuToggle.setAttribute('aria-expanded', isExpanded);
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !menuToggle.contains(e.target)) {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 2. Navbar Scroll Dynamic Backdrop Effect
  const navbar = document.querySelector('.navbar, .site-header');
  if (navbar) {
    const checkScroll = () => {
      if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    };
    window.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
  }

  // 3. Highlight Current Page Link in Nav (Handles both /page and /page.html)
  const currentPath = (window.location.pathname.split('/').pop() || 'index').replace(/\.html$/, '');
  document.querySelectorAll('.nav-links a, .nav-link').forEach(link => {
    const href = (link.getAttribute('href') || '').split('/').pop().replace(/\.html$/, '') || 'index';
    if (href === currentPath) {
      link.classList.add('active');
    }
  });
});
