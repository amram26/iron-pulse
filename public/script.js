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
    if (champAliment && typeof ALIMENTS !== 'undefined') initRechercheAliments(champAliment);

    /* ---------- Page programme + minuteur de repos ---------- */
    if (document.getElementById('programme') && typeof PROGRAMMES !== 'undefined') initProgramme();

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
        point.addEventListener('click', () => {
            piste.scrollTo({ left: element.offsetLeft - (piste.clientWidth - element.offsetWidth) / 2, behavior: 'smooth' });
        });
        points.appendChild(point);
    });
    piste.after(points);

    // Le point actif correspond à la carte la plus proche du centre
    const majPoints = () => {
        const centre = piste.scrollLeft + piste.clientWidth / 2;
        let actif = 0;
        let ecartMin = Infinity;
        elements.forEach((element, i) => {
            const ecart = Math.abs(element.offsetLeft + element.offsetWidth / 2 - centre);
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
        totalEl.textContent = `≈ ${(Math.round(somme(1) / 50) * 50).toLocaleString('fr-FR')}`;
        totalProtEl.textContent = `🥩 ${somme(2)} g de protéines`;
    };

    const afficherRepas = (i, idx, animer = true) => {
        choix[i] = idx;
        const [description, kcal, proteines] = idees[i][idx];
        const desc = repas[i].querySelector('.meal__desc');
        desc.textContent = description;
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
        bouton.setAttribute('aria-label', `Autre idée : ${moment}`);
        bouton.innerHTML = `↻ Autre idée <span>1/${idees[i].length}</span>`;
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
    .replace(/[^a-z0-9]+/g, ' ')
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

const formatValeur = v => v.toLocaleString('fr-FR', { maximumFractionDigits: v < 20 ? 1 : 0 });

function initRechercheAliments(champ) {
    const resultatsEl = document.getElementById('aliment-resultats');
    const statutEl = document.getElementById('aliment-statut');

    const index = ALIMENTS.map(aliment => {
        const termes = [aliment.nom, ...aliment.alias].map(normaliser);
        const mots = [...new Set(termes.flatMap(t => [t, ...t.split(' ')]))];
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
                else if (termes.some(t => t.includes(v))) score = Math.max(score, 1);
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
            ? `<img src="images/aliments/${a.img}.webp" alt="${a.nom}" width="480" height="320" loading="lazy">`
            : `<span class="aliment__emoji" aria-hidden="true">${a.emoji}</span>`;
        return `
            <li class="aliment">
                <div class="aliment__media">${media}</div>
                <div class="aliment__info">
                    <h4 class="aliment__nom">${a.nom}</h4>
                    <p class="aliment__portion">${a.portion.label} (${a.portion.g} g)</p>
                    <div class="aliment__chiffres">
                        <span class="aliment__kcal"><strong>${Math.round(a.kcal * ratio)}</strong> kcal</span>
                        <span class="aliment__prot"><strong>${formatValeur(a.prot * ratio)} g</strong> protéines</span>
                    </div>
                    <p class="aliment__cent">Pour 100 g : ${a.kcal} kcal • ${formatValeur(a.prot)} g prot. • ${formatValeur(a.gluc)} g gluc. • ${formatValeur(a.lip)} g lip.</p>
                </div>
            </li>`;
    };

    const afficher = () => {
        const requete = champ.value.trim();
        resultatsEl.classList.toggle('has-query', Boolean(requete));

        if (!requete) {
            const populaires = ALIMENTS_POPULAIRES.map(nom => ALIMENTS.find(a => a.nom === nom)).filter(Boolean);
            statutEl.textContent = 'Les plus recherchés :';
            resultatsEl.innerHTML = populaires.map(carte).join('');
            return;
        }

        const { aliments, approchant } = rechercher(requete);
        if (!aliments.length) {
            statutEl.textContent = `Aucun aliment trouvé pour « ${requete} ». Essaie par exemple : poulet, riz, œuf, banane…`;
            resultatsEl.innerHTML = '';
            return;
        }

        statutEl.textContent = approchant ? `Résultats proches de « ${requete} » :` : '';
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

const formatKg = kg => `${kg.toLocaleString('fr-FR')} kg`;

// Conseil de progression à partir de la dernière séance notée (double progression)
function conseilProgression(exo, schema, entree) {
    const [min, max] = schema.reps.match(/\d+/g).map(Number);
    const valeurs = entree.series.map(s => s.reps);
    const avecPoids = entree.series.some(s => s.kg > 0);
    const unite = exo.duree ? 's' : 'répétitions';

    if (valeurs.every(v => v >= max)) {
        if (exo.duree) return { type: 'monter', texte: `🔥 Toutes tes séries ont atteint ${max} s : passe à ${max + 15} s la prochaine fois.` };
        return avecPoids
            ? { type: 'monter', texte: `🔥 Toutes tes séries ont atteint ${max} répétitions : ajoute 2,5 kg (ou 1 à 2 kg aux haltères) la prochaine fois !` }
            : { type: 'monter', texte: `🔥 Toutes tes séries ont atteint ${max} répétitions : ajoute un peu de poids ou ralentis la descente.` };
    }
    if (valeurs.some(v => v < min)) {
        return { type: 'baisser', texte: `⚠️ Certaines séries sont sous ${min} ${unite} : garde ce poids et vise au moins ${min}, ou enlève 2,5 kg.` };
    }
    return { type: 'garder', texte: `💪 Garde le même poids et essaie de gagner 1 ${exo.duree ? 'à 5 s' : 'répétition'} sur une série. À ${max} partout, tu pourras monter.` };
}

// 90 → « 1 min 30 », 45 → « 45 s »
const formatRepos = sec => {
    if (sec < 60) return `${sec} s`;
    const reste = sec % 60;
    return `${Math.floor(sec / 60)} min${reste ? ` ${reste}` : ''}`;
};

function initProgramme() {
    const $ = id => document.getElementById(id);
    const params = new URLSearchParams(location.search);
    const objectif = PROGRAMMES[params.get('objectif')] ? params.get('objectif') : 'masse';
    const prog = PROGRAMMES[objectif];
    const minuteur = creerMinuteur();

    // ---------- En-tête de page ----------
    document.title = `Programme ${prog.titre} — Iron Pulse`;
    $('prog-tag').textContent = prog.tag;
    $('prog-titre').innerHTML = `Programme <span class="text-gradient">${prog.titre}</span>`;
    $('prog-intro').textContent = prog.intro;
    $('prog-bg').style.backgroundImage =
        `linear-gradient(180deg, rgba(10, 10, 11, 0.55) 0%, rgba(10, 10, 11, 0.8) 60%, #0a0a0b 100%), url('${prog.img}')`;
    $('prog-calc').href = `index.html?objectif=${objectif === 'force' ? 'maintien' : objectif}#calculateur`;
    $('prog-regles').innerHTML = prog.regles.map(([icone, titre, texte]) => `
        <li class="rule">
            <span class="rule__icon" aria-hidden="true">${icone}</span>
            <h4>${titre}</h4>
            <p>${texte}</p>
        </li>`).join('');

    // ---------- État : nombre de séances et exercices choisis ----------
    const lireStockage = (cle, defaut) => {
        try { return JSON.parse(localStorage.getItem(cle)) ?? defaut; } catch (e) { return defaut; }
    };
    const ecrireStockage = (cle, valeur) => {
        try { localStorage.setItem(cle, JSON.stringify(valeur)); } catch (e) { /* stockage indisponible */ }
    };

    let jours = Number(params.get('jours'));
    if (!SPLITS[jours]) jours = Number(lireStockage(CLE_JOURS, 0));
    if (!SPLITS[jours]) jours = prog.joursDefaut;

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

    const schema = (exo, role, i) => {
        if (exo.duree) return SCHEMAS.duree;
        if (objectif === 'force' && i === 0) return SCHEMAS.force.premier;
        return SCHEMAS[objectif][role];
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
        const media = exo.img
            ? `<img src="images/exercices/${exo.img.includes('.') ? exo.img : `${exo.img}.webp`}" alt="${exo.nom}" width="400" height="300" loading="lazy">`
            : `<span class="exo__emoji" aria-hidden="true">${exo.emoji}</span>`;

        const derniere = (carnet[e.id] || [])[0];
        const unite = exo.duree ? 's' : 'rép.';
        let historique = '';
        if (derniere) {
            const date = new Date(derniere.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
            const poids = [...new Set(derniere.series.map(x => x.kg).filter(kg => kg > 0))];
            const resume = `${poids.length === 1 ? `${formatKg(poids[0])} × ` : ''}${derniere.series.map(x => (poids.length > 1 && x.kg ? `${x.kg.toLocaleString('fr-FR')}×${x.reps}` : x.reps)).join(' · ')} ${unite}`;
            const precedente = (carnet[e.id] || [])[1];
            const maxDernier = Math.max(0, ...derniere.series.map(x => x.kg || 0));
            const maxPrecedent = precedente ? Math.max(0, ...precedente.series.map(x => x.kg || 0)) : 0;
            const gain = maxPrecedent && maxDernier > maxPrecedent ? ` <span class="carnet__gain">📈 +${formatKg(maxDernier - maxPrecedent)}</span>` : '';
            const conseil = conseilProgression(exo, s, derniere);
            historique = `
                <p class="carnet__dernier">📒 Dernière fois (${date}) : <strong>${resume}</strong>${gain}</p>
                <p class="carnet__conseil carnet__conseil--${conseil.type}">${conseil.texte}</p>`;
        }

        const lignes = Array.from({ length: s.series }, (_, n) => {
            const precedent = derniere?.series[n];
            return `
                <div class="carnet__ligne">
                    <span>Série ${n + 1}</span>
                    <label><input type="number" name="kg" inputmode="decimal" min="0" step="0.5" placeholder="${exo.duree ? '—' : '0'}" value="${precedent?.kg || ''}" aria-label="Poids série ${n + 1}"${exo.duree ? ' disabled' : ''}> kg</label>
                    <label><input type="number" name="reps" inputmode="numeric" min="0" step="1" placeholder="${s.reps.match(/\d+/)[0]}" aria-label="${exo.duree ? 'Secondes' : 'Répétitions'} série ${n + 1}"> ${unite}</label>
                </div>`;
        }).join('');

        const carnetHtml = `
            <div class="carnet">
                ${historique}
                <form class="carnet__form" data-carnet="${i}" ${carnetOuvert === i ? '' : 'hidden'}>
                    ${lignes}
                    <button type="submit" class="btn btn--primary carnet__save">✓ Enregistrer</button>
                </form>
            </div>`;

        return `
            <li class="exo" data-index="${i}">
                <div class="exo__media">${media}<span class="exo__num">${i + 1}</span></div>
                <div class="exo__info">
                    <h4 class="exo__nom">${exo.nom}</h4>
                    <p class="exo__muscles">${exo.muscles}</p>
                    <div class="exo__chiffres">
                        <span class="exo__series"><strong>${s.series} séries</strong> × ${s.reps}${exo.duree ? '' : ' rép.'}</span>
                        <span class="exo__repos">⏱ <strong>${formatRepos(s.repos)}</strong> de repos entre les séries</span>
                    </div>
                    <p class="exo__conseil">💡 ${exo.conseil}</p>
                </div>
                <div class="exo__actions">
                    <button type="button" class="exo__btn exo__btn--timer" data-repos="${s.repos}" data-nom="${exo.nom}">▶ Lancer le repos · ${formatRepos(s.repos)}</button>
                    <button type="button" class="exo__btn exo__btn--note" data-noter="${i}" aria-expanded="${carnetOuvert === i}" aria-label="Noter mes séries">📝 Noter</button>
                    ${alts.length > 1 ? `<button type="button" class="exo__btn" data-changer="${i}" aria-label="Changer d'exercice (${alts.indexOf(e.id) + 1} sur ${alts.length})">⇄ Changer <span>${alts.indexOf(e.id) + 1}/${alts.length}</span></button>` : ''}
                </div>
                ${carnetHtml}
            </li>`;
    };

    const afficherSeance = (animer = []) => {
        const seance = SEANCES[seanceActive];
        const liste = exercicesSeance(seanceActive);
        const modifiee = liste.some(e => e.id !== e.origine);

        $('prog-seance').innerHTML = `
            <article class="seance">
                <header class="seance__head">
                    <h3 class="seance__title">${seance.nom}</h3>
                    <p class="seance__meta">${seance.focus} • ${liste.length} exercices • ≈ ${dureeSeance(liste)} min</p>
                </header>
                <p class="seance__note">🔥 <strong>Échauffement :</strong> 5 à 10 min de cardio léger, puis 2 séries légères sur le premier exercice.</p>
                <ol class="exos">${liste.map((_, i) => carteExercice(liste, i)).join('')}</ol>
                ${prog.cardio ? `<p class="seance__note seance__note--cardio">🏃 <strong>Pour finir :</strong> 15 min de cardio (vélo, tapis ou rameur) à une allure où tu peux encore parler.</p>` : ''}
                ${modifiee ? `<button type="button" class="seance__reset" data-reset>↺ Revenir aux exercices de base</button>` : ''}
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

        $('prog-split').textContent = split.description;
        $('prog-semaine').innerHTML = split.semaine.map((id, i) => id
            ? `<li class="week__day" data-seance="${id}"><button type="button" data-seance="${id}"><span>${NOMS_JOURS[i]}</span><strong>${SEANCES[id].court}</strong></button></li>`
            : `<li class="week__day week__day--rest"><span>${NOMS_JOURS[i]}</span><strong>Repos</strong></li>`).join('');
        $('prog-onglets').innerHTML = seances.map(id =>
            `<button type="button" class="session-tab" role="tab" data-seance="${id}">${SEANCES[id].nom}</button>`).join('');
        afficherSeance();
    };

    // ---------- Interactions ----------
    const radioJours = document.querySelector(`input[name="jours"][value="${jours}"]`);
    if (radioJours) radioJours.checked = true;

    document.querySelectorAll('input[name="jours"]').forEach(radio => {
        radio.addEventListener('change', () => {
            jours = Number(radio.value);
            ecrireStockage(CLE_JOURS, jours);
            params.set('objectif', objectif);
            params.set('jours', jours);
            try {
                history.replaceState(null, '', `${location.pathname}?${params}`);
            } catch (e) { /* adresse non modifiable (ex. fichier local) : sans conséquence */ }
            afficherProgramme();
        });
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

        carnet[exoId] = [{ date: new Date().toISOString(), series }, ...(carnet[exoId] || [])].slice(0, MAX_ENTREES_CARNET);
        ecrireStockage(CLE_CARNET, carnet);
        carnetOuvert = null;
        afficherSeance([i]);
    });

    afficherProgramme();
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
        labelEl.textContent = "C'est reparti ! 💪";
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
        boutonPause.setAttribute('aria-label', enPause ? 'Reprendre' : 'Mettre en pause');
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
        labelEl.textContent = `Repos · ${nom}`;
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

    // Arrivée depuis une page programme : l'objectif est déjà choisi (index.html?objectif=seche)
    const objectifUrl = new URLSearchParams(location.search).get('objectif');
    if (OBJECTIFS[objectifUrl]) {
        form.querySelector(`input[name="objectif"][value="${objectifUrl}"]`).checked = true;
        if (dejaCalcule) afficher(lireValeurs());
    }
}
