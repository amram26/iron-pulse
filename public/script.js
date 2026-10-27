/* ==========================================================
   IRON PULSE — Interactions
   ========================================================== */

/* ---------- Application installable et hors ligne ---------- */
// Le service worker (sw.js) ne fonctionne qu'en http(s), pas en ouvrant le fichier en local
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => { /* le site reste utilisable sans */ });
    });
}

// Met en réserve des photos pour le hors ligne, sans ralentir la page ni consommer en mode économie de données
function prechargerPhotos(urls) {
    if (!('serviceWorker' in navigator) || !location.protocol.startsWith('http')) return;
    if (navigator.connection?.saveData) return;
    navigator.serviceWorker.ready.then(inscription => {
        setTimeout(() => inscription.active?.postMessage({ type: 'precharger', urls: [...new Set(urls)] }), 3000);
    });
}

// Android / Chrome : on garde l'invitation du navigateur pour l'afficher via notre bouton
let invitationInstallation = null;
window.addEventListener('beforeinstallprompt', evenement => {
    evenement.preventDefault();
    invitationInstallation = evenement;
    const bouton = document.getElementById('install-btn');
    if (bouton) bouton.hidden = false;
});

window.addEventListener('appinstalled', () => {
    invitationInstallation = null;
    const bouton = document.getElementById('install-btn');
    if (bouton) bouton.hidden = true;
});

document.addEventListener('DOMContentLoaded', () => {
    /* ---------- Bouton « Installer l'application » ---------- */
    const boutonInstaller = document.getElementById('install-btn');
    boutonInstaller?.addEventListener('click', async () => {
        if (!invitationInstallation) return;
        invitationInstallation.prompt();
        await invitationInstallation.userChoice;
        invitationInstallation = null;
        boutonInstaller.hidden = true;
    });

    // iPhone : pas d'invitation automatique, on explique comment ajouter l'icône
    const estIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const dejaInstallee = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (estIOS && !dejaInstallee) document.getElementById('install-ios')?.removeAttribute('hidden');
});

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
    // Seuls les liens internes (#ancre) suivent le défilement ; ceux vers une autre page gardent leur état
    const anchorLinks = [...navLinks].filter(link => link.getAttribute('href').startsWith('#'));
    const sections = document.querySelectorAll('section[id], footer[id]');
    const sectionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            anchorLinks.forEach(link => {
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
        const suffix = el.dataset.suffix ?? '+';
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

    /* ---------- Carrousels (mobile) ---------- */
    document.querySelectorAll('[data-carousel]').forEach(initCarrousel);

    /* ---------- Barre d'accès rapide (mobile) ---------- */
    // Sur les autres pages (sans data-cible), l'onglet actif est fixé dans le HTML
    const onglets = [...document.querySelectorAll('.tabbar__link[data-cible]')];
    if (onglets.length) {
        const cibles = onglets.map(lien => document.getElementById(lien.dataset.cible));
        let enAttente = false;

        // L'onglet actif est la dernière zone dont le haut a dépassé 40 % de l'écran
        const majOnglets = () => {
            enAttente = false;
            const ligne = window.innerHeight * 0.4;
            let actif = 0;
            cibles.forEach((cible, i) => {
                if (cible && cible.getBoundingClientRect().top <= ligne) actif = i;
            });
            onglets.forEach((lien, i) => lien.classList.toggle('active', i === actif));
        };

        window.addEventListener('scroll', () => {
            if (enAttente) return;
            enAttente = true;
            requestAnimationFrame(majOnglets);
        }, { passive: true });
        majOnglets();
    }

    /* ---------- Journée type (nutrition) ---------- */
    document.querySelectorAll('input[name="journee"]').forEach(radio => {
        radio.addEventListener('change', () => {
            document.querySelectorAll('.day__panel').forEach(panel => {
                panel.hidden = panel.dataset.journee !== radio.value;
            });
        });
    });

    document.querySelectorAll('.day__panel').forEach(initJournee);

    /* ---------- Recherche d'aliments ---------- */
    const champAliment = document.getElementById('aliment-recherche');
    if (champAliment && typeof ALIMENTS !== 'undefined') {
        initRechercheAliments(champAliment);
        initJournal();
    }

    /* ---------- Page programme + minuteur de repos ---------- */
    if (document.getElementById('programme') && typeof PROGRAMMES !== 'undefined') {
        initProgramme();
        prechargerPhotos(Object.values(EXERCICES).filter(exo => exo.img)
            .map(exo => `/images/exercices/${exo.img.includes('.') ? exo.img : `${exo.img}.webp`}`));
    }

    /* ---------- Page « Mes progrès » ---------- */
    if (document.getElementById('progres') && typeof EXERCICES !== 'undefined') initProgres();
    initPoids();
    initSauvegardeEnLigne();

    /* ---------- Sauvegarde en ligne : copie en attente envoyée dès que possible ---------- */
    if (SauvegardeEnLigne.lireCode()) {
        SauvegardeEnLigne.planifier();
        window.addEventListener('online', () => SauvegardeEnLigne.planifier());
    }

    /* ---------- Accueil : photos des aliments et de la nutrition pour le hors ligne ---------- */
    if (typeof ALIMENTS !== 'undefined') {
        prechargerPhotos([
            ...ALIMENTS.filter(aliment => aliment.img).map(aliment => `/images/aliments/${aliment.img}.webp`),
            ...[...document.querySelectorAll('img[src^="images/"]')].map(image => `/${image.getAttribute('src')}`)
        ]);
    }

    /* ---------- Calculateur de calories et macros ---------- */
    const calcForm = document.getElementById('calc-form');
    if (calcForm) initCalculator(calcForm);

    /* ---------- Année du pied de page ---------- */
    document.getElementById('year').textContent = new Date().getFullYear();
});

/* ==========================================================
   CARROUSELS — cartes à faire glisser sur mobile, avec points
   indicateurs (masqués en CSS sur grand écran)
   ========================================================== */

function initCarrousel(piste) {
    const elements = [...piste.children];
    const points = document.createElement('div');
    points.className = 'carousel-dots';
    points.setAttribute('aria-hidden', 'true');

    elements.forEach(element => {
        const point = document.createElement('button');
        point.type = 'button';
        point.tabIndex = -1;
        // Défilement relatif à la position actuelle : fonctionne de gauche à droite comme de droite à gauche
        point.addEventListener('click', () => {
            const decalage = element.getBoundingClientRect().left + element.offsetWidth / 2
                - (piste.getBoundingClientRect().left + piste.clientWidth / 2);
            piste.scrollBy({ left: decalage, behavior: 'smooth' });
        });
        points.appendChild(point);
    });
    piste.after(points);

    // Le point actif correspond à la carte la plus proche du centre
    const majPoints = () => {
        const boite = piste.getBoundingClientRect();
        const centre = boite.left + boite.width / 2;
        let actif = 0;
        let ecartMin = Infinity;
        elements.forEach((element, i) => {
            const rect = element.getBoundingClientRect();
            const ecart = Math.abs(rect.left + rect.width / 2 - centre);
            if (ecart < ecartMin) {
                ecartMin = ecart;
                actif = i;
            }
        });
        [...points.children].forEach((point, i) => point.classList.toggle('active', i === actif));
    };

    piste.addEventListener('scroll', () => requestAnimationFrame(majPoints), { passive: true });
    majPoints();
}

/* ==========================================================
   JOURNÉE TYPE — plusieurs idées par repas
   La première idée de chaque liste est celle écrite dans le HTML.
   ========================================================== */

// [description, kcal, grammes de protéines] pour chaque repas : petit-déjeuner, déjeuner, collation, dîner
const IDEES_REPAS = {
    masse: [
        [
            ["3 œufs, 4 tranches de pain, une banane et un grand verre de lait", 850, 40],
            ["Un grand bol de céréales avec du lait et 2 tartines de beurre de cacahuète", 850, 30],
            ["Un grand bol de flocons d'avoine au lait, une banane et une poignée d'amandes", 850, 30],
            ["2 sandwichs jambon-fromage, un fruit et un verre de jus d'orange", 800, 45]
        ],
        [
            ["Une grande assiette de riz, du poulet et des légumes", 900, 50],
            ["Des pâtes au thon avec de la sauce tomate", 900, 55],
            ["2 steaks hachés, des pommes de terre et des haricots verts", 850, 60],
            ["Du saumon, de la semoule et des légumes", 900, 50]
        ],
        [
            ["Un yaourt, une poignée de noix et un fruit", 400, 10],
            ["Une tartine de beurre de cacahuète et un verre de lait", 450, 20],
            ["2 œufs durs, une tranche de pain et une banane", 350, 15],
            ["Un fromage blanc avec du miel et des céréales", 350, 20]
        ],
        [
            ["Des pâtes avec de la viande hachée et de la sauce tomate", 800, 45],
            ["Un burger maison (steak, fromage) et des pommes de terre au four", 800, 45],
            ["Du saumon, du riz et des brocolis", 800, 40],
            ["Une omelette de 4 œufs, du pain et une salade", 700, 35]
        ]
    ],
    seche: [
        [
            ["2 œufs, 2 tranches de pain, un fruit et un verre de lait", 500, 25],
            ["Un bol de flocons d'avoine au lait et une banane", 500, 15],
            ["Un bol de céréales avec du lait, un yaourt et un fruit", 450, 15],
            ["2 tranches de pain avec du jambon, un œuf et un jus d'orange", 400, 25]
        ],
        [
            ["Une assiette de riz, du poulet et des légumes", 650, 45],
            ["Des pâtes au thon et de la salade", 600, 50],
            ["Un steak haché, des pommes de terre et des haricots verts", 600, 35],
            ["Une salade de poulet, maïs et tomates, avec du pain", 650, 45]
        ],
        [
            ["Un fromage blanc et une pomme", 200, 15],
            ["2 œufs durs", 150, 15],
            ["2 tranches de jambon et une pomme", 150, 10],
            ["Un yaourt nature et quelques amandes", 200, 10]
        ],
        [
            ["Une bonne portion de poisson, des pommes de terre et de la salade", 650, 40],
            ["Une omelette de 3 œufs au fromage, du pain et une salade", 600, 35],
            ["Du poulet, du riz et des haricots verts", 650, 45],
            ["Une soupe de légumes, du jambon, du pain et un morceau de fromage", 650, 40]
        ]
    ]
};

function initJournee(panel) {
    const idees = IDEES_REPAS[panel.dataset.journee];
    if (!idees) return;

    const repas = [...panel.querySelectorAll('.meal')];
    const choix = repas.map(() => 0);
    const totalEl = panel.querySelector('.day__total strong');
    const totalProtEl = panel.querySelector('.day__prot');

    const majTotal = () => {
        const somme = colonne => choix.reduce((total, idx, i) => total + idees[i][idx][colonne], 0);
        totalEl.textContent = `≈ ${(Math.round(somme(1) / 50) * 50).toLocaleString(LOCALE)}`;
        totalProtEl.textContent = t('🥩 {n} g de protéines', { n: somme(2) });
    };

    const afficherRepas = (i, idx, animer = true) => {
        choix[i] = idx;
        const [description, kcal, proteines] = idees[i][idx];
        const desc = repas[i].querySelector('.meal__desc');
        desc.textContent = t(description);
        repas[i].querySelector('.meal__kcal').textContent = kcal;
        repas[i].querySelector('.meal__prot').textContent = proteines;
        repas[i].querySelector('.meal__swap span').textContent = `${idx + 1}/${idees[i].length}`;

        if (!animer) return;
        // Relance la petite animation de changement
        desc.classList.remove('swapped');
        void desc.offsetWidth;
        desc.classList.add('swapped');
    };

    repas.forEach((meal, i) => {
        const moment = meal.querySelector('.meal__time').textContent.toLowerCase();
        const bouton = document.createElement('button');
        bouton.type = 'button';
        bouton.className = 'meal__swap';
        bouton.setAttribute('aria-label', t('Autre idée : {moment}', { moment }));
        bouton.innerHTML = `↻ ${t('Autre idée')} <span>1/${idees[i].length}</span>`;
        bouton.addEventListener('click', () => {
            afficherRepas(i, (choix[i] + 1) % idees[i].length);
            majTotal();
        });
        meal.appendChild(bouton);
        afficherRepas(i, 0, false);
    });

    // Change tous les repas d'un coup, chacun vers une idée différente de l'actuelle
    panel.querySelector('.day__shuffle').addEventListener('click', () => {
        repas.forEach((_, i) => {
            const decalage = 1 + Math.floor(Math.random() * (idees[i].length - 1));
            afficherRepas(i, (choix[i] + decalage) % idees[i].length);
        });
        majTotal();
    });

    majTotal();
}

/* ==========================================================
   RECHERCHE D'ALIMENTS
   Tolérante aux accents et aux fautes de frappe (« eufe » → Œuf).
   Données dans aliments.js.
   ========================================================== */

const ALIMENTS_POPULAIRES = ['Œuf', 'Blanc de poulet', 'Thon au naturel', 'Riz', 'Banane', "Flocons d'avoine"];
const MAX_RESULTATS = 8;

// « Œufs à la crème » → « oeufs a la creme »
const normaliser = texte => texte
    .toLowerCase()
    .replace(/œ/g, 'oe')
    .replace(/æ/g, 'ae')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[֑-ׇ]/g, '')          // voyelles et signes hébreux (niqqud)
    .replace(/[^a-z0-9א-ת]+/g, ' ')  // lettres latines, chiffres et lettres hébraïques
    .trim();

// Nombre de fautes pour passer de a à b : lettre ajoutée, retirée, remplacée
// ou deux lettres inversées (« poulte » → « poulet » = 1 faute)
function distance(a, b) {
    const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) d[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cout = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cout);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
            }
        }
    }
    return d[a.length][b.length];
}

const formatValeur = v => v.toLocaleString(LOCALE, { maximumFractionDigits: v < 20 ? 1 : 0 });

function initRechercheAliments(champ) {
    const resultatsEl = document.getElementById('aliment-resultats');
    const statutEl = document.getElementById('aliment-statut');

    // On cherche dans les noms français ET dans leur traduction (anglais / hébreu)
    const index = ALIMENTS.map(aliment => {
        const noms = [aliment.nom, ...aliment.alias];
        const termes = [...new Set([...noms, ...noms.map(nom => t(nom))].map(normaliser))];
        const mots = [...new Set(termes.flatMap(terme => [terme, ...terme.split(' ')]))];
        return { aliment, termes, mots };
    });

    // Renvoie { aliments, approchant } : approchant = trouvé grâce à la tolérance aux fautes
    const rechercher = requete => {
        const q = normaliser(requete);
        const variantes = q.length > 3 && /[sx]$/.test(q) ? [q, q.slice(0, -1)] : [q];

        const directs = [];
        index.forEach(({ aliment, termes, mots }) => {
            let score = 0;
            variantes.forEach(v => {
                if (termes.includes(v)) score = Math.max(score, 3);
                else if (mots.some(m => m.startsWith(v))) score = Math.max(score, 2);
                else if (termes.some(terme => terme.includes(v))) score = Math.max(score, 1);
            });
            if (score) directs.push({ aliment, score });
        });
        if (directs.length) {
            // Un mot qui commence par la recherche l'emporte sur un mot qui la contient (« oeuf » ≠ « boeuf »)
            const meilleurScore = Math.max(...directs.map(r => r.score));
            const gardes = meilleurScore >= 2 ? directs.filter(r => r.score >= 2) : directs;
            return { aliments: gardes.sort((a, b) => b.score - a.score).map(r => r.aliment), approchant: false };
        }

        // Tolérance aux fautes : on ne garde que les aliments les plus proches
        if (q.length < 3) return { aliments: [], approchant: false };
        const tolerance = q.length === 3 ? 1 : q.length <= 7 ? 2 : 3;
        const proches = [];
        index.forEach(({ aliment, mots }) => {
            const ecart = Math.min(...mots.map(m => distance(q, m)));
            if (ecart <= tolerance) proches.push({ aliment, ecart });
        });
        const plusProche = Math.min(...proches.map(r => r.ecart));
        return { aliments: proches.filter(r => r.ecart === plusProche).map(r => r.aliment), approchant: true };
    };

    const carte = a => {
        const ratio = a.portion.g / 100;
        const media = a.img
            ? `<img src="images/aliments/${a.img}.webp" alt="${t(a.nom)}" width="480" height="320" loading="lazy">`
            : `<span class="aliment__emoji" aria-hidden="true">${a.emoji}</span>`;
        return `
            <li class="aliment">
                <div class="aliment__media">${media}</div>
                <div class="aliment__info">
                    <h4 class="aliment__nom">${t(a.nom)}</h4>
                    <p class="aliment__portion">${t(a.portion.label)} (${a.portion.g} g)</p>
                    <div class="aliment__chiffres">
                        <span class="aliment__kcal"><strong>${Math.round(a.kcal * ratio)}</strong> ${t('kcal')}</span>
                        <span class="aliment__prot"><strong>${formatValeur(a.prot * ratio)} g</strong> ${t('protéines')}</span>
                    </div>
                    <p class="aliment__cent">${t('Pour 100 g : {kcal} kcal • {prot} g prot. • {gluc} g gluc. • {lip} g lip.', { kcal: a.kcal, prot: formatValeur(a.prot), gluc: formatValeur(a.gluc), lip: formatValeur(a.lip) })}</p>
                    <button type="button" class="aliment__ajout" data-ajouter="${ALIMENTS.indexOf(a)}">${t('+ Ajouter à mon journal')}</button>
                </div>
            </li>`;
    };

    resultatsEl.addEventListener('click', e => {
        const bouton = e.target.closest('[data-ajouter]');
        if (bouton) ouvrirAjoutAliment(ALIMENTS[Number(bouton.dataset.ajouter)]);
    });

    const afficher = () => {
        const requete = champ.value.trim();
        resultatsEl.classList.toggle('has-query', Boolean(requete));

        if (!requete) {
            const populaires = ALIMENTS_POPULAIRES.map(nom => ALIMENTS.find(a => a.nom === nom)).filter(Boolean);
            statutEl.textContent = t('Les plus recherchés :');
            resultatsEl.innerHTML = populaires.map(carte).join('');
            return;
        }

        const { aliments, approchant } = rechercher(requete);
        if (!aliments.length) {
            statutEl.textContent = t('Aucun aliment trouvé pour « {q} ». Essaie par exemple : poulet, riz, œuf, banane…', { q: requete });
            resultatsEl.innerHTML = '';
            return;
        }

        statutEl.textContent = approchant ? t('Résultats proches de « {q} » :', { q: requete }) : '';
        resultatsEl.innerHTML = aliments.slice(0, MAX_RESULTATS).map(carte).join('');
    };

    champ.addEventListener('input', afficher);

    document.querySelectorAll('.search__suggest .chip-btn').forEach(bouton => {
        bouton.addEventListener('click', () => {
            champ.value = bouton.textContent;
            afficher();
        });
    });

    afficher();
}

/* ==========================================================
   JOURNAL DU JOUR — ce que j'ai mangé aujourd'hui, comparé
   à l'objectif du calculateur. Stocké sur l'appareil par jour :
   { '2026-10-27': [{ nom: 'Œuf', g: 120 }, ...] }
   ========================================================== */

const CLE_REPAS = 'ironpulse-repas';
const JOURS_GARDES_REPAS = 14;
const FRACTIONS_PORTION = [[0.5, '½'], [1, '1'], [1.5, '1½'], [2, '2']];
const EVENEMENT_REPAS = 'ironpulse:repas';

const lireRepas = () => {
    try {
        const repas = JSON.parse(localStorage.getItem(CLE_REPAS));
        return repas && typeof repas === 'object' && !Array.isArray(repas) ? repas : {};
    } catch (e) { return {}; }
};

const ecrireRepas = repas => {
    // On ne garde que les derniers jours
    const jours = Object.keys(repas).filter(jour => repas[jour]?.length).sort().slice(-JOURS_GARDES_REPAS);
    try { localStorage.setItem(CLE_REPAS, JSON.stringify(Object.fromEntries(jours.map(jour => [jour, repas[jour]])))); } catch (e) { /* stockage indisponible */ }
    SauvegardeEnLigne.planifier();
    document.dispatchEvent(new Event(EVENEMENT_REPAS));
};

const valeursAliment = (aliment, g) => ({
    kcal: (aliment.kcal * g) / 100,
    prot: (aliment.prot * g) / 100,
    gluc: (aliment.gluc * g) / 100,
    lip: (aliment.lip * g) / 100
});

// Besoins calculés à partir de la saisie enregistrée du calculateur (null s'il n'a pas été rempli)
function objectifNutrition() {
    try {
        const v = JSON.parse(localStorage.getItem(CALC_STORAGE_KEY));
        if (!v || !OBJECTIFS[v.objectif] || !(v.activite > 0) || !v.sexe) return null;
        const valide = Object.entries(LIMITES).every(([champ, { min, max }]) => v[champ] >= min && v[champ] <= max);
        return valide ? calculerBesoins(v) : null;
    } catch (e) { return null; }
}

// Fenêtre « Ajouter à mon journal » : nombre de portions ou grammes, aperçu des calories et protéines
function ouvrirAjoutAliment(aliment) {
    document.getElementById('ajout-aliment')?.remove();
    const retour = document.activeElement;
    const portion = aliment.portion.g;
    const fenetre = document.createElement('div');
    fenetre.id = 'ajout-aliment';
    fenetre.className = 'outil';
    fenetre.setAttribute('role', 'dialog');
    fenetre.setAttribute('aria-modal', 'true');
    fenetre.setAttribute('aria-labelledby', 'ajout-titre');
    fenetre.innerHTML = `
        <div class="outil__fond" data-fermer></div>
        <form class="outil__panneau ajout" novalidate>
            <div class="outil__tete">
                <h2 class="outil__titre" id="ajout-titre">${t('Ajouter à mon journal')}</h2>
                <button type="button" class="guide__fermer" data-fermer aria-label="${t('Fermer')}">✕</button>
            </div>
            <p class="ajout__aliment"><strong>${t(aliment.nom)}</strong> <span>${t(aliment.portion.label)} (${portion} g)</span></p>
            <fieldset class="ajout__groupe">
                <legend class="field__label">${t('Nombre de portions')}</legend>
                <div class="segmented segmented--4 ajout__portions">
                    ${FRACTIONS_PORTION.map(([valeur, libelle], i) => `
                        <input type="radio" name="ajout-portion" id="ajout-portion-${i}" value="${valeur}"${valeur === 1 ? ' checked' : ''}>
                        <label for="ajout-portion-${i}">${libelle}</label>`).join('')}
                </div>
            </fieldset>
            <div class="field">
                <label class="field__label" for="ajout-grammes">${t('Ou la quantité en grammes')}</label>
                <div class="input-unit"><input type="number" id="ajout-grammes" inputmode="numeric" min="1" max="2000" step="1" value="${portion}"><span>g</span></div>
            </div>
            <div class="ajout__apercu" id="ajout-apercu" aria-live="polite"></div>
            <p class="calc__error" id="ajout-erreur" role="alert"></p>
            <button type="submit" class="btn btn--primary">${t('✓ Ajouter')}</button>
        </form>`;
    document.body.appendChild(fenetre);
    document.body.classList.add('outil-ouvert');

    const champ = fenetre.querySelector('#ajout-grammes');
    const grammes = () => Math.round(parseFloat(champ.value));
    const apercu = () => {
        const g = grammes();
        const v = valeursAliment(aliment, g > 0 ? g : 0);
        fenetre.querySelector('#ajout-apercu').innerHTML = `
            <span class="aliment__kcal"><strong>${formatNombre(v.kcal)}</strong> ${t('kcal')}</span>
            <span class="aliment__prot"><strong>${formatValeur(v.prot)} g</strong> ${t('protéines')}</span>`;
    };

    const fermer = () => {
        fenetre.remove();
        document.body.classList.remove('outil-ouvert');
        retour?.focus?.({ preventScroll: true });
    };

    fenetre.addEventListener('click', e => { if (e.target.closest('[data-fermer]')) fermer(); });
    fenetre.addEventListener('keydown', e => { if (e.key === 'Escape') fermer(); });
    fenetre.addEventListener('change', e => {
        if (e.target.name !== 'ajout-portion') return;
        champ.value = Math.round(portion * Number(e.target.value));
        apercu();
    });
    champ.addEventListener('input', () => {
        // Le bouton de portion reste coché seulement s'il correspond aux grammes tapés
        fenetre.querySelectorAll('[name="ajout-portion"]').forEach(radio => {
            radio.checked = Math.round(portion * Number(radio.value)) === grammes();
        });
        apercu();
    });

    fenetre.querySelector('form').addEventListener('submit', e => {
        e.preventDefault();
        const g = grammes();
        if (!(g >= 1 && g <= 2000)) {
            fenetre.querySelector('#ajout-erreur').textContent = t('Tape une quantité entre 1 et 2000 g.');
            champ.focus();
            return;
        }
        const repas = lireRepas();
        const aujourdhui = cleJour(new Date());
        repas[aujourdhui] = [...(repas[aujourdhui] || []), { nom: aliment.nom, g }];
        ecrireRepas(repas);
        fermer();
        afficherToast(`
            <span class="toast__icone" aria-hidden="true">🍽️</span>
            <span class="toast__texte">
                <strong>${t('Ajouté à ton journal')}</strong>
                <span>${t(aliment.nom)} : ${t('{kcal} kcal • {prot} g de protéines', { kcal: formatNombre(valeursAliment(aliment, g).kcal), prot: formatValeur(valeursAliment(aliment, g).prot) })}</span>
            </span>`, 3000);
    });

    apercu();
    champ.focus({ preventScroll: true });
    champ.select();
}

function initJournal() {
    const bloc = document.getElementById('journal');
    if (!bloc) return;
    const $ = id => document.getElementById(id);

    // Jauge : valeur du jour, et objectif si le calculateur a été rempli
    const jauge = (nom, valeur, objectif, unite, libelle) => {
        const texte = n => `${formatNombre(n)}${unite === 'g' ? ' g' : ` ${t('kcal')}`}`;
        const barre = $(`jauge-${nom}`);
        const pourcentage = objectif ? Math.min(100, (valeur / objectif) * 100) : 0;
        $(`jauge-${nom}-valeur`).textContent = objectif ? `${texte(valeur)} / ${texte(objectif)}` : texte(valeur);
        barre.style.width = `${pourcentage}%`;
        barre.parentElement.hidden = !objectif;
        barre.parentElement.setAttribute('aria-valuenow', Math.round(pourcentage));
        barre.parentElement.setAttribute('aria-label', libelle);
        const reste = objectif - valeur;
        $(`jauge-${nom}-reste`).textContent = !objectif ? ''
            : reste > 0 ? t('Encore {n}', { n: texte(reste) })
                : nom === 'kcal' && -reste >= 50 ? t('{n} au-dessus de ton objectif', { n: texte(-reste) })
                    : t('Objectif atteint ✓');
    };

    const afficher = () => {
        const aujourdhui = cleJour(new Date());
        const liste = (lireRepas()[aujourdhui] || [])
            .map((repas, i) => ({ ...repas, i, aliment: ALIMENTS.find(a => a.nom === repas.nom) }))
            .filter(repas => repas.aliment && repas.g > 0);
        const total = { kcal: 0, prot: 0, gluc: 0, lip: 0 };
        liste.forEach(repas => {
            const v = valeursAliment(repas.aliment, repas.g);
            Object.keys(total).forEach(cle => { total[cle] += v[cle]; });
        });
        const objectif = objectifNutrition();

        jauge('kcal', total.kcal, objectif?.cible, 'kcal', t('Calories du jour'));
        jauge('prot', total.prot, objectif?.proteines, 'g', t('Protéines du jour'));
        $('journal-macros').textContent = liste.length
            ? t('Glucides : {gluc} g • Lipides : {lip} g', { gluc: formatNombre(total.gluc), lip: formatNombre(total.lip) })
            : '';
        $('journal-objectif').innerHTML = objectif
            ? t('Objectif « {label} » calculé avec tes infos du calculateur.', { label: t(objectif.reglages.label) })
            : t('<a href="#calculateur">Remplis le calculateur</a> pour voir ton objectif du jour.');

        $('journal-vide').hidden = liste.length > 0;
        $('journal-liste').innerHTML = [...liste].reverse().map(repas => {
            const v = valeursAliment(repas.aliment, repas.g);
            return `
                <li class="journal__ligne">
                    <span class="journal__nom">${t(repas.aliment.nom)}<small>${repas.g} g</small></span>
                    <span class="journal__chiffres"><span><strong>${formatNombre(v.kcal)}</strong> ${t('kcal')}</span><small>${formatValeur(v.prot)} g ${t('prot.')}</small></span>
                    <button type="button" class="detail__supprimer" data-retirer-repas="${repas.i}" aria-label="${t('Retirer {nom} du journal', { nom: t(repas.aliment.nom) })}">✕</button>
                </li>`;
        }).join('');
    };

    bloc.addEventListener('click', e => {
        const bouton = e.target.closest('[data-retirer-repas]');
        if (!bouton) return;
        const repas = lireRepas();
        const aujourdhui = cleJour(new Date());
        (repas[aujourdhui] || []).splice(Number(bouton.dataset.retirerRepas), 1);
        ecrireRepas(repas);
        $('journal-liste').querySelector('.detail__supprimer')?.focus({ preventScroll: true });
    });

    document.addEventListener(EVENEMENT_REPAS, afficher);
    // L'objectif suit le calculateur (après son propre enregistrement)
    const calcul = document.getElementById('calc-form');
    ['input', 'submit'].forEach(type => calcul?.addEventListener(type, () => setTimeout(afficher, 0)));
    // Retour sur la page le lendemain : la journée repart de zéro
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') afficher(); });
    afficher();
}

/* ==========================================================
   PAGE PROGRAMME
   programme.html?objectif=masse|seche|force&jours=2..5
   Données dans programmes.js.
   ========================================================== */

// La semaine commence le dimanche (vendredi et samedi = repos)
const NOMS_JOURS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const CLE_JOURS = 'ironpulse-jours';
const CLE_EXERCICES = 'ironpulse-exercices';
const CLE_CARNET = 'ironpulse-carnet';
const MAX_ENTREES_CARNET = 20;
const CLE_SEANCE_EN_COURS = 'ironpulse-seance-en-cours';
const DUREE_REPRISE_SEANCE = 4 * 60 * 60 * 1000; // une séance commencée il y a moins de 4 h peut être reprise

const formatKg = kg => `${kg.toLocaleString(LOCALE)} kg`;

// « 60 kg × 10 · 10 · 9 rép. » (ou « 60×10 · 62,5×8 » si le poids a changé entre les séries)
const resumeEntree = (entree, unite) => {
    const poids = [...new Set(entree.series.map(x => x.kg).filter(kg => kg > 0))];
    const detail = entree.series.map(x => (poids.length > 1 && x.kg ? `${x.kg.toLocaleString(LOCALE)}×${x.reps}` : x.reps)).join(' · ');
    return `${poids.length === 1 ? `${formatKg(poids[0])} × ` : ''}${detail} ${unite}`;
};

// Conseil de progression à partir de la dernière séance notée (double progression)
function conseilProgression(exo, schema, entree) {
    const [min, max] = schema.reps.match(/\d+/g).map(Number);
    const valeurs = entree.series.map(s => s.reps);
    const avecPoids = entree.series.some(s => s.kg > 0);

    if (valeurs.every(v => v >= max)) {
        if (exo.duree) return { type: 'monter', texte: t('🔥 Toutes tes séries ont atteint {max} s : passe à {next} s la prochaine fois.', { max, next: max + 15 }) };
        return avecPoids
            ? { type: 'monter', texte: t('🔥 Toutes tes séries ont atteint {max} répétitions : ajoute 2,5 kg (ou 1 à 2 kg aux haltères) la prochaine fois !', { max }) }
            : { type: 'monter', texte: t('🔥 Toutes tes séries ont atteint {max} répétitions : ajoute un peu de poids ou ralentis la descente.', { max }) };
    }
    if (valeurs.some(v => v < min)) {
        return exo.duree
            ? { type: 'baisser', texte: t('⚠️ Certaines séries sont sous {min} s : garde la même charge et vise au moins {min} s.', { min }) }
            : { type: 'baisser', texte: t('⚠️ Certaines séries sont sous {min} répétitions : garde ce poids et vise au moins {min}, ou enlève 2,5 kg.', { min }) };
    }
    return exo.duree
        ? { type: 'garder', texte: t('💪 Essaie de tenir 5 s de plus sur une série. À {max} s partout, tu pourras monter.', { max }) }
        : { type: 'garder', texte: t('💪 Garde le même poids et essaie de gagner 1 répétition sur une série. À {max} partout, tu pourras monter.', { max }) };
}

// 90 → « 1 min 30 », 45 → « 45 s »
const formatRepos = sec => {
    if (sec < 60) return t('{n} s', { n: sec });
    const reste = sec % 60;
    return reste ? t('{m} min {s}', { m: Math.floor(sec / 60), s: reste }) : t('{m} min', { m: sec / 60 });
};

/* ---------- Échauffement : séries légères calculées avant le premier exercice ---------- */
// [pourcentage de la charge de travail, répétitions] ; plus de paliers avant une série lourde (force)
const PALIERS_ECHAUFFEMENT = {
    normal: [[0.5, 10], [0.75, 5]],
    lourd: [[0.4, 10], [0.6, 5], [0.8, 3], [0.9, 1]]
};

function seriesEchauffement(kg, lourd) {
    if (!(kg >= 20)) return [];
    const series = [];
    PALIERS_ECHAUFFEMENT[lourd ? 'lourd' : 'normal'].forEach(([pourcentage, reps]) => {
        const charge = arrondir25(kg * pourcentage);
        if (charge > 0 && charge < kg && !series.some(s => s.kg === charge)) series.push({ kg: charge, reps });
    });
    return series;
}

const texteEchauffement = series => series.map(s => `${formatKg(s.kg)} × ${s.reps}`).join(' → ');

/* ---------- Mon programme : séances composées par l'utilisateur ---------- */
const CLE_PERSO = 'ironpulse-perso';
const MAX_EXOS_PERSO = 10;
// Familles d'exercices regroupées par partie du corps (liste de choix et résumé de la séance)
const PARTIES_CORPS = [
    ['Jambes', ['jambes', 'jambes-ciblees', 'charniere', 'fessiers', 'ischios', 'mollets']],
    ['Pectoraux', ['pecs', 'pecs-cibles']],
    ['Dos', ['dos-vertical', 'dos-horizontal']],
    ['Épaules', ['epaules', 'epaules-ciblees', 'epaules-arriere']],
    ['Bras', ['biceps', 'triceps']],
    ['Abdos', ['abdos']]
];
// Mouvements de base (plus lourds, plus de repos) ; les autres familles sont de l'isolation
const GROUPES_BASE = ['jambes', 'charniere', 'fessiers', 'pecs', 'epaules', 'dos-vertical', 'dos-horizontal'];
// Jours où l'on peut s'entraîner : du dimanche au jeudi (vendredi et samedi = repos)
const JOURS_ENTRAINEMENT = [0, 1, 2, 3, 4];

/* ---------- Semaine légère (récupération) ---------- */
const CLE_RECUP = 'ironpulse-recup';
const DUREE_RECUP = 7 * 24 * 60 * 60 * 1000;
const REDUCTION_RECUP = 0.9;           // poids 10 % plus légers
const SEMAINES_AVANT_RECUP = 8;        // semaines d'affilée avant de conseiller une semaine légère
const SEANCES_STAGNATION = 3;          // séances sans progrès pour dire qu'un exercice stagne

const seriesRecup = series => Math.max(2, Math.round(series * 0.6));
const poidsRecup = kg => (kg >= 10 ? arrondir25(kg * REDUCTION_RECUP) : kg);

/* Renvoie { active, fin } pendant une semaine légère, { conseil, stagnent, semaines } quand une
   semaine légère est conseillée, sinon null. Un exercice stagne quand ses 3 dernières séances ne
   dépassent pas son meilleur résultat d'avant (charge max estimée : plus de poids OU plus de
   répétitions comptent comme un progrès). Les séances faites en semaine légère sont ignorées. */
function etatRecuperation(carnet, etat, maintenant = Date.now()) {
    etat = etat || {};
    if (etat.debut && maintenant - etat.debut < DUREE_RECUP) return { active: true, fin: new Date(etat.debut + DUREE_RECUP) };
    const finDerniere = etat.debut ? etat.debut + DUREE_RECUP : 0;
    if (maintenant - finDerniere < 4 * 7 * UN_JOUR) return null;
    if (etat.reporte && maintenant - etat.reporte < 7 * UN_JOUR) return null;

    const stagnent = Object.entries(carnet).filter(([id, liste]) => {
        if (!EXERCICES[id] || !Array.isArray(liste)) return false;
        const normales = liste.filter(e => !e.leger && new Date(e.date).getTime() > finDerniere);
        if (normales.length < SEANCES_STAGNATION + 1) return false;
        const recentes = normales.slice(0, SEANCES_STAGNATION);
        if (maintenant - new Date(recentes[SEANCES_STAGNATION - 1].date).getTime() > 6 * 7 * UN_JOUR) return false;
        const avecPoids = !EXERCICES[id].duree && normales.some(e => e.series.some(s => s.kg > 0));
        const meilleur = entrees => Math.max(0, ...entrees.flatMap(e => e.series)
            .map(s => (avecPoids ? chargeMaxEstimee(s.kg || 0, s.reps || 0) : s.reps || 0)));
        return meilleur(recentes) <= meilleur(normales.slice(SEANCES_STAGNATION));
    }).map(([id]) => id);

    // Semaines d'affilée avec au moins une séance, depuis la dernière semaine légère
    const semainesFaites = new Set(Object.values(carnet).filter(Array.isArray).flat()
        .filter(e => e && e.date && new Date(e.date).getTime() > finDerniere)
        .map(e => cleJour(debutSemaine(new Date(e.date)))));
    const cetteSemaine = debutSemaine(new Date(maintenant));
    let semaine = semainesFaites.has(cleJour(cetteSemaine)) ? cetteSemaine : new Date(cetteSemaine.getTime() - 7 * UN_JOUR);
    let semaines = 0;
    while (semainesFaites.has(cleJour(semaine))) {
        semaines++;
        semaine = new Date(semaine.getFullYear(), semaine.getMonth(), semaine.getDate() - 7);
    }

    if (stagnent.length >= 2 || semaines >= SEMAINES_AVANT_RECUP) return { conseil: true, stagnent, semaines };
    return null;
}

// Phrase qui explique pourquoi une semaine légère est conseillée
function raisonRecuperation(etat) {
    const raisons = [];
    if (etat.stagnent.length >= 2) {
        raisons.push(t('{n} exercices ne progressent plus depuis {s} séances ({noms}).', {
            n: etat.stagnent.length,
            s: SEANCES_STAGNATION,
            noms: etat.stagnent.slice(0, 3).map(id => t(EXERCICES[id].nom)).join(', ') + (etat.stagnent.length > 3 ? '…' : '')
        }));
    }
    if (etat.semaines >= SEMAINES_AVANT_RECUP) raisons.push(t("Tu t'entraînes depuis {n} semaines d'affilée.", { n: etat.semaines }));
    return raisons.join(' ');
}

function initProgramme() {
    const $ = id => document.getElementById(id);
    const params = new URLSearchParams(location.search);
    const objectif = PROGRAMMES[params.get('objectif')] ? params.get('objectif') : 'masse';
    const prog = PROGRAMMES[objectif];
    const minuteur = creerMinuteur();

    // ---------- En-tête de page ----------
    document.title = t('Programme {titre} — Iron Pulse', { titre: t(prog.titre) });
    $('prog-tag').textContent = t(prog.tag);
    $('prog-titre').innerHTML = t('Programme <span class="text-gradient">{titre}</span>', { titre: t(prog.titre) });
    $('prog-intro').textContent = t(prog.intro);
    $('prog-bg').style.backgroundImage =
        `linear-gradient(180deg, rgba(10, 10, 11, 0.55) 0%, rgba(10, 10, 11, 0.8) 60%, #0a0a0b 100%), url('${prog.img}')`;
    $('prog-calc').href = `index.html?objectif=${objectif === 'force' ? 'maintien' : objectif}#calculateur`;
    $('prog-regles').innerHTML = prog.regles.map(([icone, titre, texte]) => `
        <li class="rule">
            <span class="rule__icon" aria-hidden="true">${icone}</span>
            <h4>${t(titre)}</h4>
            <p>${t(texte)}</p>
        </li>`).join('');

    // ---------- État : nombre de séances et exercices choisis ----------
    const lireStockage = (cle, defaut) => {
        try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch (e) { return defaut; }
    };
    const ecrireStockage = (cle, valeur) => {
        try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch (e) { /* stockage indisponible */ }
        // Données sauvegardées modifiées : copie en ligne automatique (si elle est activée)
        if (CLES_SAUVEGARDE.includes(cle)) SauvegardeEnLigne.planifier();
    };

    // « Mon programme » : chaque jour choisi devient une séance « perso-<jour> », ajoutée aux séances
    // tout prêtes ; la semaine correspondante est SPLITS.perso. Renvoie faux s'il n'y a rien à afficher.
    const installerPerso = perso => {
        Object.keys(SEANCES).filter(id => id.startsWith('perso-')).forEach(id => delete SEANCES[id]);
        delete SPLITS.perso;
        const joursPerso = JOURS_ENTRAINEMENT.filter(j => perso?.jours?.[j]?.exos?.some(id => EXERCICES[id]));
        if (!joursPerso.length) return false;

        const semaine = Array(7).fill(null);
        joursPerso.forEach((j, n) => {
            const ids = [...new Set(perso.jours[j].exos.filter(id => EXERCICES[id]))];
            const parDefaut = t('Séance {n}', { n: n + 1 });
            const nom = (perso.jours[j].nom || '').trim() || parDefaut;
            SEANCES[`perso-${j}`] = {
                nom,
                court: nom.length <= 10 ? nom : parDefaut,
                focus: PARTIES_CORPS.filter(([, groupes]) => ids.some(id => groupes.includes(EXERCICES[id].groupe))).map(([partie]) => t(partie)).join(', '),
                exos: ids.map(id => [id, GROUPES_BASE.includes(EXERCICES[id].groupe) ? 'base' : 'iso'])
            };
            semaine[j] = `perso-${j}`;
        });
        SPLITS.perso = {
            description: t(joursPerso.length > 1 ? 'Ton programme à toi : {n} séances par semaine.' : 'Ton programme à toi : {n} séance par semaine.', { n: joursPerso.length }),
            semaine
        };
        return true;
    };
    let perso = lireStockage(CLE_PERSO, null);
    installerPerso(perso);

    // « 2 » à « 5 » séances, ou « perso » pour mon programme
    const valeurJours = v => (v === 'perso' ? (SPLITS.perso ? 'perso' : 0) : SPLITS[Number(v)] ? Number(v) : 0);
    let jours = valeurJours(params.get('jours')) || valeurJours(lireStockage(CLE_JOURS, 0)) || prog.joursDefaut;

    // Semaine légère : moins de séries et des poids plus légers pendant 7 jours
    let etatRecup = lireStockage(CLE_RECUP, {});
    const recupActive = () => Boolean(etatRecuperation({}, etatRecup)?.active);

    // { 'masse|full-a|0': 'presse', ... } : exercice choisi à la place de celui d'origine
    const choix = lireStockage(CLE_EXERCICES, {});
    const cleChoix = (seanceId, i) => `${objectif}|${seanceId}|${i}`;
    let seanceActive = null;

    // Carnet : { squat: [{ date, series: [{ kg, reps }, ...] }, ...] }, la plus récente en premier.
    // Indexé par exercice : l'historique suit l'exercice d'un programme à l'autre.
    const carnet = lireStockage(CLE_CARNET, {});
    let carnetOuvert = null;

    const exercicesSeance = seanceId => SEANCES[seanceId].exos.map(([origine, role], i) => {
        // Un choix enregistré n'est gardé que s'il appartient toujours à la même famille que l'exercice d'origine
        const choisi = choix[cleChoix(seanceId, i)];
        const valide = EXERCICES[choisi] && EXERCICES[choisi].groupe === EXERCICES[origine].groupe;
        return { id: valide ? choisi : origine, origine, role };
    });

    const schemaNormal = (exo, role, i) => {
        if (exo.duree) return SCHEMAS.duree;
        if (objectif === 'force' && i === 0) return SCHEMAS.force.premier;
        return SCHEMAS[objectif][role];
    };
    const schema = (exo, role, i) => {
        const s = schemaNormal(exo, role, i);
        return recupActive() ? { ...s, series: seriesRecup(s.series) } : s;
    };
    // Poids proposé à partir de la dernière séance (10 % de moins en semaine légère)
    const poidsPropose = kg => (kg && recupActive() ? poidsRecup(kg) : kg);

    // Échauffement calculé sur le premier exercice avec charge, à partir du poids prévu
    const echauffement = (liste, kgPrevu) => {
        const rang = liste.findIndex(e => !EXERCICES[e.id].duree);
        if (rang === -1) return null;
        const id = liste[rang].id;
        const kg = kgPrevu ?? poidsPropose(Math.max(0, ...((carnet[id] || [])[0]?.series || []).map(s => s.kg || 0)));
        const lourd = objectif === 'force' && rang === 0 && !recupActive();
        return { rang, id, series: seriesEchauffement(kg, lourd) };
    };

    // Exercices de la même famille, sans ceux déjà présents ailleurs dans la séance
    const alternatives = (liste, i) => {
        const actuel = liste[i].id;
        const groupe = EXERCICES[actuel].groupe;
        const autres = liste.filter((_, j) => j !== i).map(e => e.id);
        return Object.keys(EXERCICES).filter(id =>
            EXERCICES[id].groupe === groupe && (id === actuel || !autres.includes(id)));
    };

    // Durée estimée : ~40 s d'effort par série + repos, échauffement et cardio compris
    const dureeSeance = liste => {
        const secondes = liste.reduce((total, e, i) => {
            const s = schema(EXERCICES[e.id], e.role, i);
            return total + s.series * (40 + s.repos);
        }, 0) + 600 + (prog.cardio ? 900 : 0);
        return Math.round(secondes / 60 / 5) * 5;
    };

    // ---------- Affichage ----------
    const carteExercice = (liste, i) => {
        const e = liste[i];
        const exo = EXERCICES[e.id];
        const s = schema(exo, e.role, i);
        const alts = alternatives(liste, i);
        const nom = t(exo.nom);
        const media = exo.img
            ? `<img src="images/exercices/${exo.img.includes('.') ? exo.img : `${exo.img}.webp`}" alt="${nom}" width="400" height="300" loading="lazy">`
            : `<span class="exo__emoji" aria-hidden="true">${exo.emoji}</span>`;

        const derniere = (carnet[e.id] || [])[0];
        const unite = t(exo.duree ? 's' : 'rép.');
        let historique = '';
        if (derniere) {
            const date = new Date(derniere.date).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
            const resume = resumeEntree(derniere, unite);
            const precedente = (carnet[e.id] || [])[1];
            const maxDernier = Math.max(0, ...derniere.series.map(x => x.kg || 0));
            const maxPrecedent = precedente ? Math.max(0, ...precedente.series.map(x => x.kg || 0)) : 0;
            const gain = maxPrecedent && maxDernier > maxPrecedent ? ` <span class="carnet__gain">📈 +${formatKg(maxDernier - maxPrecedent)}</span>` : '';
            // En semaine légère, pas de conseil pour monter : on garde des charges plus faciles
            const conseil = recupActive()
                ? (maxDernier ? { type: 'garder', texte: t('🌙 Semaine légère : prends environ {kg} et arrête-toi loin de l\'échec.', { kg: formatKg(poidsRecup(maxDernier)) }) } : null)
                : conseilProgression(exo, s, derniere);
            historique = `
                <p class="carnet__dernier">${t('📒 Dernière fois ({date}) :', { date })} <strong dir="ltr">${resume}</strong>${gain}</p>
                ${conseil ? `<p class="carnet__conseil carnet__conseil--${conseil.type}">${conseil.texte}</p>` : ''}`;
        }

        const lignes = Array.from({ length: s.series }, (_, n) => {
            const precedent = derniere?.series[n];
            return `
                <div class="carnet__ligne">
                    <span>${t('Série {n}', { n: n + 1 })}</span>
                    <label><input type="number" name="kg" inputmode="decimal" min="0" step="0.5" placeholder="${exo.duree ? '—' : '0'}" value="${poidsPropose(precedent?.kg) || ''}" aria-label="${t('Poids série {n}', { n: n + 1 })}"${exo.duree ? ' disabled' : ''}> kg</label>
                    <label><input type="number" name="reps" inputmode="numeric" min="0" step="1" placeholder="${s.reps.match(/\d+/)[0]}" aria-label="${t(exo.duree ? 'Secondes série {n}' : 'Répétitions série {n}', { n: n + 1 })}"> ${unite}</label>
                </div>`;
        }).join('');

        const carnetHtml = `
            <div class="carnet">
                ${historique}
                <form class="carnet__form" data-carnet="${i}" ${carnetOuvert === i ? '' : 'hidden'}>
                    ${lignes}
                    <button type="submit" class="btn btn--primary carnet__save">${t('✓ Enregistrer')}</button>
                </form>
            </div>`;

        return `
            <li class="exo" data-index="${i}">
                ${videoExercice(e.id)
                    ? `<button type="button" class="exo__media exo__media--video" data-video="${e.id}" aria-label="${t('Voir la vidéo : {nom}', { nom })}">${media}<span class="exo__num">${i + 1}</span><span class="exo__lecture" aria-hidden="true">${t('▶ Vidéo')}</span></button>`
                    : `<div class="exo__media">${media}<span class="exo__num">${i + 1}</span></div>`}
                <div class="exo__info">
                    <h4 class="exo__nom">${nom}</h4>
                    <p class="exo__muscles">${t(exo.muscles)}</p>
                    <div class="exo__chiffres">
                        <span class="exo__series"><strong>${t('{n} séries', { n: s.series })}</strong> × ${t(s.reps)}${exo.duree ? '' : ` ${t('rép.')}`}</span>
                        <span class="exo__repos">⏱ <strong>${formatRepos(s.repos)}</strong> ${t('de repos entre les séries')}</span>
                    </div>
                    <p class="exo__conseil">💡 ${t(exo.conseil)}</p>
                </div>
                <div class="exo__actions">
                    <button type="button" class="exo__btn exo__btn--timer" data-repos="${s.repos}" data-nom="${nom}">${t('▶ Lancer le repos · {temps}', { temps: formatRepos(s.repos) })}</button>
                    <button type="button" class="exo__btn exo__btn--note" data-noter="${i}" aria-expanded="${carnetOuvert === i}" aria-label="${t('Noter mes séries')}">${t('📝 Noter')}</button>
                    ${alts.length > 1 ? `<button type="button" class="exo__btn" data-changer="${i}" aria-label="${t("Changer d'exercice ({i} sur {n})", { i: alts.indexOf(e.id) + 1, n: alts.length })}">${t('⇄ Changer')} <span>${alts.indexOf(e.id) + 1}/${alts.length}</span></button>` : ''}
                </div>
                ${carnetHtml}
            </li>`;
    };

    const afficherSeance = (animer = []) => {
        const seance = SEANCES[seanceActive];
        const liste = exercicesSeance(seanceActive);
        const modifiee = liste.some(e => e.id !== e.origine);
        const recup = etatRecuperation(carnet, etatRecup);
        const chauffe = echauffement(liste);

        // Bandeau « semaine légère » : en cours, ou conseillée (stagnation, longue série de semaines)
        let bandeauRecup = '';
        if (recup?.active) {
            bandeauRecup = `
                <div class="recup recup--active" role="status">
                    <p><strong>${t('🌙 Semaine légère en cours')}</strong> ${t("jusqu'au {date}", { date: formatDateLongue(recup.fin) })}</p>
                    <p>${t("Moins de séries et des poids environ 10 % plus légers (déjà pré-remplis). Arrête chaque série loin de l'échec : le but est de récupérer.")}</p>
                    <button type="button" class="seance__outils" data-recup="arreter">${t('Arrêter la semaine légère')}</button>
                </div>`;
        } else if (recup?.conseil) {
            bandeauRecup = `
                <div class="recup">
                    <p><strong>${t('😮‍💨 Une semaine plus légère ?')}</strong> ${raisonRecuperation(recup)}</p>
                    <p>${t('Une semaine plus facile laisse ton corps récupérer : tu repars ensuite plus fort.')}</p>
                    <div class="recup__actions">
                        <button type="button" class="btn btn--primary" data-recup="activer">${t('🌙 Commencer une semaine légère')}</button>
                        <button type="button" class="btn btn--ghost" data-recup="reporter">${t('Plus tard')}</button>
                    </div>
                </div>`;
        }

        $('prog-seance').innerHTML = `
            <article class="seance">
                <header class="seance__head">
                    <h3 class="seance__title">${t(seance.nom)}</h3>
                    <p class="seance__meta">${t('{focus} • {n} exercices • ≈ {d} min', { focus: t(seance.focus), n: liste.length, d: dureeSeance(liste) })}</p>
                </header>
                ${bandeauRecup}
                <div class="seance__guide">
                    <button type="button" class="btn btn--primary" data-guide-start>${seanceSauvegardee() ? t('▶ Reprendre la séance en cours') : t('▶ Commencer la séance guidée')}</button>
                    <p>${t('Facultatif : tu peux aussi suivre simplement la liste ci-dessous.')}</p>
                    <div class="seance__liens">
                        <button type="button" class="seance__outils" data-outils>${t('🧮 Disques & charge max')}</button>
                        ${recup?.active ? '' : `<button type="button" class="seance__outils" data-recup="activer">${t('🌙 Semaine légère')}</button>`}
                    </div>
                </div>
                <p class="seance__note">🔥 <strong>${t('Échauffement :')}</strong> ${chauffe?.series.length
                    ? t('5 à 10 min de cardio léger, puis sur « {exo} » : {series}, avant tes vraies séries.', { exo: t(EXERCICES[chauffe.id].nom), series: `<span dir="ltr">${texteEchauffement(chauffe.series)}</span>` })
                    : `${t('5 à 10 min de cardio léger, puis 2 séries légères sur le premier exercice.')}${chauffe ? ` <span class="seance__astuce">${t('Note ton poids une fois : tes séries d\'échauffement seront calculées pour toi.')}</span>` : ''}`}</p>
                <ol class="exos">${liste.map((_, i) => carteExercice(liste, i)).join('')}</ol>
                ${prog.cardio ? `<p class="seance__note seance__note--cardio">🏃 <strong>${t('Pour finir :')}</strong> ${t('15 min de cardio (vélo, tapis ou rameur) à une allure où tu peux encore parler.')}</p>` : ''}
                ${modifiee ? `<button type="button" class="seance__reset" data-reset>${t('↺ Revenir aux exercices de base')}</button>` : ''}
            </article>`;

        animer.forEach(i => $('prog-seance').querySelector(`.exo[data-index="${i}"]`)?.classList.add('swapped'));
        document.querySelectorAll('.session-tab').forEach(onglet => {
            const actif = onglet.dataset.seance === seanceActive;
            onglet.classList.toggle('active', actif);
            onglet.setAttribute('aria-selected', actif);
        });
        document.querySelectorAll('.week__day[data-seance]').forEach(jour => {
            jour.classList.toggle('active', jour.dataset.seance === seanceActive);
        });
    };

    const afficherProgramme = () => {
        const split = SPLITS[jours];
        const seances = [...new Set(split.semaine.filter(Boolean))];
        if (!seances.includes(seanceActive)) seanceActive = seances[0];
        carnetOuvert = null;

        $('prog-split').textContent = t(split.description);
        $('prog-semaine').innerHTML = split.semaine.map((id, i) => id
            ? `<li class="week__day" data-seance="${id}"><button type="button" data-seance="${id}"><span>${t(NOMS_JOURS[i])}</span><strong>${t(SEANCES[id].court)}</strong></button></li>`
            : `<li class="week__day week__day--rest"><span>${t(NOMS_JOURS[i])}</span><strong>${t('Repos')}</strong></li>`).join('');
        $('prog-onglets').innerHTML = seances.map(id =>
            `<button type="button" class="session-tab" role="tab" data-seance="${id}">${t(SEANCES[id].nom)}</button>`).join('');

        // Aucun chiffre coché quand « Mon programme » est affiché
        document.querySelectorAll('input[name="jours"]').forEach(radio => { radio.checked = radio.value === String(jours); });
        $('perso-boutons').innerHTML = jours === 'perso'
            ? `<button type="button" class="chip-btn chip-btn--actif" data-perso="modifier">${t('✏️ Modifier mon programme')}</button>`
            : SPLITS.perso
                ? `<button type="button" class="chip-btn" data-perso="choisir">${t('📋 Mon programme')}</button>`
                : `<button type="button" class="chip-btn" data-perso="creer">${t('✏️ Créer mon propre programme')}</button>`;
        afficherSeance();
    };

    // ---------- Interactions ----------
    const changerJours = valeur => {
        jours = valeur;
        ecrireStockage(CLE_JOURS, jours);
        params.set('objectif', objectif);
        params.set('jours', jours);
        try {
            history.replaceState(null, '', `${location.pathname}?${params}`);
        } catch (e) { /* adresse non modifiable (ex. fichier local) : sans conséquence */ }
        afficherProgramme();
    };

    document.querySelectorAll('input[name="jours"]').forEach(radio => {
        radio.addEventListener('change', () => changerJours(Number(radio.value)));
    });

    // ---------- Mon programme : éditeur ----------
    // Brouillon : { jours: { 0: { nom, exos: ['squat', ...] }, 2: {...} } } ; rien n'est enregistré avant « Enregistrer »
    const editeur = $('perso-editeur');
    let brouillon = null;
    let joursRetires = {};

    const echapper = texte => String(texte).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

    // Liste de choix : tous les exercices, rangés par partie du corps (ceux déjà dans la séance sont grisés)
    const optionsExercices = dejaPris => PARTIES_CORPS.map(([partie, groupes]) => `
        <optgroup label="${t(partie)}">${Object.entries(EXERCICES).filter(([, exo]) => groupes.includes(exo.groupe))
            .map(([id, exo]) => `<option value="${id}"${dejaPris.includes(id) ? ' disabled' : ''}>${t(exo.nom)}</option>`).join('')}</optgroup>`).join('');

    const afficherEditeur = () => {
        const choisis = JOURS_ENTRAINEMENT.filter(j => brouillon.jours[j]);
        editeur.innerHTML = `
            <h2 class="perso__titre">${t('Mon <span class="text-gradient">programme</span>')}</h2>
            <p class="perso__intro">${t("Choisis tes jours, puis les exercices de chaque séance. Les séries, les répétitions et le repos s'adaptent à ton objectif.")}</p>
            <div class="perso__jours" role="group" aria-label="${t("Jours d'entraînement")}">
                ${NOMS_JOURS.map((nom, j) => (JOURS_ENTRAINEMENT.includes(j)
                    ? `<button type="button" class="perso__jour" data-jour="${j}" aria-pressed="${Boolean(brouillon.jours[j])}">${t(nom)}</button>`
                    : `<span class="perso__jour perso__jour--repos">${t(nom)}<small>${t('Repos')}</small></span>`)).join('')}
            </div>
            ${choisis.map((j, n) => {
                const jour = brouillon.jours[j];
                return `
                <section class="perso__seance">
                    <div class="perso__seance-tete">
                        <span class="perso__seance-jour">${t(NOMS_JOURS[j])}</span>
                        <input type="text" class="perso__nom" data-nom="${j}" value="${echapper(jour.nom)}" placeholder="${t('Séance {n}', { n: n + 1 })}" maxlength="30" aria-label="${t('Nom de la séance du {jour}', { jour: t(NOMS_JOURS[j]) })}">
                    </div>
                    ${jour.exos.length ? `<ol class="perso__exos">${jour.exos.map((id, i) => `
                        <li class="perso__exo">
                            <span class="perso__num">${i + 1}</span>
                            <span class="perso__exo-nom">${t(EXERCICES[id].nom)}<small>${t(EXERCICES[id].muscles)}</small></span>
                            <span class="perso__exo-actions">
                                <button type="button" data-deplacer="${j}|${i}|-1" aria-label="${t('Monter {nom}', { nom: t(EXERCICES[id].nom) })}"${i === 0 ? ' disabled' : ''}>↑&#xFE0E;</button>
                                <button type="button" data-deplacer="${j}|${i}|1" aria-label="${t('Descendre {nom}', { nom: t(EXERCICES[id].nom) })}"${i === jour.exos.length - 1 ? ' disabled' : ''}>↓&#xFE0E;</button>
                                <button type="button" data-retirer="${j}|${i}" aria-label="${t('Retirer {nom}', { nom: t(EXERCICES[id].nom) })}">✕</button>
                            </span>
                        </li>`).join('')}</ol>` : `<p class="perso__vide">${t("Aucun exercice pour l'instant.")}</p>`}
                    ${jour.exos.length < MAX_EXOS_PERSO
                        ? `<select class="select perso__ajout" data-ajout="${j}" aria-label="${t('Ajouter un exercice le {jour}', { jour: t(NOMS_JOURS[j]) })}"><option value="">${t('+ Ajouter un exercice')}</option>${optionsExercices(jour.exos)}</select>`
                        : `<p class="perso__vide">${t('{n} exercices maximum par séance.', { n: MAX_EXOS_PERSO })}</p>`}
                </section>`;
            }).join('')}
            ${choisis.length ? '' : `<p class="perso__vide">${t("Touche un jour pour y ajouter une séance.")}</p>`}
            <p class="perso__erreur" id="perso-erreur" role="alert"></p>
            <div class="perso__actions">
                <button type="button" class="btn btn--primary" data-perso="enregistrer">${t('✓ Enregistrer mon programme')}</button>
                <button type="button" class="btn btn--ghost" data-perso="annuler">${t('Annuler')}</button>
            </div>
            ${SPLITS.perso ? `<button type="button" class="seance__reset" data-perso="supprimer">${t('🗑 Supprimer mon programme')}</button>` : ''}`;
    };

    const ouvrirEditeur = () => {
        if (SPLITS.perso) {
            brouillon = JSON.parse(JSON.stringify(perso));
        } else {
            // Premier programme : on part de la semaine affichée, qu'il suffit d'ajuster
            brouillon = { jours: {} };
            SPLITS[jours].semaine.forEach((id, j) => {
                if (id && JOURS_ENTRAINEMENT.includes(j)) brouillon.jours[j] = { nom: t(SEANCES[id].nom), exos: exercicesSeance(id).map(e => e.id) };
            });
        }
        joursRetires = {};
        $('prog-contenu').hidden = true;
        $('prog-freq').hidden = true;
        editeur.hidden = false;
        afficherEditeur();
        editeur.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const fermerEditeur = () => {
        editeur.hidden = true;
        editeur.innerHTML = '';
        brouillon = null;
        $('prog-contenu').hidden = false;
        $('prog-freq').hidden = false;
    };

    $('perso-boutons').addEventListener('click', e => {
        const action = e.target.closest('[data-perso]')?.dataset.perso;
        if (action === 'creer' || action === 'modifier') ouvrirEditeur();
        if (action === 'choisir') changerJours('perso');
    });

    editeur.addEventListener('input', e => {
        const champ = e.target.closest('[data-nom]');
        if (champ) brouillon.jours[champ.dataset.nom].nom = champ.value;
    });

    editeur.addEventListener('change', e => {
        const liste = e.target.closest('[data-ajout]');
        if (!liste || !EXERCICES[liste.value]) return;
        const j = liste.dataset.ajout;
        brouillon.jours[j].exos.push(liste.value);
        afficherEditeur();
        editeur.querySelector(`[data-ajout="${j}"]`)?.focus({ preventScroll: true });
    });

    editeur.addEventListener('click', e => {
        const jour = e.target.closest('[data-jour]');
        if (jour) {
            const j = jour.dataset.jour;
            if (brouillon.jours[j]) {
                joursRetires[j] = brouillon.jours[j];
                delete brouillon.jours[j];
            } else {
                brouillon.jours[j] = joursRetires[j] || { nom: '', exos: [] };
            }
            afficherEditeur();
            editeur.querySelector(`[data-jour="${j}"]`).focus({ preventScroll: true });
            return;
        }

        const deplacer = e.target.closest('[data-deplacer]');
        if (deplacer) {
            const [j, i, sens] = deplacer.dataset.deplacer.split('|');
            const exos = brouillon.jours[j].exos;
            const de = Number(i);
            const vers = de + Number(sens);
            [exos[de], exos[vers]] = [exos[vers], exos[de]];
            afficherEditeur();
            // On garde le doigt sur le même exercice (ou sur l'autre flèche s'il est arrivé au bout)
            const suivant = editeur.querySelector(`[data-deplacer="${j}|${vers}|${sens}"]:not([disabled])`)
                || editeur.querySelector(`[data-deplacer="${j}|${vers}|${-Number(sens)}"]`);
            suivant?.focus({ preventScroll: true });
            return;
        }

        const retirer = e.target.closest('[data-retirer]');
        if (retirer) {
            const [j, i] = retirer.dataset.retirer.split('|');
            brouillon.jours[j].exos.splice(Number(i), 1);
            afficherEditeur();
            editeur.querySelector(`[data-ajout="${j}"]`)?.focus({ preventScroll: true });
            return;
        }

        const action = e.target.closest('[data-perso]')?.dataset.perso;
        if (action === 'annuler') {
            fermerEditeur();
            $('prog-freq').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        if (action === 'enregistrer') {
            const choisis = JOURS_ENTRAINEMENT.filter(j => brouillon.jours[j]);
            const erreur = $('perso-erreur');
            if (!choisis.length) {
                erreur.textContent = t("Choisis au moins un jour d'entraînement.");
                return;
            }
            const sansExercice = choisis.find(j => !brouillon.jours[j].exos.length);
            if (sansExercice !== undefined) {
                erreur.textContent = t('Ajoute au moins un exercice le {jour}.', { jour: t(NOMS_JOURS[sansExercice]) });
                editeur.querySelector(`[data-ajout="${sansExercice}"]`)?.focus();
                return;
            }
            // Les exercices changés avec « ⇄ » ne correspondent plus aux nouvelles positions
            Object.keys(choix).filter(cle => cle.includes('|perso-')).forEach(cle => delete choix[cle]);
            ecrireStockage(CLE_EXERCICES, choix);
            perso = { jours: Object.fromEntries(choisis.map(j => [j, { nom: brouillon.jours[j].nom.trim(), exos: brouillon.jours[j].exos }])) };
            ecrireStockage(CLE_PERSO, perso);
            installerPerso(perso);
            fermerEditeur();
            changerJours('perso');
            $('prog-freq').scrollIntoView({ behavior: 'smooth', block: 'start' });
            afficherToast(`<span class="toast__icone" aria-hidden="true">✅</span><span class="toast__texte"><strong>${t('Programme enregistré !')}</strong></span>`, 3000);
        }

        if (action === 'supprimer') {
            if (!window.confirm(t('Supprimer ton programme ? Ton carnet et tes progrès sont gardés.'))) return;
            perso = null;
            try { localStorage.removeItem(CLE_PERSO); } catch (erreur) { /* stockage indisponible */ }
            SauvegardeEnLigne.planifier();
            installerPerso(null);
            fermerEditeur();
            changerJours(prog.joursDefaut);
        }
    });

    const choisirSeance = (id, defiler) => {
        seanceActive = id;
        carnetOuvert = null;
        afficherSeance();
        if (defiler) $('prog-onglets').scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    $('prog-onglets').addEventListener('click', e => {
        const onglet = e.target.closest('[data-seance]');
        if (onglet) choisirSeance(onglet.dataset.seance, false);
    });

    $('prog-semaine').addEventListener('click', e => {
        const jour = e.target.closest('button[data-seance]');
        if (jour) choisirSeance(jour.dataset.seance, true);
    });

    $('prog-seance').addEventListener('click', e => {
        if (e.target.closest('[data-guide-start]')) {
            ouvrirGuide();
            return;
        }

        if (e.target.closest('[data-outils]')) {
            ouvrirOutils();
            return;
        }

        const boutonVideo = e.target.closest('[data-video]');
        if (boutonVideo) {
            ouvrirVideo(boutonVideo.dataset.video);
            return;
        }

        const boutonRecup = e.target.closest('[data-recup]');
        if (boutonRecup) {
            const action = boutonRecup.dataset.recup;
            if (action === 'activer') {
                if (!window.confirm(t('Commencer une semaine légère ? Pendant 7 jours : moins de séries et des poids environ 10 % plus légers.'))) return;
                etatRecup = { debut: Date.now() };
            }
            // Arrêter = la semaine légère est considérée comme finie maintenant
            if (action === 'arreter') etatRecup = { debut: Date.now() - DUREE_RECUP };
            if (action === 'reporter') etatRecup = { ...etatRecup, reporte: Date.now() };
            ecrireStockage(CLE_RECUP, etatRecup);
            carnetOuvert = null;
            afficherSeance();
            return;
        }

        const boutonRepos = e.target.closest('[data-repos]');
        if (boutonRepos) {
            minuteur.lancer(Number(boutonRepos.dataset.repos), boutonRepos.dataset.nom);
            return;
        }

        const boutonChanger = e.target.closest('[data-changer]');
        if (boutonChanger) {
            const i = Number(boutonChanger.dataset.changer);
            const liste = exercicesSeance(seanceActive);
            const alts = alternatives(liste, i);
            const suivant = alts[(alts.indexOf(liste[i].id) + 1) % alts.length];
            const cle = cleChoix(seanceActive, i);
            if (suivant === liste[i].origine) delete choix[cle];
            else choix[cle] = suivant;
            ecrireStockage(CLE_EXERCICES, choix);
            afficherSeance([i]);
            return;
        }

        const boutonNoter = e.target.closest('[data-noter]');
        if (boutonNoter) {
            const i = Number(boutonNoter.dataset.noter);
            carnetOuvert = carnetOuvert === i ? null : i;
            afficherSeance();
            if (carnetOuvert !== null) {
                const formulaire = $('prog-seance').querySelector(`[data-carnet="${i}"]`);
                formulaire.querySelector('input:not([disabled])').focus({ preventScroll: true });
                formulaire.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
            return;
        }

        if (e.target.closest('[data-reset]')) {
            SEANCES[seanceActive].exos.forEach((_, i) => delete choix[cleChoix(seanceActive, i)]);
            ecrireStockage(CLE_EXERCICES, choix);
            afficherSeance();
        }
    });

    // Une séance faite en semaine légère est marquée : elle ne compte pas comme une stagnation
    const nouvelleEntree = (date, series) => (recupActive() ? { date, series, leger: true } : { date, series });

    // Enregistrement d'une séance dans le carnet
    $('prog-seance').addEventListener('submit', e => {
        const formulaire = e.target.closest('[data-carnet]');
        if (!formulaire) return;
        e.preventDefault();

        const i = Number(formulaire.dataset.carnet);
        const exoId = exercicesSeance(seanceActive)[i].id;
        const series = [...formulaire.querySelectorAll('.carnet__ligne')].map(ligne => ({
            kg: parseFloat(ligne.querySelector('[name="kg"]').value) || 0,
            reps: parseInt(ligne.querySelector('[name="reps"]').value, 10) || 0
        })).filter(serie => serie.reps > 0);

        if (!series.length) {
            formulaire.querySelector('[name="reps"]').focus();
            return;
        }

        const record = detecterRecord(EXERCICES[exoId], carnet[exoId] || [], [], series);
        if (record) feterRecord(t(EXERCICES[exoId].nom), record);
        carnet[exoId] = [nouvelleEntree(new Date().toISOString(), series), ...(carnet[exoId] || [])].slice(0, MAX_ENTREES_CARNET);
        ecrireStockage(CLE_CARNET, carnet);
        carnetOuvert = null;
        afficherSeance([i]);
    });

    // ---------- Séance guidée (facultative) ----------
    // Un exercice à la fois, séries à cocher, minuteur automatique, bilan enregistré dans le carnet.
    // L'état est sauvegardé à chaque action : une séance interrompue peut être reprise pendant 4 h.
    const guideEl = $('guide');
    let guide = null;
    let chronoGuide = null;
    let verrouEcran = null;

    const seanceSauvegardee = () => {
        const etat = lireStockage(CLE_SEANCE_EN_COURS, null);
        const valide = etat && etat.objectif === objectif && etat.seanceId === seanceActive
            && Date.now() - etat.debut < DUREE_REPRISE_SEANCE && Array.isArray(etat.exos);
        return valide ? etat : null;
    };

    const sauverGuide = () => ecrireStockage(CLE_SEANCE_EN_COURS, guide);

    const nouveauGuide = () => ({
        objectif,
        seanceId: seanceActive,
        debut: Date.now(),
        index: 0,
        exos: exercicesSeance(seanceActive).map((e, rang) => {
            const s = schema(EXERCICES[e.id], e.role, rang);
            const derniere = (carnet[e.id] || [])[0];
            return {
                id: e.id,
                role: e.role,
                rang,
                // Poids pré-rempli avec ceux de la dernière fois
                series: Array.from({ length: s.series }, (_, n) => ({ kg: poidsPropose(derniere?.series[n]?.kg) || '', reps: '', fait: false }))
            };
        })
    });

    const formatChrono = ms => {
        const sec = Math.max(0, Math.floor(ms / 1000));
        const h = Math.floor(sec / 3600);
        const mmss = `${String(Math.floor(sec / 60) % 60).padStart(h ? 2 : 1, '0')}:${String(sec % 60).padStart(2, '0')}`;
        return h ? `${h}:${mmss}` : mmss;
    };

    // Répétitions proposées par défaut : celles de la dernière fois, sinon le bas de la fourchette
    const repsParDefaut = (g, n, s) => (carnet[g.id] || [])[0]?.series[n]?.reps || Number(s.reps.match(/\d+/)[0]);

    const garderEcranAllume = async () => {
        try { verrouEcran = await navigator.wakeLock?.request('screen'); } catch (e) { verrouEcran = null; }
    };

    const afficherGuide = () => {
        const g = guide.exos[guide.index];
        const exo = EXERCICES[g.id];
        const s = schema(exo, g.role, g.rang);
        const nom = t(exo.nom);
        const unite = t(exo.duree ? 's' : 'rép.');
        const actuelle = g.series.findIndex(serie => !serie.fait);
        const dernierExo = guide.index === guide.exos.length - 1;
        const faites = guide.exos.reduce((total, e) => total + e.series.filter(x => x.fait).length, 0);
        const total = guide.exos.reduce((somme, e) => somme + e.series.length, 0);
        const derniere = (carnet[g.id] || [])[0];
        const media = exo.img
            ? `<img src="images/exercices/${exo.img.includes('.') ? exo.img : `${exo.img}.webp`}" alt="${nom}" width="400" height="300">`
            : `<span class="exo__emoji" aria-hidden="true">${exo.emoji}</span>`;
        // Échauffement rappelé sur le premier exercice avec charge, tant qu'aucune série n'est faite
        const chauffe = echauffement(guide.exos, Number(g.series[0].kg) || 0);
        const blocChauffe = chauffe && chauffe.rang === guide.index && chauffe.series.length && actuelle === 0
            ? `<p class="guide__echauffement">🔥 <strong>${t('Échauffement :')}</strong> <span dir="ltr">${texteEchauffement(chauffe.series)}</span></p>`
            : '';

        let action;
        if (actuelle !== -1) action = `<button type="button" class="btn btn--primary" data-guide="valider">${t('✓ Série {n} terminée', { n: actuelle + 1 })}</button>`;
        else if (!dernierExo) action = `<button type="button" class="btn btn--primary" data-guide="suivant">${t('Exercice suivant →')}</button>`;
        else action = `<button type="button" class="btn btn--primary" data-guide="terminer">${t('🏁 Terminer la séance')}</button>`;

        guideEl.innerHTML = `
            <div class="guide__haut">
                <button type="button" class="guide__fermer" data-guide="quitter" aria-label="${t('Quitter la séance')}">✕</button>
                <div class="guide__titre">
                    <strong id="guide-titre">${t(SEANCES[guide.seanceId].nom)}</strong>
                    <span>${t('Exercice {i} sur {n}', { i: guide.index + 1, n: guide.exos.length })}</span>
                </div>
                <span class="guide__chrono" id="guide-chrono" aria-label="${t('Durée')}">${formatChrono(Date.now() - guide.debut)}</span>
            </div>
            <div class="guide__progression" aria-hidden="true"><span style="width: ${Math.round((faites / total) * 100)}%"></span></div>
            <div class="guide__corps">
                <div class="guide__contenu">
                    ${videoExercice(g.id)
                        ? `<button type="button" class="guide__media guide__media--video" data-video="${g.id}" aria-label="${t('Voir la vidéo : {nom}', { nom })}">${media}<span class="guide__lecture" aria-hidden="true"><span>▶</span>${t('Voir la vidéo')}</span></button>`
                        : `<div class="guide__media">${media}</div>`}
                    <h2 class="guide__nom">${nom}</h2>
                    <p class="guide__cible">${t('{n} séries', { n: s.series })} × ${t(s.reps)}${exo.duree ? '' : ` ${t('rép.')}`} • ⏱ ${formatRepos(s.repos)}</p>
                    ${derniere ? `<p class="carnet__dernier">${t('📒 Dernière fois ({date}) :', { date: new Date(derniere.date).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' }) })} <strong dir="ltr">${resumeEntree(derniere, unite)}</strong></p>` : ''}
                    ${blocChauffe}
                    <ol class="guide__series">${g.series.map((serie, n) => `
                        <li class="guide__serie${serie.fait ? ' guide__serie--faite' : ''}${n === actuelle ? ' guide__serie--actuelle' : ''}">
                            <span class="guide__num" aria-label="${t('Série {n}', { n: n + 1 })}">${serie.fait ? '✓' : n + 1}</span>
                            <label><input type="number" inputmode="decimal" min="0" step="0.5" data-champ="kg" data-serie="${n}" value="${serie.kg}" placeholder="${exo.duree ? '—' : '0'}" aria-label="${t('Poids série {n}', { n: n + 1 })}"${exo.duree ? ' disabled' : ''}> kg</label>
                            <label><input type="number" inputmode="numeric" min="0" step="1" data-champ="reps" data-serie="${n}" value="${serie.reps}" placeholder="${repsParDefaut(g, n, s)}" aria-label="${t(exo.duree ? 'Secondes série {n}' : 'Répétitions série {n}', { n: n + 1 })}"> ${unite}</label>
                        </li>`).join('')}
                    </ol>
                    ${actuelle === -1 ? `<p class="guide__bravo">${t('Bravo, exercice terminé ! 💪')}</p>` : ''}
                    ${exo.duree ? '' : `<button type="button" class="chip-btn guide__outils" data-guide="outils">${t('🧮 Disques & charge max')}</button>`}
                    <details class="guide__conseil"><summary>${t('💡 Conseil')}</summary><p>${t(exo.conseil)}</p></details>
                </div>
            </div>
            <div class="guide__bas">
                <button type="button" class="guide__nav" data-guide="precedent" aria-label="${t('Exercice précédent')}"${guide.index === 0 ? ' disabled' : ''}>←</button>
                ${action}
                <button type="button" class="guide__nav" data-guide="suivant" aria-label="${t('Exercice suivant')}"${dernierExo ? ' disabled' : ''}>→</button>
            </div>`;
    };

    // Copie les séries faites dans le carnet (une entrée par exercice) ; renvoie le bilan
    const enregistrerGuide = () => {
        const date = new Date().toISOString();
        let series = 0;
        let volume = 0;
        guide.exos.forEach(g => {
            const faites = g.series.filter(x => x.fait).map(x => ({ kg: Number(x.kg) || 0, reps: Number(x.reps) || 0 }));
            if (!faites.length) return;
            series += faites.length;
            if (!EXERCICES[g.id].duree) volume += faites.reduce((somme, x) => somme + x.kg * x.reps, 0);
            carnet[g.id] = [nouvelleEntree(date, faites), ...(carnet[g.id] || [])].slice(0, MAX_ENTREES_CARNET);
        });
        ecrireStockage(CLE_CARNET, carnet);
        try { localStorage.removeItem(CLE_SEANCE_EN_COURS); } catch (e) { /* stockage indisponible */ }
        return { series, volume, minutes: Math.max(1, Math.round((Date.now() - guide.debut) / 60000)) };
    };

    const afficherBilan = bilan => {
        clearInterval(chronoGuide);
        guideEl.innerHTML = `
            <div class="guide__fin">
                <div class="guide__trophee" aria-hidden="true">🏆</div>
                <h2 id="guide-titre">${t('Séance terminée !')}</h2>
                <p>${t(SEANCES[guide.seanceId].nom)}</p>
                <ul class="guide__stats">
                    <li><strong>${bilan.minutes}</strong><span>${t('min')}</span></li>
                    <li><strong>${bilan.series}</strong><span>${t('séries')}</span></li>
                    <li><strong>${formatNombre(bilan.volume)}</strong><span>${t('kg soulevés')}</span></li>
                </ul>
                ${guide.records?.length ? `
                <div class="guide__records">
                    <strong>${t(guide.records.length > 1 ? '🏆 {n} records battus !' : '🏆 1 record battu !', { n: guide.records.length })}</strong>
                    <ul>${guide.records.map(r => `<li>${t(EXERCICES[r.id].nom)} : <b dir="ltr">${r.texte}</b></li>`).join('')}</ul>
                </div>` : ''}
                <p class="guide__sauve">${t('Tout est enregistré dans ton carnet.')}</p>
                <button type="button" class="btn btn--primary" data-guide="fermer">${t('Fermer')}</button>
                <a href="progres.html" class="btn btn--ghost">${t('📈 Voir mes progrès')}</a>
            </div>`;
        guide.fini = true;
        guideEl.querySelector('[data-guide="fermer"]').focus();
    };

    const ouvrirGuide = () => {
        guide = seanceSauvegardee() || nouveauGuide();
        sauverGuide();
        guideEl.hidden = false;
        document.body.classList.add('guide-ouvert');
        afficherGuide();
        guideEl.querySelector('.guide__fermer').focus();
        chronoGuide = setInterval(() => {
            const chrono = document.getElementById('guide-chrono');
            if (chrono) chrono.textContent = formatChrono(Date.now() - guide.debut);
        }, 1000);
        garderEcranAllume();
    };

    const fermerGuide = () => {
        clearInterval(chronoGuide);
        verrouEcran?.release().catch(() => {});
        verrouEcran = null;
        guide = null;
        guideEl.hidden = true;
        guideEl.innerHTML = '';
        document.body.classList.remove('guide-ouvert');
        afficherSeance();
    };

    // Le verrou « écran allumé » est perdu quand on quitte l'application : on le reprend au retour
    document.addEventListener('visibilitychange', () => {
        if (guide && !guide.fini && document.visibilityState === 'visible') garderEcranAllume();
    });

    guideEl.addEventListener('input', e => {
        const champ = e.target.closest('[data-champ]');
        if (!champ || !guide) return;
        const serie = guide.exos[guide.index].series[Number(champ.dataset.serie)];
        serie[champ.dataset.champ] = champ.value;
        // Un poids tapé à la main n'est plus modifié automatiquement
        if (champ.dataset.champ === 'kg') serie.kgModifie = true;
        sauverGuide();
    });

    guideEl.addEventListener('click', e => {
        const boutonVideo = e.target.closest('[data-video]');
        if (boutonVideo) return ouvrirVideo(boutonVideo.dataset.video);
        const action = e.target.closest('[data-guide]')?.dataset.guide;
        if (!action || !guide) return;

        if (action === 'fermer') return fermerGuide();

        if (action === 'quitter') {
            const dejaFait = guide.exos.some(g => g.series.some(x => x.fait));
            if (dejaFait && !window.confirm(t('Quitter la séance ? Les séries déjà faites seront enregistrées dans ton carnet.'))) return;
            if (dejaFait) enregistrerGuide();
            else try { localStorage.removeItem(CLE_SEANCE_EN_COURS); } catch (erreur) { /* stockage indisponible */ }
            return fermerGuide();
        }

        if (action === 'precedent' && guide.index > 0) guide.index--;
        if (action === 'suivant' && guide.index < guide.exos.length - 1) guide.index++;

        if (action === 'valider') {
            const g = guide.exos[guide.index];
            const n = g.series.findIndex(x => !x.fait);
            if (n === -1) return;
            const exo = EXERCICES[g.id];
            const s = schema(exo, g.role, g.rang);
            const serie = g.series[n];
            serie.kg = Number(serie.kg) || 0;
            serie.reps = Number(serie.reps) || repsParDefaut(g, n, s);
            // Record battu ? (par rapport au carnet ET aux séries déjà faites aujourd'hui)
            const record = detecterRecord(exo, carnet[g.id] || [], g.series.filter(x => x.fait), [serie]);
            if (record) {
                guide.records = (guide.records || []).filter(r => r.id !== g.id);
                guide.records.push({ id: g.id, texte: record.texte });
                feterRecord(t(exo.nom), record);
            }
            serie.fait = true;
            // Séries suivantes : elles prennent ce poids, sauf si on les a déjà modifiées à la main
            if (serie.kg) g.series.slice(n + 1).forEach(x => { if (!x.fait && !x.kgModifie) x.kg = serie.kg; });
            const derniereSerieDeLaSeance = guide.index === guide.exos.length - 1 && n === g.series.length - 1;
            if (!derniereSerieDeLaSeance) minuteur.lancer(s.repos, t(exo.nom));
        }

        if (action === 'outils') {
            const g = guide.exos[guide.index];
            const s = schema(EXERCICES[g.id], g.role, g.rang);
            const n = Math.max(0, g.series.findIndex(x => !x.fait));
            return ouvrirOutils({ kg: Number(g.series[n].kg) || '', reps: Number(g.series[n].reps) || repsParDefaut(g, n, s) });
        }

        if (action === 'terminer') return afficherBilan(enregistrerGuide());

        sauverGuide();
        afficherGuide();
        if (action === 'precedent' || action === 'suivant') guideEl.querySelector('.guide__corps').scrollTop = 0;
    });

    afficherProgramme();
}

/* ==========================================================
   PAGE « MES PROGRÈS »
   Tout est calculé à partir du carnet (localStorage) : rien
   n'est envoyé nulle part. Une séance = un jour où au moins un
   exercice a été noté. Les semaines commencent le dimanche.
   ========================================================== */

const SEMAINES_ACTIVITE = 12;
const UN_JOUR = 24 * 60 * 60 * 1000;
const CLE_POIDS = 'ironpulse-poids';
const CLES_SAUVEGARDE = [CLE_CARNET, CLE_EXERCICES, CLE_JOURS, 'ironpulse-calculateur', CLE_POIDS, CLE_PERSO, CLE_RECUP, CLE_REPAS];

// Date locale « 2026-10-26 » (pas d'UTC : une séance du soir reste sur le bon jour)
const cleJour = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const dateDeJour = cle => {
    const [a, m, j] = cle.split('-').map(Number);
    return new Date(a, m - 1, j);
};
const debutSemaine = date => new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay());
const formatCompact = n => new Intl.NumberFormat(LOCALE, { notation: n >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(Math.round(n));
const formatDateCourte = date => date.toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' });
const formatDateLongue = date => date.toLocaleDateString(LOCALE, { weekday: 'short', day: 'numeric', month: 'short' });

// Graduations « rondes » pour l'axe vertical (0, 20, 40… ou 70, 72,5, 75…)
function graduations(min, max, nombre = 4) {
    if (min === max) {
        min = Math.max(0, min - 5);
        max += 5;
    }
    const brut = (max - min) / nombre;
    const puissance = 10 ** Math.floor(Math.log10(brut));
    const pas = [1, 2, 2.5, 5, 10].map(k => k * puissance).find(k => k >= brut);
    const ticks = [];
    for (let v = Math.floor(min / pas) * pas; v <= Math.ceil(max / pas) * pas + 1e-9; v += pas) ticks.push(Number(v.toFixed(2)));
    return ticks;
}

/* Courbe d'une seule série (ligne 2 px, points cerclés, voile à 10 %), avec repère et
   info-bulle au survol / au doigt / au clavier. points : [{ date, valeur, detail }] */
function tracerCourbe(conteneur, points, formater) {
    const W = conteneur.clientWidth;
    const H = 230;
    const m = { haut: 24, droite: 18, bas: 30, gauche: 46 };
    const largeur = W - m.gauche - m.droite;
    const hauteur = H - m.haut - m.bas;
    const valeurs = points.map(p => p.valeur);
    const ticks = graduations(Math.min(...valeurs), Math.max(...valeurs));
    const yMin = ticks[0];
    const yMax = ticks[ticks.length - 1];
    const t0 = points[0].date.getTime();
    const t1 = points[points.length - 1].date.getTime();
    const x = p => m.gauche + (t1 === t0 ? largeur / 2 : ((p.date.getTime() - t0) / (t1 - t0)) * largeur);
    const y = v => m.haut + hauteur - ((v - yMin) / (yMax - yMin || 1)) * hauteur;
    const bas = m.haut + hauteur;

    const ligne = points.map((p, i) => `${i ? 'L' : 'M'}${x(p).toFixed(1)},${y(p.valeur).toFixed(1)}`).join(' ');
    const aire = `${ligne} L${x(points[points.length - 1]).toFixed(1)},${bas} L${x(points[0]).toFixed(1)},${bas} Z`;
    const dernier = points[points.length - 1];
    const ancreFin = x(dernier) > W - 90 ? 'end' : 'start';

    conteneur.innerHTML = `
        <svg class="courbe__svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true">
            ${ticks.map(v => `
                <line class="courbe__grille" x1="${m.gauche}" x2="${W - m.droite}" y1="${y(v)}" y2="${y(v)}"/>
                <text class="courbe__axe" x="${m.gauche - 8}" y="${y(v) + 4}" text-anchor="end">${v.toLocaleString(LOCALE)}</text>`).join('')}
            <text class="courbe__axe" x="${x(points[0])}" y="${H - 8}" text-anchor="${points.length > 1 ? 'start' : 'middle'}">${formatDateCourte(points[0].date)}</text>
            ${points.length > 1 ? `<text class="courbe__axe" x="${x(dernier)}" y="${H - 8}" text-anchor="end">${formatDateCourte(dernier.date)}</text>` : ''}
            ${points.length > 1 ? `<path class="courbe__aire" d="${aire}"/><path class="courbe__ligne" d="${ligne}"/>` : ''}
            <line class="courbe__repere" x1="0" x2="0" y1="${m.haut}" y2="${bas}" visibility="hidden"/>
            ${points.map((p, i) => `<circle class="courbe__point" data-i="${i}" cx="${x(p)}" cy="${y(p.valeur)}" r="4.5"/>`).join('')}
            <text class="courbe__etiquette" x="${x(dernier) + (ancreFin === 'end' ? -10 : 10)}" y="${y(dernier.valeur) - 10}" text-anchor="${ancreFin}">${formater(dernier.valeur)}</text>
        </svg>
        <div class="courbe__bulle" role="status" hidden></div>`;

    const svg = conteneur.querySelector('svg');
    const repere = svg.querySelector('.courbe__repere');
    const bulle = conteneur.querySelector('.courbe__bulle');
    const cercles = [...svg.querySelectorAll('.courbe__point')];
    let actif = -1;

    const montrer = i => {
        actif = i;
        const p = points[i];
        repere.setAttribute('x1', x(p));
        repere.setAttribute('x2', x(p));
        repere.setAttribute('visibility', 'visible');
        cercles.forEach((c, j) => c.classList.toggle('courbe__point--actif', j === i));
        bulle.innerHTML = `<span>${formatDateLongue(p.date)}</span><strong>${formater(p.valeur)}</strong><small dir="ltr">${p.detail}</small>`;
        bulle.hidden = false;
        const gauche = Math.min(Math.max(x(p) - bulle.offsetWidth / 2, 4), W - bulle.offsetWidth - 4);
        bulle.style.left = `${gauche}px`;
        bulle.style.top = `${Math.max(y(p.valeur) - bulle.offsetHeight - 14, 0)}px`;
    };
    const cacher = () => {
        actif = -1;
        repere.setAttribute('visibility', 'hidden');
        cercles.forEach(c => c.classList.remove('courbe__point--actif'));
        bulle.hidden = true;
    };
    // Le point le plus proche horizontalement : pas besoin de viser le petit rond
    const plusProche = clientX => {
        const px = clientX - svg.getBoundingClientRect().left;
        let meilleur = 0;
        points.forEach((p, i) => { if (Math.abs(x(p) - px) < Math.abs(x(points[meilleur]) - px)) meilleur = i; });
        return meilleur;
    };

    svg.addEventListener('pointermove', e => montrer(plusProche(e.clientX)));
    svg.addEventListener('pointerdown', e => montrer(plusProche(e.clientX)));
    svg.addEventListener('pointerleave', e => { if (e.pointerType === 'mouse') cacher(); });
    conteneur.onkeydown = e => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
            e.preventDefault();
            const suivant = actif === -1 ? points.length - 1 : actif + (e.key === 'ArrowRight' ? 1 : -1);
            montrer(Math.min(Math.max(suivant, 0), points.length - 1));
        }
        if (e.key === 'Escape') cacher();
    };
    conteneur.onblur = cacher;
}

function initProgres() {
    const $ = id => document.getElementById(id);
    let carnet = {};
    try { carnet = JSON.parse(localStorage.getItem(CLE_CARNET)) || {}; } catch (e) { carnet = {}; }

    initSauvegarde();

    // Toutes les entrées du carnet, avec leur exercice et leur jour
    const entrees = Object.entries(carnet)
        .filter(([id, liste]) => EXERCICES[id] && Array.isArray(liste))
        .flatMap(([id, liste]) => liste.map(entree => ({ id, ...entree, jour: cleJour(new Date(entree.date)) })));

    if (!entrees.length) {
        $('progres-vide').hidden = false;
        return;
    }
    $('progres-contenu').hidden = false;

    const volumeEntree = entree => (EXERCICES[entree.id].duree ? 0 : entree.series.reduce((somme, s) => somme + (s.kg || 0) * (s.reps || 0), 0));

    // ---------- Résumé ----------
    const jours = new Set(entrees.map(e => e.jour));
    const aujourdhui = new Date();
    const cetteSemaine = debutSemaine(aujourdhui);
    const semaines = new Set([...jours].map(j => cleJour(debutSemaine(dateDeJour(j)))));
    const seancesSemaine = [...jours].filter(j => dateDeJour(j) >= cetteSemaine).length;

    // Semaines d'affilée : la semaine en cours compte si elle a déjà une séance, sinon on part de la précédente
    let serie = 0;
    let semaine = semaines.has(cleJour(cetteSemaine)) ? cetteSemaine : new Date(cetteSemaine.getTime() - 7 * UN_JOUR);
    while (semaines.has(cleJour(semaine))) {
        serie++;
        semaine = new Date(semaine.getFullYear(), semaine.getMonth(), semaine.getDate() - 7);
    }
    const volumeTotal = entrees.reduce((somme, e) => somme + volumeEntree(e), 0);

    $('tuiles-globales').innerHTML = [
        [t('Séances'), formatNombre(jours.size)],
        [t('Cette semaine'), formatNombre(seancesSemaine)],
        [t("Semaines d'affilée"), `${formatNombre(serie)}${serie >= 2 ? ' 🔥' : ''}`],
        [t('Kg soulevés'), formatCompact(volumeTotal)]
    ].map(([libelle, valeur]) => `<li class="tuile"><span class="tuile__libelle">${libelle}</span><strong class="tuile__valeur">${valeur}</strong></li>`).join('');

    // ---------- Activité : 12 semaines × 7 jours ----------
    const exosParJour = {};
    entrees.forEach(e => { (exosParJour[e.jour] = exosParJour[e.jour] || new Set()).add(e.id); });
    const premiere = new Date(cetteSemaine.getFullYear(), cetteSemaine.getMonth(), cetteSemaine.getDate() - 7 * (SEMAINES_ACTIVITE - 1));
    const libellesJours = NOMS_JOURS.map(nom => `<span class="activite__jour">${t(nom)}</span>`).join('');
    const cases = [];
    for (let s = 0; s < SEMAINES_ACTIVITE; s++) {
        for (let d = 0; d < 7; d++) {
            const date = new Date(premiere.getFullYear(), premiere.getMonth(), premiere.getDate() + s * 7 + d);
            const cle = cleJour(date);
            const nbExos = exosParJour[cle]?.size || 0;
            const futur = date > aujourdhui;
            const texte = `${formatDateLongue(date)} — ${nbExos ? t(nbExos > 1 ? '{n} exercices notés' : '{n} exercice noté', { n: nbExos }) : t('Repos')}`;
            const classes = ['activite__case', nbExos ? 'activite__case--faite' : '', futur ? 'activite__case--futur' : '', cle === cleJour(aujourdhui) ? 'activite__case--aujourdhui' : ''].filter(Boolean).join(' ');
            cases.push(`<span class="${classes}" title="${texte}" ${futur ? 'aria-hidden="true"' : `role="img" aria-label="${texte}"`}></span>`);
        }
    }
    $('activite').innerHTML = libellesJours + cases.join('');

    // ---------- Progression par exercice ----------
    const dernierJour = id => carnet[id].reduce((max, e) => (e.date > max ? e.date : max), '');
    const exercicesNotes = Object.keys(carnet).filter(id => EXERCICES[id] && carnet[id].length)
        .sort((a, b) => dernierJour(b).localeCompare(dernierJour(a)));
    const select = $('choix-exercice');
    select.innerHTML = exercicesNotes.map(id => `<option value="${id}">${t(EXERCICES[id].nom)}</option>`).join('');

    const afficherExercice = id => {
        const exo = EXERCICES[id];
        const liste = [...carnet[id]].sort((a, b) => a.date.localeCompare(b.date));
        const avecPoids = !exo.duree && liste.some(e => e.series.some(s => s.kg > 0));
        const unite = t(exo.duree ? 's' : 'rép.');
        // Ce qu'on suit : le meilleur poids, sinon les meilleures répétitions / secondes
        const valeur = e => Math.max(...e.series.map(s => (avecPoids ? s.kg || 0 : s.reps || 0)));
        const formater = v => (avecPoids ? formatKg(v) : exo.duree ? t('{n} s', { n: v }) : `${v.toLocaleString(LOCALE)} ${t('rép.')}`);
        $('courbe-sous').textContent = t(avecPoids ? 'Meilleur poids de chaque séance' : exo.duree ? 'Meilleur temps de chaque séance' : 'Meilleures répétitions de chaque séance');

        const points = liste.map(e => ({ date: new Date(e.date), valeur: valeur(e), detail: resumeEntree(e, unite) }));
        const record = points.reduce((meilleur, p) => (p.valeur > meilleur.valeur ? p : meilleur), points[0]);
        const ecart = points[points.length - 1].valeur - points[0].valeur;
        const signe = ecart > 0 ? '▲ +' : ecart < 0 ? '▼ −' : '';

        $('tuiles-exercice').innerHTML = [
            [t('Record'), formater(record.valeur), formatDateCourte(record.date)],
            [t('Depuis le début'), points.length > 1 ? `${signe}${formater(Math.abs(ecart))}` : '—', points.length > 1 ? t('depuis le {date}', { date: formatDateCourte(points[0].date) }) : ''],
            [t('Séances'), formatNombre(points.length), '']
        ].map(([libelle, val, note]) => `<li class="tuile"><span class="tuile__libelle">${libelle}</span><strong class="tuile__valeur">${val}</strong>${note ? `<span class="tuile__note">${note}</span>` : ''}</li>`).join('');

        const courbe = $('courbe');
        courbe.setAttribute('role', 'img');
        courbe.setAttribute('aria-label', `${t(exo.nom)} — ${$('courbe-sous').textContent}. ${t('Record')} : ${formater(record.valeur)}.`);
        const dessiner = () => tracerCourbe(courbe, points, formater);
        dessiner();
        courbe._redessiner = dessiner;
        $('courbe-note').hidden = points.length > 1;

        // Estimation de la charge max à partir de la meilleure série du record (exercices avec charge)
        const boutonOutils = $('outils-exercice');
        boutonOutils.hidden = !avecPoids;
        if (avecPoids) {
            const meilleure = liste.flatMap(e => e.series).filter(s => s.kg === record.valeur).sort((a, b) => b.reps - a.reps)[0];
            boutonOutils.onclick = () => ouvrirOutils({ kg: meilleure.kg, reps: meilleure.reps, onglet: 'max' });
        }

        // Tableau : la version texte de la courbe, de la plus récente à la plus ancienne
        $('detail-lignes').innerHTML = [...points].reverse().map(p =>
            `<tr><td>${formatDateLongue(p.date)}</td><td dir="ltr">${p.detail}</td><td>${formater(p.valeur)}</td></tr>`).join('');
    };

    select.addEventListener('change', () => afficherExercice(select.value));
    afficherExercice(exercicesNotes[0]);

    // La courbe s'adapte à la largeur (rotation du téléphone, fenêtre redimensionnée)
    let largeurPrecedente = $('courbe').clientWidth;
    new ResizeObserver(() => {
        const courbe = $('courbe');
        if (courbe.clientWidth !== largeurPrecedente && courbe._redessiner) {
            largeurPrecedente = courbe.clientWidth;
            courbe._redessiner();
        }
    }).observe($('courbe'));

    // ---------- Dernières séances ----------
    const parJour = {};
    entrees.forEach(e => (parJour[e.jour] = parJour[e.jour] || []).push(e));
    $('historique').innerHTML = Object.keys(parJour).sort().reverse().slice(0, 8).map(jour => {
        const liste = parJour[jour];
        const nbSeries = liste.reduce((somme, e) => somme + e.series.length, 0);
        const volume = liste.reduce((somme, e) => somme + volumeEntree(e), 0);
        const noms = [...new Set(liste.map(e => t(EXERCICES[e.id].nom)))];
        return `
            <li class="historique__ligne">
                <div class="historique__date">${formatDateLongue(dateDeJour(jour))}</div>
                <div class="historique__infos">
                    <strong>${[
                        t(noms.length > 1 ? '{n} exercices' : '{n} exercice', { n: noms.length }),
                        t(nbSeries > 1 ? '{n} séries' : '{n} série', { n: nbSeries }),
                        volume ? `${formatCompact(volume)} kg` : ''
                    ].filter(Boolean).join(' • ')}</strong>
                    <span>${noms.join(', ')}</span>
                </div>
            </li>`;
    }).join('');
}

// Sauvegarde / restauration : le carnet n'existe que sur l'appareil, on permet d'en garder une copie
function initSauvegarde() {
    const message = document.getElementById('donnees-message');

    document.getElementById('exporter').addEventListener('click', () => {
        const donnees = {};
        CLES_SAUVEGARDE.forEach(cle => {
            try {
                const valeur = localStorage.getItem(cle);
                if (valeur !== null) donnees[cle] = valeur;
            } catch (e) { /* stockage indisponible */ }
        });
        const fichier = new Blob([JSON.stringify({ application: 'iron-pulse', version: 1, date: new Date().toISOString(), donnees }, null, 2)], { type: 'application/json' });
        const lien = document.createElement('a');
        lien.href = URL.createObjectURL(fichier);
        lien.download = `iron-pulse-sauvegarde-${cleJour(new Date())}.json`;
        document.body.appendChild(lien);
        lien.click();
        lien.remove();
        setTimeout(() => URL.revokeObjectURL(lien.href), 1000);
        message.textContent = t('Sauvegarde téléchargée. Garde ce fichier en lieu sûr.');
    });

    document.getElementById('importer').addEventListener('change', async e => {
        const fichier = e.target.files[0];
        e.target.value = '';
        if (!fichier) return;
        try {
            const contenu = JSON.parse(await fichier.text());
            if (contenu.application !== 'iron-pulse' || typeof contenu.donnees !== 'object') throw new Error('format');
            JSON.parse(contenu.donnees[CLE_CARNET] || '{}');
            if (!window.confirm(t('Remplacer les données de cet appareil par cette sauvegarde ?'))) return;
            CLES_SAUVEGARDE.forEach(cle => {
                if (typeof contenu.donnees[cle] === 'string') localStorage.setItem(cle, contenu.donnees[cle]);
            });
            SauvegardeEnLigne.planifier();
            message.textContent = t('Sauvegarde restaurée ✓');
            setTimeout(() => location.reload(), 800);
        } catch (erreur) {
            message.textContent = t("Ce fichier n'est pas une sauvegarde Iron Pulse valide.");
        }
    });
}

/* ==========================================================
   SAUVEGARDE EN LIGNE — chiffrée sur le téléphone
   Un code personnel (12 caractères) sert à la fois d'identifiant
   (empreinte SHA-256 envoyée au serveur) et de clé de chiffrement
   (AES-GCM, clé dérivée par PBKDF2). Le serveur (functions/api/
   sauvegarde.js) ne reçoit qu'un bloc illisible. Copie automatique
   après chaque modification du carnet, ou au retour du réseau.
   ========================================================== */

const CLE_CODE_EN_LIGNE = 'ironpulse-cloud-code';
const CLE_ETAT_EN_LIGNE = 'ironpulse-cloud-etat';
const URL_SAUVEGARDE = '/api/sauvegarde';
// Sans I, L, O, 0 ni 1 : impossible de confondre en recopiant le code
const ALPHABET_CODE = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const EVENEMENT_SAUVEGARDE = 'ironpulse:sauvegarde';

const versBase64 = octets => {
    let binaire = '';
    new Uint8Array(octets).forEach(o => { binaire += String.fromCharCode(o); });
    return btoa(binaire);
};
const depuisBase64 = texte => Uint8Array.from(atob(texte), c => c.charCodeAt(0));
const versHex = octets => [...new Uint8Array(octets)].map(o => o.toString(16).padStart(2, '0')).join('');
const empreinte = async texte => versHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texte)));

const SauvegardeEnLigne = {
    disponible: () => Boolean(window.crypto?.subtle) && location.protocol.startsWith('http'),

    lireCode() {
        try { return localStorage.getItem(CLE_CODE_EN_LIGNE); } catch (e) { return null; }
    },

    lireEtat() {
        try { return JSON.parse(localStorage.getItem(CLE_ETAT_EN_LIGNE)) || {}; } catch (e) { return {}; }
    },

    ecrireEtat(etat) {
        try { localStorage.setItem(CLE_ETAT_EN_LIGNE, JSON.stringify(etat)); } catch (e) { /* stockage indisponible */ }
        document.dispatchEvent(new CustomEvent(EVENEMENT_SAUVEGARDE, { detail: etat }));
    },

    // 12 caractères tirés sans biais (on rejette les valeurs qui fausseraient le tirage) : « K7QM-3XTP-9WHN »
    genererCode() {
        const limite = 256 - (256 % ALPHABET_CODE.length);
        let code = '';
        while (code.length < 12) {
            crypto.getRandomValues(new Uint8Array(24)).forEach(v => {
                if (v < limite && code.length < 12) code += ALPHABET_CODE[v % ALPHABET_CODE.length];
            });
        }
        return code.match(/.{4}/g).join('-');
    },

    // Accepte minuscules, espaces et tirets ; renvoie null si le code n'est pas valide
    normaliserCode(saisie) {
        const brut = String(saisie).toUpperCase().replace(/[^A-Z0-9]/g, '');
        if (brut.length !== 12 || [...brut].some(c => !ALPHABET_CODE.includes(c))) return null;
        return brut.match(/.{4}/g).join('-');
    },

    async cles(code) {
        const encodeur = new TextEncoder();
        const id = await empreinte(`iron-pulse:id:${code}`);
        const base = await crypto.subtle.importKey('raw', encodeur.encode(code), 'PBKDF2', false, ['deriveKey']);
        const cle = await crypto.subtle.deriveKey(
            { name: 'PBKDF2', salt: encodeur.encode('iron-pulse:sel:v1'), iterations: 150000, hash: 'SHA-256' },
            base, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
        return { id, cle };
    },

    // Mêmes données que la sauvegarde par fichier
    contenu() {
        const donnees = {};
        CLES_SAUVEGARDE.forEach(cle => {
            try {
                const valeur = localStorage.getItem(cle);
                if (valeur !== null) donnees[cle] = valeur;
            } catch (e) { /* stockage indisponible */ }
        });
        return JSON.stringify(donnees);
    },

    async envoyer({ forcer = false } = {}) {
        const code = this.lireCode();
        if (!code || !this.disponible()) return null;
        const texte = this.contenu();
        const signature = await empreinte(texte);
        const etat = this.lireEtat();
        if (!forcer && etat.empreinte === signature && !etat.enAttente) return etat;

        try {
            const { id, cle } = await this.cles(code);
            const iv = crypto.getRandomValues(new Uint8Array(12));
            const chiffre = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cle, new TextEncoder().encode(texte));
            const reponse = await fetch(`${URL_SAUVEGARDE}?id=${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ iv: versBase64(iv), donnees: versBase64(chiffre) })
            });
            if (!reponse.ok) throw new Error(reponse.status === 503 ? 'non-configure' : `http-${reponse.status}`);
            const resultat = await reponse.json();
            const nouvelEtat = { date: resultat.date, empreinte: signature, enAttente: false };
            this.ecrireEtat(nouvelEtat);
            return nouvelEtat;
        } catch (erreur) {
            // Pas de réseau ou serveur indisponible : on réessaiera (retour du réseau, prochaine visite)
            const nouvelEtat = { ...etat, enAttente: true, erreur: erreur.message === 'non-configure' ? 'non-configure' : 'reseau' };
            this.ecrireEtat(nouvelEtat);
            throw erreur;
        }
    },

    // Regroupe les modifications rapprochées (plusieurs séries notées d'affilée) en un seul envoi
    planifier() {
        if (!this.lireCode()) return;
        clearTimeout(this._minuterie);
        this._minuterie = setTimeout(() => this.envoyer().catch(() => {}), 3000);
    },

    async recuperer(code) {
        const { id, cle } = await this.cles(code);
        const reponse = await fetch(`${URL_SAUVEGARDE}?id=${id}`, { cache: 'no-store' });
        if (reponse.status === 404) throw new Error('introuvable');
        if (!reponse.ok) throw new Error(reponse.status === 503 ? 'non-configure' : 'reseau');
        const sauvegarde = await reponse.json();
        try {
            const clair = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: depuisBase64(sauvegarde.iv) }, cle, depuisBase64(sauvegarde.donnees));
            return { donnees: JSON.parse(new TextDecoder().decode(clair)), date: sauvegarde.date };
        } catch (e) {
            throw new Error('illisible');
        }
    },

    async supprimer() {
        const code = this.lireCode();
        if (!code) return;
        const { id } = await this.cles(code);
        await fetch(`${URL_SAUVEGARDE}?id=${id}`, { method: 'DELETE' });
    },

    oublier() {
        try {
            localStorage.removeItem(CLE_CODE_EN_LIGNE);
            localStorage.removeItem(CLE_ETAT_EN_LIGNE);
        } catch (e) { /* stockage indisponible */ }
        document.dispatchEvent(new CustomEvent(EVENEMENT_SAUVEGARDE, { detail: {} }));
    }
};

// Bloc « Sauvegarde en ligne » de la page Progrès
function initSauvegardeEnLigne() {
    const bloc = document.getElementById('cloud');
    if (!bloc) return;
    const message = document.getElementById('donnees-message');
    let codeVisible = false;

    const formatDateHeure = iso => new Date(iso).toLocaleString(LOCALE, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

    const afficher = () => {
        const code = SauvegardeEnLigne.lireCode();
        if (!SauvegardeEnLigne.disponible()) {
            bloc.innerHTML = `<p class="bloc__texte">${t('La sauvegarde en ligne fonctionne sur le site en ligne (pas en ouvrant le fichier sur l\'ordinateur).')}</p>`;
            return;
        }

        if (!code) {
            bloc.innerHTML = `
                <p class="bloc__texte">${t('☁️ Protège ton carnet : une copie chiffrée part automatiquement en ligne après chaque séance. Avec ton code personnel, tu la retrouves sur n\'importe quel téléphone.')}</p>
                <div class="donnees__actions">
                    <button type="button" class="btn btn--primary" data-cloud="activer">${t('☁️ Activer la sauvegarde en ligne')}</button>
                    <button type="button" class="btn btn--ghost" data-cloud="retrouver">${t('🔑 J\'ai déjà un code')}</button>
                </div>
                <form class="cloud__retrouver" id="cloud-retrouver" hidden>
                    <label class="field__label" for="cloud-saisie">${t('Ton code personnel')}</label>
                    <input class="cloud__saisie" id="cloud-saisie" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" maxlength="16" placeholder="XXXX-XXXX-XXXX" dir="ltr">
                    <button type="submit" class="btn btn--primary">${t('Retrouver mon carnet')}</button>
                </form>`;
            return;
        }

        const etat = SauvegardeEnLigne.lireEtat();
        let statut;
        if (etat.erreur === 'non-configure' && etat.enAttente) statut = `<p class="cloud__statut cloud__statut--alerte">${t('⚠️ La sauvegarde en ligne n\'est pas encore configurée sur le serveur.')}</p>`;
        else if (etat.enAttente) statut = `<p class="cloud__statut cloud__statut--attente">${t('⏳ En attente de connexion : la copie partira dès que le réseau revient.')}</p>`;
        else if (etat.date) statut = `<p class="cloud__statut cloud__statut--ok">${t('✓ Sauvegardé en ligne le {date}', { date: formatDateHeure(etat.date) })}</p>`;
        else statut = `<p class="cloud__statut cloud__statut--attente">${t('⏳ Première copie en cours…')}</p>`;

        bloc.innerHTML = `
            ${statut}
            <div class="cloud__code">
                <span class="cloud__code-libelle">${t('Ton code personnel')}</span>
                <strong class="cloud__code-valeur" dir="ltr">${codeVisible ? code : '••••-••••-••••'}</strong>
                <div class="cloud__code-actions">
                    <button type="button" class="chip-btn" data-cloud="montrer">${t(codeVisible ? 'Masquer' : 'Afficher')}</button>
                    <button type="button" class="chip-btn" data-cloud="copier">${t('Copier')}</button>
                </div>
            </div>
            <p class="cloud__alerte">${t('⚠️ Garde ce code en lieu sûr (photo, notes…) : sans lui, impossible de récupérer ton carnet sur un autre téléphone. Personne ne peut le retrouver à ta place.')}</p>
            <div class="donnees__actions">
                <button type="button" class="btn btn--ghost" data-cloud="maintenant">${t('↻ Sauvegarder maintenant')}</button>
                <button type="button" class="btn btn--ghost cloud__desactiver" data-cloud="desactiver">${t('Désactiver')}</button>
            </div>`;
    };

    const ecrireMessage = texte => { message.textContent = texte; };

    bloc.addEventListener('click', async e => {
        const action = e.target.closest('[data-cloud]')?.dataset.cloud;
        if (!action) return;

        if (action === 'activer') {
            try { localStorage.setItem(CLE_CODE_EN_LIGNE, SauvegardeEnLigne.genererCode()); } catch (erreur) { return; }
            codeVisible = true;
            SauvegardeEnLigne.ecrireEtat({});
            ecrireMessage(t('Sauvegarde en ligne activée. Note bien ton code !'));
            SauvegardeEnLigne.envoyer({ forcer: true }).catch(() => {});
        }

        if (action === 'retrouver') {
            const formulaire = document.getElementById('cloud-retrouver');
            formulaire.hidden = !formulaire.hidden;
            if (!formulaire.hidden) document.getElementById('cloud-saisie').focus();
            return;
        }

        if (action === 'montrer') codeVisible = !codeVisible;

        if (action === 'copier') {
            try {
                await navigator.clipboard.writeText(SauvegardeEnLigne.lireCode());
                ecrireMessage(t('Code copié ✓'));
            } catch (erreur) {
                codeVisible = true;
                ecrireMessage(t('Copie impossible : recopie le code affiché.'));
            }
        }

        if (action === 'maintenant') {
            ecrireMessage(t('⏳ Sauvegarde en cours…'));
            try {
                await SauvegardeEnLigne.envoyer({ forcer: true });
                ecrireMessage(t('Sauvegarde en ligne à jour ✓'));
            } catch (erreur) {
                ecrireMessage(t(erreur.message === 'non-configure' ? '⚠️ La sauvegarde en ligne n\'est pas encore configurée sur le serveur.' : '⏳ En attente de connexion : la copie partira dès que le réseau revient.'));
            }
        }

        if (action === 'desactiver') {
            if (!window.confirm(t('Désactiver la sauvegarde en ligne ? La copie en ligne sera supprimée (ton carnet reste sur ce téléphone).'))) return;
            try { await SauvegardeEnLigne.supprimer(); } catch (erreur) { /* hors ligne : la copie expirera côté serveur si elle n'est plus utilisée */ }
            SauvegardeEnLigne.oublier();
            codeVisible = false;
            ecrireMessage(t('Sauvegarde en ligne désactivée.'));
        }

        afficher();
    });

    // Retrouver son carnet sur un nouveau téléphone
    bloc.addEventListener('submit', async e => {
        e.preventDefault();
        const code = SauvegardeEnLigne.normaliserCode(document.getElementById('cloud-saisie').value);
        if (!code) {
            ecrireMessage(t('Ce code n\'est pas valide : il contient 12 lettres et chiffres (ex. K7QM-3XTP-9WHN).'));
            return;
        }
        ecrireMessage(t('⏳ Recherche de ta sauvegarde…'));
        try {
            const { donnees, date } = await SauvegardeEnLigne.recuperer(code);
            const carnetLocal = localStorage.getItem(CLE_CARNET);
            const aDesDonnees = carnetLocal && carnetLocal !== '{}';
            if (aDesDonnees && !window.confirm(t('Une sauvegarde du {date} a été trouvée. Remplacer le carnet de ce téléphone par cette sauvegarde ?', { date: formatDateHeure(date) }))) {
                ecrireMessage('');
                return;
            }
            CLES_SAUVEGARDE.forEach(cle => {
                if (typeof donnees[cle] === 'string') localStorage.setItem(cle, donnees[cle]);
            });
            localStorage.setItem(CLE_CODE_EN_LIGNE, code);
            SauvegardeEnLigne.ecrireEtat({ date, empreinte: await empreinte(SauvegardeEnLigne.contenu()), enAttente: false });
            ecrireMessage(t('Carnet récupéré ✓'));
            setTimeout(() => location.reload(), 800);
        } catch (erreur) {
            const messages = {
                introuvable: 'Aucune sauvegarde trouvée pour ce code. Vérifie qu\'il est bien recopié.',
                illisible: 'Aucune sauvegarde trouvée pour ce code. Vérifie qu\'il est bien recopié.',
                'non-configure': '⚠️ La sauvegarde en ligne n\'est pas encore configurée sur le serveur.'
            };
            ecrireMessage(t(messages[erreur.message] || 'Pas de connexion : réessaie quand tu as du réseau.'));
        }
    });

    document.addEventListener(EVENEMENT_SAUVEGARDE, afficher);
    afficher();
}

/* ==========================================================
   RECORDS — fêter quand on bat son meilleur résultat
   Valeur suivie : le poids si l'exercice se fait avec charge,
   sinon les répétitions (poids du corps) ou les secondes (gainage).
   Rien n'est fêté la première fois qu'on fait un exercice.
   ========================================================== */

function detecterRecord(exo, historique, dejaFaites, nouvelles) {
    if (!historique.length) return null;
    const toutes = [...historique.flatMap(e => e.series), ...dejaFaites, ...nouvelles];
    const avecPoids = !exo.duree && toutes.some(s => Number(s.kg) > 0);
    const valeur = s => Number(avecPoids ? s.kg : s.reps) || 0;
    const ancien = Math.max(0, ...historique.flatMap(e => e.series).map(valeur), ...dejaFaites.map(valeur));
    const nouveau = Math.max(0, ...nouvelles.map(valeur));
    if (nouveau <= ancien) return null;
    const texte = avecPoids ? formatKg(nouveau) : exo.duree ? t('{n} s', { n: nouveau }) : `${nouveau} ${t('rép.')}`;
    return { valeur: nouveau, texte, gain: avecPoids ? formatKg(nouveau - ancien) : null };
}

// Message éphémère en haut de l'écran (records, confirmations)
function afficherToast(html, duree = 4500) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.className = 'toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        document.body.appendChild(toast);
    }
    toast.innerHTML = html;
    toast.classList.remove('toast--visible');
    void toast.offsetWidth;
    toast.classList.add('toast--visible');
    clearTimeout(toast._minuterie);
    toast._minuterie = setTimeout(() => toast.classList.remove('toast--visible'), duree);
}

function feterRecord(nomExercice, record) {
    const confettis = Array.from({ length: 14 }, (_, i) => `<span class="toast__confetti" style="--angle: ${i * 26}deg; --delai: ${(i % 4) * 40}ms"></span>`).join('');
    afficherToast(`
        <span class="toast__icone" aria-hidden="true">🏆</span>
        <span class="toast__texte">
            <strong>${t('Nouveau record !')}</strong>
            <span>${nomExercice} : ${record.texte}${record.gain ? ` (+${record.gain})` : ''}</span>
        </span>
        <span class="toast__confettis" aria-hidden="true">${confettis}</span>`);
    if (navigator.vibrate) navigator.vibrate([80, 60, 160]);
}

/* ==========================================================
   OUTILS DE CHARGE — disques à mettre sur la barre et
   estimation de la charge maximale (formule d'Epley)
   ========================================================== */

const CLE_BARRE = 'ironpulse-barre';
const BARRES = [[20, 'Barre olympique (20 kg)'], [15, 'Barre femme (15 kg)'], [10, 'Barre EZ (10 kg)'], [0, 'Machine à disques (sans barre)']];
const DISQUES = [25, 20, 15, 10, 5, 2.5, 1.25];
// Couleurs et tailles des disques de compétition, pour que le dessin ressemble à la vraie barre
const STYLE_DISQUES = {
    25: ['#e5383b', 100], 20: ['#3a86ff', 100], 15: ['#ffbe0b', 86], 10: ['#2bb673', 72],
    5: ['#e4e4e7', 56], 2.5: ['#52525b', 44], 1.25: ['#a1a1aa', 36]
};
const REPS_REFERENCE = [1, 3, 5, 8, 10, 12];

// Disques par côté, du plus lourd au plus léger ; « exact » = faux si la charge n'est pas réalisable
function calculerDisques(total, barre) {
    const parCote = (total - barre) / 2;
    if (!(parCote >= 0)) return null;
    const disques = [];
    let reste = Math.round(parCote * 100) / 100;
    DISQUES.forEach(disque => {
        while (reste + 1e-9 >= disque) {
            disques.push(disque);
            reste = Math.round((reste - disque) * 100) / 100;
        }
    });
    return { disques, charge: barre + 2 * disques.reduce((a, b) => a + b, 0), exact: reste < 0.01 };
}

const chargeMaxEstimee = (kg, reps) => (reps <= 1 ? kg : kg * (1 + reps / 30));
const arrondir25 = kg => Math.round(kg / 2.5) * 2.5;

/* ==========================================================
   VIDÉOS DES EXERCICES — tutoriels YouTube (videos.js), dans la
   langue du site si possible, sinon en anglais puis en français.
   Le lecteur n'est chargé qu'au toucher (youtube-nocookie).
   ========================================================== */

const NOMS_LANGUES = { fr: 'français', en: 'anglais', he: 'hébreu' };

// { id, chaine, langue } ou null si aucune vidéo n'a été retenue pour cet exercice
function videoExercice(exoId) {
    if (typeof VIDEOS === 'undefined') return null;
    for (const langue of [LANGUE, 'en', 'fr']) {
        const video = VIDEOS[langue]?.[exoId];
        if (video) return { id: video[0], chaine: video[1], langue };
    }
    return null;
}

function ouvrirVideo(exoId) {
    const video = videoExercice(exoId);
    if (!video) return;
    document.getElementById('video')?.remove();
    const retour = document.activeElement;
    const nom = t(EXERCICES[exoId].nom);
    const fenetre = document.createElement('div');
    fenetre.id = 'video';
    fenetre.className = 'outil video';
    fenetre.setAttribute('role', 'dialog');
    fenetre.setAttribute('aria-modal', 'true');
    fenetre.setAttribute('aria-labelledby', 'video-titre');
    const adresse = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1&hl=${LANGUE}`;
    fenetre.innerHTML = `
        <div class="outil__fond" data-fermer></div>
        <div class="outil__panneau video__panneau">
            <div class="outil__tete">
                <h2 class="outil__titre" id="video-titre">${nom}</h2>
                <button type="button" class="guide__fermer" data-fermer aria-label="${t('Fermer')}">✕</button>
            </div>
            <div class="video__cadre">
                ${navigator.onLine === false
                    ? `<p class="video__hors-ligne">${t('📶 Pas de connexion : la vidéo sera visible quand tu auras du réseau.')}</p>`
                    // Page ouverte depuis un fichier de l'ordinateur : YouTube refuse la lecture intégrée
                    : location.protocol === 'file:'
                    ? `<p class="video__hors-ligne">${t("La vidéo ne se lit pas quand le site est ouvert depuis un fichier de l'ordinateur. Sur le site en ligne (ou avec Live Server), elle se lit ici.")}<a href="https://www.youtube.com/watch?v=${video.id}" target="_blank" rel="noopener">${t('▶ Regarder sur YouTube')}</a></p>`
                    : `<iframe src="${adresse}" title="${t('Vidéo : {nom}', { nom })}" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`}
            </div>
            <p class="video__source">${t('Vidéo YouTube : {chaine}', { chaine: video.chaine })}${video.langue !== LANGUE ? ` · ${t('en {langue}', { langue: t(NOMS_LANGUES[video.langue]) })}` : ''}</p>
        </div>`;
    document.body.appendChild(fenetre);
    document.body.classList.add('outil-ouvert');

    // Fermer retire le lecteur : la vidéo s'arrête
    const fermer = () => {
        fenetre.remove();
        document.body.classList.remove('outil-ouvert');
        retour?.focus?.({ preventScroll: true });
    };
    fenetre.addEventListener('click', e => { if (e.target.closest('[data-fermer]')) fermer(); });
    fenetre.addEventListener('keydown', e => { if (e.key === 'Escape') fermer(); });
    fenetre.querySelector('.guide__fermer').focus({ preventScroll: true });
}

function ouvrirOutils({ kg = '', reps = '', onglet = 'disques' } = {}) {
    let outil = document.getElementById('outil');
    if (!outil) {
        outil = document.createElement('div');
        outil.id = 'outil';
        outil.className = 'outil';
        outil.hidden = true;
        outil.setAttribute('role', 'dialog');
        outil.setAttribute('aria-modal', 'true');
        outil.setAttribute('aria-labelledby', 'outil-titre');
        let barreChoisie = 20;
        try { barreChoisie = Number(localStorage.getItem(CLE_BARRE) ?? 20); } catch (e) { /* stockage indisponible */ }
        outil.innerHTML = `
            <div class="outil__fond" data-outil="fermer"></div>
            <div class="outil__panneau">
                <div class="outil__tete">
                    <h2 class="outil__titre" id="outil-titre">${t('🧮 Outils de charge')}</h2>
                    <button type="button" class="guide__fermer" data-outil="fermer" aria-label="${t('Fermer')}">✕</button>
                </div>
                <div class="segmented outil__onglets">
                    <input type="radio" name="outil-onglet" id="outil-disques" value="disques">
                    <label for="outil-disques">${t('Disques')}</label>
                    <input type="radio" name="outil-onglet" id="outil-max" value="max">
                    <label for="outil-max">${t('Charge max')}</label>
                </div>

                <section class="outil__section" data-section="disques">
                    <div class="field-row field-row--2">
                        <div class="field">
                            <label class="field__label" for="outil-total">${t('Charge totale')}</label>
                            <div class="input-unit"><input type="number" id="outil-total" inputmode="decimal" min="0" max="500" step="0.5" placeholder="80"><span>kg</span></div>
                        </div>
                        <div class="field">
                            <label class="field__label" for="outil-barre">${t('Barre')}</label>
                            <select class="select" id="outil-barre">${BARRES.map(([poids, nom]) => `<option value="${poids}"${poids === barreChoisie ? ' selected' : ''}>${t(nom)}</option>`).join('')}</select>
                        </div>
                    </div>
                    <div class="barre-dessin" id="outil-dessin" aria-hidden="true"></div>
                    <p class="outil__resultat" id="outil-resultat-disques"></p>
                </section>

                <section class="outil__section" data-section="max" hidden>
                    <div class="field-row field-row--2">
                        <div class="field">
                            <label class="field__label" for="outil-poids">${t('Poids soulevé')}</label>
                            <div class="input-unit"><input type="number" id="outil-poids" inputmode="decimal" min="0" max="500" step="0.5" placeholder="80"><span>kg</span></div>
                        </div>
                        <div class="field">
                            <label class="field__label" for="outil-reps">${t('Répétitions')}</label>
                            <div class="input-unit"><input type="number" id="outil-reps" inputmode="numeric" min="1" max="30" step="1" placeholder="5"><span>${t('rép.')}</span></div>
                        </div>
                    </div>
                    <div id="outil-resultat-max"></div>
                    <p class="outil__note">${t("Estimation (formule d'Epley), fiable jusqu'à 10–12 répétitions. Ne teste jamais ta charge max seul : demande à quelqu'un de te surveiller.")}</p>
                </section>
            </div>`;
        document.body.appendChild(outil);

        const $o = id => outil.querySelector(`#${id}`);

        const dessinerDisques = () => {
            const total = parseFloat($o('outil-total').value);
            const barre = Number($o('outil-barre').value);
            const resultat = $o('outil-resultat-disques');
            const dessin = $o('outil-dessin');
            if (!(total > 0)) {
                dessin.innerHTML = '';
                resultat.textContent = t('Tape la charge totale que tu veux soulever.');
                return;
            }
            const calcul = calculerDisques(total, barre);
            if (!calcul) {
                dessin.innerHTML = '';
                resultat.textContent = t('La charge est plus légère que la barre ({kg}).', { kg: formatKg(barre) });
                return;
            }
            dessin.innerHTML = `${barre ? '<span class="barre-dessin__barre"></span>' : ''}<span class="barre-dessin__butee"></span>${calcul.disques.map(d => {
                const [couleur, hauteur] = STYLE_DISQUES[d];
                return `<span class="barre-dessin__disque" style="--couleur: ${couleur}; --hauteur: ${hauteur}%">${d.toLocaleString(LOCALE)}</span>`;
            }).join('')}<span class="barre-dessin__manchon"></span>`;
            const liste = calcul.disques.map(d => d.toLocaleString(LOCALE)).join(' + ');
            let texte = calcul.disques.length
                ? t('De chaque côté : {liste} kg', { liste })
                : t('Rien à ajouter : juste la barre.');
            if (!calcul.exact) texte += ` ${t('Au plus près : {kg} (impossible exactement avec ces disques).', { kg: formatKg(calcul.charge) })}`;
            resultat.textContent = texte;
        };

        const calculerMax = () => {
            const poids = parseFloat($o('outil-poids').value);
            const reps = parseInt($o('outil-reps').value, 10);
            const zone = $o('outil-resultat-max');
            if (!(poids > 0) || !(reps > 0)) {
                zone.innerHTML = `<p class="outil__resultat">${t('Tape un poids et un nombre de répétitions que tu as réussis.')}</p>`;
                return;
            }
            const max = chargeMaxEstimee(poids, reps);
            zone.innerHTML = `
                <div class="outil__max">
                    <span>${t('Charge max estimée')}</span>
                    <strong>≈ ${formatKg(arrondir25(max))}</strong>
                    ${reps > 12 ? `<small>${t('Au-delà de 12 répétitions, l\'estimation est moins fiable.')}</small>` : ''}
                </div>
                <table class="detail__table outil__table">
                    <thead><tr><th scope="col">${t('Répétitions')}</th><th scope="col">${t('Charge conseillée')}</th></tr></thead>
                    <tbody>${REPS_REFERENCE.map(n => `<tr><td>${t('{n} rép.', { n })}</td><td>${formatKg(arrondir25(max / (1 + (n > 1 ? n : 0) / 30)))}</td></tr>`).join('')}</tbody>
                </table>`;
        };

        const choisirOnglet = nom => {
            outil.querySelector(`input[name="outil-onglet"][value="${nom}"]`).checked = true;
            outil.querySelectorAll('[data-section]').forEach(section => { section.hidden = section.dataset.section !== nom; });
        };

        const fermer = () => {
            outil.hidden = true;
            document.body.classList.remove('outil-ouvert');
            outil._retour?.focus();
        };

        outil.addEventListener('click', e => { if (e.target.closest('[data-outil="fermer"]')) fermer(); });
        outil.addEventListener('keydown', e => { if (e.key === 'Escape') fermer(); });
        outil.addEventListener('change', e => {
            if (e.target.name === 'outil-onglet') choisirOnglet(e.target.value);
            if (e.target.id === 'outil-barre') {
                try { localStorage.setItem(CLE_BARRE, e.target.value); } catch (erreur) { /* stockage indisponible */ }
                dessinerDisques();
            }
        });
        outil.addEventListener('input', e => {
            if (e.target.id === 'outil-total') dessinerDisques();
            if (e.target.id === 'outil-poids' || e.target.id === 'outil-reps') calculerMax();
        });

        outil._preparer = (valeurs) => {
            $o('outil-total').value = valeurs.kg || '';
            $o('outil-poids').value = valeurs.kg || '';
            $o('outil-reps').value = valeurs.reps || '';
            choisirOnglet(valeurs.onglet);
            dessinerDisques();
            calculerMax();
        };
    }

    outil._retour = document.activeElement;
    outil._preparer({ kg, reps, onglet });
    outil.hidden = false;
    document.body.classList.add('outil-ouvert');
    outil.querySelector(onglet === 'max' ? '#outil-poids' : '#outil-total').focus({ preventScroll: true });
}

/* ==========================================================
   POIDS DU CORPS (page Progrès) — une pesée par jour au plus
   ========================================================== */

function initPoids() {
    // On teste le formulaire de pesée (l'accueil a aussi un champ « poids », celui du calculateur)
    if (!document.getElementById('pesee-form')) return;
    const bloc = document.getElementById('poids');
    const $ = id => document.getElementById(id);

    const lire = () => {
        try { return (JSON.parse(localStorage.getItem(CLE_POIDS)) || []).filter(p => p && p.kg > 0 && p.date); } catch (e) { return []; }
    };
    const ecrire = pesees => {
        try { localStorage.setItem(CLE_POIDS, JSON.stringify(pesees)); } catch (e) { /* stockage indisponible */ }
        SauvegardeEnLigne.planifier();
    };

    const afficher = () => {
        const pesees = lire().sort((a, b) => a.date.localeCompare(b.date));
        $('poids-contenu').hidden = !pesees.length;
        if (!pesees.length) return;

        const derniere = pesees[pesees.length - 1];
        const premiere = pesees[0];
        const ecart = derniere.kg - premiere.kg;
        const signe = v => (v > 0 ? `+${formatKg(Math.round(v * 10) / 10)}` : v < 0 ? `−${formatKg(Math.round(-v * 10) / 10)}` : formatKg(0));
        // Comparaison avec la pesée la plus proche d'il y a 4 semaines (au moins 3 semaines d'écart)
        const ilYa4Semaines = new Date(derniere.date).getTime() - 28 * UN_JOUR;
        const reference = [...pesees].reverse().find(p => new Date(p.date).getTime() <= ilYa4Semaines + 7 * UN_JOUR && p !== derniere);
        const semaines = reference ? (new Date(derniere.date) - new Date(reference.date)) / (7 * UN_JOUR) : 0;

        $('tuiles-poids').innerHTML = [
            [t('Poids actuel'), formatKg(derniere.kg), formatDateCourte(new Date(derniere.date))],
            [t('Depuis le début'), pesees.length > 1 ? signe(ecart) : '—', pesees.length > 1 ? t('depuis le {date}', { date: formatDateCourte(new Date(premiere.date)) }) : ''],
            [t('Rythme'), reference && semaines >= 1 ? signe((derniere.kg - reference.kg) / semaines) : '—', t('par semaine')]
        ].map(([libelle, valeur, note]) => `<li class="tuile"><span class="tuile__libelle">${libelle}</span><strong class="tuile__valeur" dir="ltr">${valeur}</strong>${note ? `<span class="tuile__note">${note}</span>` : ''}</li>`).join('');

        const points = pesees.map(p => ({ date: new Date(p.date), valeur: p.kg, detail: '' }));
        const courbe = $('courbe-poids');
        courbe.setAttribute('role', 'img');
        courbe.setAttribute('aria-label', `${t('Poids du corps')} : ${formatKg(derniere.kg)}`);
        tracerCourbe(courbe, points, formatKg);
        $('poids-note').hidden = pesees.length > 1;

        $('poids-lignes').innerHTML = [...pesees].reverse().map(p => `
            <tr>
                <td>${formatDateLongue(new Date(p.date))}</td>
                <td>${formatKg(p.kg)}</td>
                <td><button type="button" class="detail__supprimer" data-supprimer="${p.date}" aria-label="${t('Supprimer la pesée du {date}', { date: formatDateCourte(new Date(p.date)) })}">✕</button></td>
            </tr>`).join('');
    };

    $('pesee-form').addEventListener('submit', e => {
        e.preventDefault();
        const kg = Math.round(parseFloat($('pesee-kg').value) * 10) / 10;
        if (!(kg >= 30 && kg <= 300)) {
            $('pesee-message').textContent = t('Tape un poids entre 30 et 300 kg.');
            return;
        }
        // Une seule pesée par jour : celle du jour remplace la précédente
        const aujourdhui = cleJour(new Date());
        const pesees = lire().filter(p => cleJour(new Date(p.date)) !== aujourdhui);
        pesees.push({ date: new Date().toISOString(), kg });
        ecrire(pesees);

        // Le calculateur de calories utilisera ce poids
        try {
            const calcul = JSON.parse(localStorage.getItem('ironpulse-calculateur'));
            if (calcul) localStorage.setItem('ironpulse-calculateur', JSON.stringify({ ...calcul, poids: kg }));
        } catch (erreur) { /* stockage indisponible */ }

        $('pesee-kg').value = '';
        $('pesee-message').textContent = t('Pesée enregistrée ✓');
        afficher();
    });

    bloc.addEventListener('click', e => {
        const bouton = e.target.closest('[data-supprimer]');
        if (!bouton || !window.confirm(t('Supprimer cette pesée ?'))) return;
        ecrire(lire().filter(p => p.date !== bouton.dataset.supprimer));
        afficher();
    });

    let largeur = $('courbe-poids').clientWidth;
    new ResizeObserver(() => {
        const courbe = $('courbe-poids');
        if (courbe.clientWidth && courbe.clientWidth !== largeur && lire().length) {
            largeur = courbe.clientWidth;
            afficher();
        }
    }).observe($('courbe-poids'));

    afficher();
}

/* ==========================================================
   MINUTEUR DE REPOS
   Basé sur l'heure de fin (et non sur un compteur) pour rester
   juste même si le téléphone ralentit l'onglet.
   ========================================================== */

function creerMinuteur() {
    const el = document.getElementById('timer');
    const tempsEl = document.getElementById('timer-temps');
    const labelEl = document.getElementById('timer-label');
    const anneau = document.getElementById('timer-progress');
    const boutonPause = document.getElementById('timer-pause');
    const circonference = 2 * Math.PI * 21;
    anneau.style.strokeDasharray = circonference;

    let total = 0;        // durée totale en secondes (pour l'anneau)
    let restant = 0;      // millisecondes restantes
    let fin = 0;          // heure de fin (ms)
    let enPause = false;
    let intervalle = null;
    let fermeture = null;
    let audio = null;

    const afficher = () => {
        const secondes = Math.max(0, Math.ceil(restant / 1000));
        tempsEl.textContent = `${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, '0')}`;
        anneau.style.strokeDashoffset = circonference * (1 - restant / (total * 1000));
    };

    const bip = () => {
        if (!audio) return;
        [0, 0.25, 0.5].forEach(decalage => {
            const oscillateur = audio.createOscillator();
            const volume = audio.createGain();
            oscillateur.frequency.value = 880;
            volume.gain.setValueAtTime(0.25, audio.currentTime + decalage);
            volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + decalage + 0.18);
            oscillateur.connect(volume).connect(audio.destination);
            oscillateur.start(audio.currentTime + decalage);
            oscillateur.stop(audio.currentTime + decalage + 0.2);
        });
    };

    const fermer = () => {
        clearInterval(intervalle);
        clearTimeout(fermeture);
        el.hidden = true;
        el.classList.remove('fini');
    };

    const terminer = () => {
        clearInterval(intervalle);
        restant = 0;
        afficher();
        el.classList.add('fini');
        labelEl.textContent = t("C'est reparti ! 💪");
        if (navigator.vibrate) navigator.vibrate([300, 150, 300]);
        bip();
        fermeture = setTimeout(fermer, 6000);
    };

    const tic = () => {
        if (enPause) return;
        restant = fin - Date.now();
        if (restant <= 0) terminer();
        else afficher();
    };

    const majBoutonPause = () => {
        boutonPause.textContent = enPause ? '▶' : '❚❚';
        boutonPause.setAttribute('aria-label', t(enPause ? 'Reprendre' : 'Mettre en pause'));
    };

    // Le son doit être préparé pendant un clic de l'utilisateur (règle des navigateurs mobiles)
    const preparerSon = () => {
        try {
            audio = audio || new (window.AudioContext || window.webkitAudioContext)();
            if (audio.state === 'suspended') audio.resume();
        } catch (e) { audio = null; }
    };

    const lancer = (secondes, nom) => {
        preparerSon();
        clearInterval(intervalle);
        clearTimeout(fermeture);
        total = secondes;
        restant = secondes * 1000;
        fin = Date.now() + restant;
        enPause = false;
        majBoutonPause();
        labelEl.textContent = t('Repos · {nom}', { nom });
        el.classList.remove('fini');
        el.hidden = false;
        afficher();
        intervalle = setInterval(tic, 250);
    };

    const ajuster = delta => {
        if (el.classList.contains('fini')) return;
        restant = Math.max(5000, restant + delta * 1000);
        total = Math.max(total + delta, Math.ceil(restant / 1000));
        fin = Date.now() + restant;
        afficher();
    };

    el.addEventListener('click', e => {
        const action = e.target.closest('[data-action]')?.dataset.action;
        if (action === 'moins') ajuster(-15);
        if (action === 'plus') ajuster(15);
        if (action === 'stop') fermer();
        if (action === 'pause' && !el.classList.contains('fini')) {
            enPause = !enPause;
            if (!enPause) fin = Date.now() + restant;
            majBoutonPause();
        }
    });

    return { lancer };
}

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

const formatNombre = n => Math.round(n).toLocaleString(LOCALE);

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
            if (invalide && !erreur) erreur = t('Vérifie {nom} : la valeur doit être comprise entre {min} et {max}.', { nom: t(nom), min, max });
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
        $('res-target-label').textContent = t('Objectif — {label}', { label: t(r.reglages.label) });

        const ajustement = r.reglages.ajustement;
        $('res-target-hint').textContent = r.plafonne
            ? t('Limité à ton métabolisme de base pour préserver ta santé.')
            : ajustement === 0
                ? t('Égal à ta dépense journalière.')
                : t('{n} kcal par rapport à ta dépense journalière.', { n: `${ajustement > 0 ? '+' : '−'}${Math.abs(ajustement)}` });

        $('res-prot').textContent = formatNombre(r.proteines);
        $('res-carbs').textContent = formatNombre(r.glucides);
        $('res-fat').textContent = formatNombre(r.lipides);

        $('info-prot').textContent = t('{g} g / kg • {kcal} kcal • {p} %', { g: r.reglages.proteines.toLocaleString(LOCALE), kcal: formatNombre(kcal.proteines), p: pourcent(kcal.proteines) });
        $('info-carbs').textContent = t('Le reste de tes calories • {kcal} kcal • {p} %', { kcal: formatNombre(kcal.glucides), p: pourcent(kcal.glucides) });
        $('info-fat').textContent = t('{g} g / kg • {kcal} kcal • {p} %', { g: r.reglages.lipides.toLocaleString(LOCALE), kcal: formatNombre(kcal.lipides), p: pourcent(kcal.lipides) });

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

    // Arrivée depuis une page programme : l'objectif est déjà choisi (index.html?objectif=seche)
    const objectifUrl = new URLSearchParams(location.search).get('objectif');
    if (OBJECTIFS[objectifUrl]) {
        form.querySelector(`input[name="objectif"][value="${objectifUrl}"]`).checked = true;
        if (dejaCalcule) afficher(lireValeurs());
    }
}
