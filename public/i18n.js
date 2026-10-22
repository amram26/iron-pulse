/* ==========================================================
   IRON PULSE — Langues : français, anglais, hébreu
   Le français est écrit directement dans le HTML et le JS.
   Les traductions sont des dictionnaires « texte français →
   traduction » (i18n/en.js, i18n/he.js).
   t('Texte {x}', { x }) traduit un texte et remplit ses variables.
   Chargé dans le <head> pour fixer la langue avant l'affichage.
   La mise en page reste identique dans toutes les langues (choix
   du propriétaire) : même en hébreu, la page reste de gauche à
   droite ; seules les phrases hébraïques se lisent de droite à
   gauche (voir « unicode-bidi: plaintext » dans style.css).
   ========================================================== */

const LANGUES = {
    fr: { nom: 'Français', locale: 'fr-FR' },
    en: { nom: 'English', locale: 'en-GB' },
    he: { nom: 'עברית', locale: 'he-IL' }
};
const CLE_LANGUE = 'ironpulse-langue';
const TRADUCTIONS = {};

// Ordre de priorité : ?lang= dans l'adresse, choix enregistré, langue du téléphone, français
function detecterLangue() {
    const parametre = new URLSearchParams(location.search).get('lang');
    if (LANGUES[parametre]) {
        try { localStorage.setItem(CLE_LANGUE, parametre); } catch (e) { /* stockage indisponible */ }
        return parametre;
    }
    try {
        const enregistree = localStorage.getItem(CLE_LANGUE);
        if (LANGUES[enregistree]) return enregistree;
    } catch (e) { /* stockage indisponible */ }
    const navigateur = (navigator.language || 'fr').slice(0, 2).toLowerCase();
    if (navigateur === 'he' || navigateur === 'iw') return 'he';
    if (navigateur === 'en') return 'en';
    return 'fr';
}

const LANGUE = detecterLangue();
const LOCALE = LANGUES[LANGUE].locale;
document.documentElement.lang = LANGUE;

const normaliserCle = texte => String(texte).replace(/\s+/g, ' ').trim();

function t(texte, valeurs) {
    const dico = TRADUCTIONS[LANGUE];
    let resultat = (dico && dico[normaliserCle(texte)]) || texte;
    if (valeurs) {
        resultat = resultat.replace(/\{(\w+)\}/g, (marque, cle) => (cle in valeurs ? valeurs[cle] : marque));
    }
    return resultat;
}

// Traduit les textes écrits en dur dans la page (texte visible et attributs utiles)
function traduirePage() {
    const dico = TRADUCTIONS[LANGUE];
    if (LANGUE === 'fr' || !dico) return;

    const marcheur = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
        acceptNode: noeud => (/^(SCRIPT|STYLE)$/.test(noeud.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT)
    });
    const noeuds = [];
    while (marcheur.nextNode()) noeuds.push(marcheur.currentNode);

    noeuds.forEach(noeud => {
        const brut = noeud.nodeValue;
        const traduction = dico[normaliserCle(brut)];
        if (!traduction) return;
        // On garde les espaces autour du texte pour ne pas coller les mots voisins
        noeud.nodeValue = brut.match(/^\s*/)[0] + traduction + brut.match(/\s*$/)[0];
    });

    ['placeholder', 'aria-label', 'alt', 'title'].forEach(attribut => {
        document.querySelectorAll(`[${attribut}]`).forEach(element => {
            const traduction = dico[normaliserCle(element.getAttribute(attribut))];
            if (traduction) element.setAttribute(attribut, traduction);
        });
    });

    document.title = t(document.title);
    const description = document.querySelector('meta[name="description"]');
    if (description) description.content = t(description.content);
}

// Boutons FR / EN / עב : le choix est enregistré et la page se recharge dans la nouvelle langue
function initSelecteurLangue() {
    document.querySelectorAll('.lang-switch [data-lang]').forEach(bouton => {
        const actif = bouton.dataset.lang === LANGUE;
        bouton.classList.toggle('active', actif);
        bouton.setAttribute('aria-pressed', actif);
        bouton.addEventListener('click', () => {
            const choix = bouton.dataset.lang;
            if (choix === LANGUE) return;
            try { localStorage.setItem(CLE_LANGUE, choix); } catch (e) { /* stockage indisponible */ }
            const params = new URLSearchParams(location.search);
            params.set('lang', choix);
            location.href = `${location.pathname}?${params}${location.hash}`;
        });
    });
}

// Enregistré avant celui de script.js : la page est traduite avant que le JS ne génère son contenu
document.addEventListener('DOMContentLoaded', () => {
    traduirePage();
    initSelecteurLangue();
});
