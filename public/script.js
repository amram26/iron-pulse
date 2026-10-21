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

    /* ---------- Calculateur de calories et macros ---------- */
    const calcForm = document.getElementById('calc-form');
    if (calcForm) initCalculator(calcForm);

    /* ---------- Année du pied de page ---------- */
    document.getElementById('year').textContent = new Date().getFullYear();
});

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
