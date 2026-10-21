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

    /* ---------- Calculateur de calories et macros ---------- */
    const calcForm = document.getElementById('calc-form');
    if (calcForm) initCalculator(calcForm);

    /* ---------- Année du pied de page ---------- */
    document.getElementById('year').textContent = new Date().getFullYear();
});

/* ==========================================================
   CALCULATEUR
   Métabolisme de base : formule de Mifflin-St Jeor.
   Tout est calculé localement, rien n'est envoyé.
   ========================================================== */

const CALC_STORAGE_KEY = 'ironpulse-calculateur';

// Réglages par objectif : ajustement calorique et grammes par kg de poids de corps
const OBJECTIFS = {
    masse:    { label: 'Prise de masse', ajustement: 300,  proteines: 2.0, lipides: 0.9 },
    seche:    { label: 'Perte de gras',  ajustement: -400, proteines: 2.2, lipides: 0.8 },
    maintien: { label: 'Maintien',       ajustement: 0,    proteines: 1.8, lipides: 0.9 }
};

const LIMITES = {
    age:    { min: 15,  max: 80,  nom: "l'âge" },
    poids:  { min: 35,  max: 250, nom: 'le poids' },
    taille: { min: 130, max: 230, nom: 'la taille' }
};

const formatNombre = n => Math.round(n).toLocaleString('fr-FR');

function calculerBesoins({ sexe, age, poids, taille, activite, objectif }) {
    const reglages = OBJECTIFS[objectif];
    const bmr = 10 * poids + 6.25 * taille - 5 * age + (sexe === 'homme' ? 5 : -161);
    const tdee = bmr * activite;

    // On ne descend jamais sous le métabolisme de base
    const cibleBrute = tdee + reglages.ajustement;
    const cible = Math.max(cibleBrute, bmr);

    const proteines = poids * reglages.proteines;
    const lipides = poids * reglages.lipides;
    const glucides = Math.max((cible - proteines * 4 - lipides * 9) / 4, 0);

    return { bmr, tdee, cible, plafonne: cible > cibleBrute, proteines, lipides, glucides, reglages };
}

function initCalculator(form) {
    const $ = id => document.getElementById(id);
    const errorEl = $('calc-error');
    const emptyEl = $('calc-empty');
    const outputEl = $('calc-output');
    let dejaCalcule = false;

    const lireValeurs = () => {
        const data = new FormData(form);
        return {
            sexe: data.get('sexe'),
            age: parseFloat(data.get('age')),
            poids: parseFloat(data.get('poids')),
            taille: parseFloat(data.get('taille')),
            activite: parseFloat(data.get('activite')),
            objectif: data.get('objectif')
        };
    };

    // Renvoie un message d'erreur, ou une chaîne vide si tout est valide
    const valider = valeurs => {
        let erreur = '';
        for (const [champ, { min, max, nom }] of Object.entries(LIMITES)) {
            const v = valeurs[champ];
            const invalide = Number.isNaN(v) || v < min || v > max;
            form.elements[champ].classList.toggle('invalid', invalide);
            if (invalide && !erreur) erreur = `Vérifie ${nom} : la valeur doit être comprise entre ${min} et ${max}.`;
        }
        return erreur;
    };

    const afficher = valeurs => {
        const r = calculerBesoins(valeurs);
        const kcal = { proteines: r.proteines * 4, glucides: r.glucides * 4, lipides: r.lipides * 9 };
        const total = kcal.proteines + kcal.glucides + kcal.lipides;
        const pourcent = k => (total ? Math.round((k / total) * 100) : 0);

        $('res-bmr').textContent = formatNombre(r.bmr);
        $('res-tdee').textContent = formatNombre(r.tdee);
        $('res-target').textContent = formatNombre(r.cible);
        $('res-target-label').textContent = `Objectif — ${r.reglages.label}`;

        const ajustement = r.reglages.ajustement;
        $('res-target-hint').textContent = r.plafonne
            ? 'Limité à ton métabolisme de base pour préserver ta santé.'
            : ajustement === 0
                ? 'Égal à ta dépense journalière.'
                : `${ajustement > 0 ? '+' : '−'}${Math.abs(ajustement)} kcal par rapport à ta dépense journalière.`;

        $('res-prot').textContent = formatNombre(r.proteines);
        $('res-carbs').textContent = formatNombre(r.glucides);
        $('res-fat').textContent = formatNombre(r.lipides);

        $('info-prot').textContent = `${r.reglages.proteines.toLocaleString('fr-FR')} g / kg • ${formatNombre(kcal.proteines)} kcal • ${pourcent(kcal.proteines)} %`;
        $('info-carbs').textContent = `Le reste de tes calories • ${formatNombre(kcal.glucides)} kcal • ${pourcent(kcal.glucides)} %`;
        $('info-fat').textContent = `${r.reglages.lipides.toLocaleString('fr-FR')} g / kg • ${formatNombre(kcal.lipides)} kcal • ${pourcent(kcal.lipides)} %`;

        // Largeur des barres appliquée après l'affichage pour déclencher l'animation
        emptyEl.hidden = true;
        outputEl.hidden = false;
        requestAnimationFrame(() => {
            $('bar-prot').style.width = `${pourcent(kcal.proteines)}%`;
            $('bar-carbs').style.width = `${pourcent(kcal.glucides)}%`;
            $('bar-fat').style.width = `${pourcent(kcal.lipides)}%`;
        });
    };

    const sauvegarder = valeurs => {
        try { localStorage.setItem(CALC_STORAGE_KEY, JSON.stringify(valeurs)); } catch (e) { /* stockage indisponible */ }
    };

    const restaurer = () => {
        let valeurs = null;
        try { valeurs = JSON.parse(localStorage.getItem(CALC_STORAGE_KEY)); } catch (e) { /* stockage indisponible */ }
        if (!valeurs) return;

        ['age', 'poids', 'taille', 'activite'].forEach(champ => {
            if (valeurs[champ] != null && !Number.isNaN(valeurs[champ])) form.elements[champ].value = valeurs[champ];
        });
        ['sexe', 'objectif'].forEach(champ => {
            const radio = form.querySelector(`input[name="${champ}"][value="${valeurs[champ]}"]`);
            if (radio) radio.checked = true;
        });

        if (!valider(lireValeurs())) {
            afficher(lireValeurs());
            dejaCalcule = true;
        }
    };

    form.addEventListener('submit', e => {
        e.preventDefault();
        const valeurs = lireValeurs();
        const erreur = valider(valeurs);
        errorEl.textContent = erreur;
        if (erreur) return;

        afficher(valeurs);
        sauvegarder(valeurs);
        dejaCalcule = true;

        // Sur mobile, les résultats sont sous le formulaire : on les fait apparaître
        if (window.innerWidth < 961) {
            document.getElementById('calc-results').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // Une fois un premier calcul fait, les résultats suivent les modifications en direct
    form.addEventListener('input', () => {
        if (!dejaCalcule) return;
        const valeurs = lireValeurs();
        const erreur = valider(valeurs);
        errorEl.textContent = erreur;
        if (erreur) return;
        afficher(valeurs);
        sauvegarder(valeurs);
    });

    restaurer();
}
