/* ==========================================================
   IRON PULSE — Interactions
   ========================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const header = document.getElementById('header');
    const burger = document.getElementById('burger');
    const nav = document.getElementById('nav');
    const navLinks = document.querySelectorAll('.nav__link');

    /* ---------- Menu burger (mobile) ---------- */
    const toggleMenu = (forceClose = false) => {
        const isOpen = forceClose ? false : !nav.classList.contains('open');
        nav.classList.toggle('open', isOpen);
        burger.classList.toggle('active', isOpen);
        document.body.classList.toggle('menu-open', isOpen);
        burger.setAttribute('aria-expanded', isOpen);
        burger.setAttribute('aria-label', isOpen ? 'Fermer le menu' : 'Ouvrir le menu');
    };

    burger.addEventListener('click', () => toggleMenu());

    // Ferme le menu au clic sur un lien
    navLinks.forEach(link => {
        link.addEventListener('click', () => toggleMenu(true));
    });

    // Ferme le menu avec la touche Échap
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && nav.classList.contains('open')) toggleMenu(true);
    });

    // Ferme le menu si on repasse en affichage bureau
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768 && nav.classList.contains('open')) toggleMenu(true);
    });

    /* ---------- En-tête au défilement ---------- */
    const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    /* ---------- Lien actif selon la section visible ---------- */
    const sections = document.querySelectorAll('section[id], footer[id]');
    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            navLinks.forEach(link => {
                link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
            });
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(section => sectionObserver.observe(section));

    /* ---------- Apparition des éléments au défilement ---------- */
    const revealObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('visible');
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach((el, i) => {
        el.style.transitionDelay = `${(i % 4) * 0.1}s`;
        revealObserver.observe(el);
    });

    /* ---------- Compteurs animés ---------- */
    const animateCounter = el => {
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '+';
        const duration = 1600;
        const start = performance.now();

        const step = now => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.floor(eased * target) + (progress === 1 ? suffix : '');
            if (progress < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

    const counterObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            animateCounter(entry.target);
            counterObserver.unobserve(entry.target);
        });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach(el => counterObserver.observe(el));

    /* ---------- Année du pied de page ---------- */
    document.getElementById('year').textContent = new Date().getFullYear();
});
