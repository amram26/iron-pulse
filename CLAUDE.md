# Iron Pulse

Site vitrine dédié à la musculation et à la performance. HTML/CSS/JS pur, sans framework ni étape de build.

**Le site est écrit en français** (langue source : textes, `aria-label`, `alt`, messages JS ; tutoiement) **et traduit en anglais et en hébreu** — voir « Langues » ci-dessous. Toute nouvelle phrase visible doit être ajoutée aux traductions.

## Langues (FR / EN / HE)

- `public/i18n.js` (chargé dans le `<head>`) choisit la langue (`?lang=` → choix enregistré `ironpulse-langue` → langue du téléphone → français), fixe `lang`/`dir` sur `<html>` et expose `t('texte {x}', { x })` et `LOCALE`.
- `public/i18n/en.js` et `public/i18n/he.js` : dictionnaires **texte français exact → traduction** (`TRADUCTIONS.en`, `TRADUCTIONS.he`), chargés avant les données et `script.js`.
- Textes écrits en dur dans le HTML : traduits automatiquement au chargement (nœuds texte + `placeholder`, `aria-label`, `alt`, `title`) si la phrase française existe dans le dictionnaire.
- Textes générés en JS : toujours passer par `t()`, avec des variables `{…}` pour les nombres (ex. `t('{n} séries', { n })`) ; nombres et dates avec `LOCALE`, jamais `'fr-FR'` en dur. Les données (`programmes.js`, `aliments.js`, `IDEES_REPAS`) restent en français et sont traduites à l'affichage avec `t()`.
- **La mise en page ne bouge jamais quand on change de langue** (choix du propriétaire) : pas de `dir="rtl"`, même en hébreu. Seules les phrases hébraïques se lisent de droite à gauche grâce à `unicode-bidi: plaintext` (bloc « Hébreu » à la fin de `style.css`). Police Heebo, formes **plurielles neutres** (« לחצו », « בחרו »), termes de salle israéliens.
- Ajouter un texte = l'ajouter en français dans le code **et** dans `en.js` / `he.js` (même clé, mêmes `{variables}` et balises). La recherche d'aliments cherche aussi dans les noms traduits (lettres hébraïques acceptées).
- Sélecteur « FR · EN · עב » dans l'en-tête de chaque page ; changer de langue recharge la page avec `?lang=`.

## Application installable et hors ligne (PWA)

- `public/manifest.webmanifest` (nom, couleurs, raccourcis Programmes / Calculateur / Aliments) + icônes dans `public/icons/` (éclair dégradé sur fond noir : 192, 512, `maskable`, `apple-touch-icon` 180, `favicon.svg`, `favicon-32.png`). Aperçu de partage (Open Graph) : `public/images/og-image.jpg` (1200×630), balises `og:*` dans le `<head>` des deux pages.
- `public/sw.js` : pages en « réseau d'abord » (copie en cache si pas de réseau, `/programme.html?…` retrouve `/programme`), CSS/JS/traductions en « cache puis mise à jour », photos et polices en « cache d'abord ». **Incrémenter `VERSION` dans `sw.js` à chaque modification de ce fichier** (les anciens caches sont supprimés).
- Au premier passage, `prechargerPhotos()` (`script.js`) met en réserve, en arrière-plan après 3 s, toutes les photos d'exercices (page programme) et d'aliments/nutrition (accueil) — sauf en mode économie de données. Tout nouveau fichier essentiel au fonctionnement doit être ajouté à `FICHIERS_BASE` dans `sw.js`.
- Bouton « 📱 Installer l'application » dans le footer (affiché seulement quand le navigateur le propose) ; sur iPhone, une phrase explique « Partager → Sur l'écran d'accueil ».
- Le service worker ne marche qu'en http(s) : en ouvrant `index.html` directement depuis le disque, le site fonctionne mais sans hors ligne. Test hors ligne vérifié le 26/10/2026 avec un serveur local imitant Cloudflare (pages, styles, traductions, 45 photos d'exercices et 27 d'aliments disponibles sans réseau).

## Lancer le site

Aucune installation requise : ouvrir `public/index.html` dans un navigateur, ou utiliser l'extension VS Code **Live Server** (clic droit sur `public/index.html` → « Open with Live Server ») pour le rechargement automatique.

## Structure

```
Iron_Pulse/
├── public/          # Tout ce qui est mis en ligne — et uniquement ça
│   ├── index.html   # Page unique (one-page) avec ancres de navigation
│   ├── style.css    # Tous les styles, organisés par sections commentées
│   └── script.js    # Interactions, tout dans un seul DOMContentLoaded
├── .gitignore
└── CLAUDE.md        # Documentation interne, jamais publiée
```

Tout nouveau fichier du site (pages, images, favicon…) va dans `public/`. Rien d'autre ne doit y aller.

### Sections de `index.html`

| Ancre          | Contenu                                              | État       |
|----------------|------------------------------------------------------|------------|
| `#accueil`     | Hero : titre, sous-titre, 2 boutons, compteurs animés | Fait       |
| `#programmes`  | 3 cartes : Prise de masse, Perte de gras, Force      | Fait       |
| `#nutrition`   | 3 macros (photos), journée type masse/sèche, 4 conseils | Fait     |
| `#calculateur` | Calculateur calories + macros (formulaire / résultats) | Fait     |
| `#contact`     | Pointe actuellement vers le `<footer>`               | Provisoire |

Le menu de navigation contient déjà les liens vers les sections manquantes.

## Priorité mobile

Le site est pensé **d'abord pour le téléphone** (« mobile first ») :
- Les styles de base de `style.css` ciblent le mobile ; on enrichit avec des `@media (min-width: …)` : `600px` (tablette), `769px` (menu horizontal), `961px` (grilles à 3 colonnes). Ne pas ajouter de `max-width` queries.
- Effets de survol uniquement dans `@media (hover: hover)`.
- Zones tactiles d'au moins 44–48px, boutons pleine largeur sur mobile, `100svh` pour le hero, marges `safe-area-inset` (encoche iPhone).
- Ne jamais mettre de `backdrop-filter` directement sur `.header` : il confinerait le menu mobile plein écran (le flou est sur `.header::before`).
- **Page courte et rangée sur téléphone** : les séries de grandes cartes (programmes, macros) sont des carrousels à faire glisser (`.carousel` + `data-carousel`, points générés par `initCarrousel`), redevenant des grilles à partir de `961px`. Conseils en 2 × 2, 3 aliments populaires seulement tant qu'on n'a rien tapé, footer sur 2 colonnes.
- **Barre d'accès rapide** `.tabbar` en bas de l'écran sous `769px` (Accueil, Programmes, Nutrition, Aliments, Calcul) ; l'onglet actif suit le défilement. Le `body` a un `padding-bottom` pour qu'elle ne cache rien. Toute nouvelle section importante peut y être ajoutée (5 onglets maximum).
- Le seuil `768` dans `script.js` (fermeture du menu au redimensionnement) doit rester aligné avec la media query `769px`.

## Déploiement

- Code sur GitHub : https://github.com/amram26/iron-pulse (branche `main`).
- Hébergé sur **Cloudflare Pages**, projet `iron-pulse-site` relié à GitHub : **https://iron-pulse-site.pages.dev**. Aucune commande de build, **répertoire de sortie `public`** — chaque push sur `main` redéploie le site (~1 min).
- Ancien projet en envoi direct `iron-pulse` (https://iron-pulse-b9o.pages.dev) : obsolète, à supprimer.
- Le projet Cloudflare `zombie-gamer` n'a rien à voir avec Iron Pulse : ne jamais y toucher.

## Conventions de code

- **Nommage CSS : BEM** — `.bloc`, `.bloc__element`, `.bloc--modificateur` (ex. `.card__title`, `.card--featured`, `.btn--primary`).
- **Variables CSS** dans `:root` en haut de `style.css` : toujours les réutiliser plutôt que coder des couleurs en dur.
- **Commentaires** de section en français : `/* ---------- Nom ---------- */`.
- **Indentation** : 4 espaces.
- **JS** : vanilla, `const`/fonctions fléchées, `IntersectionObserver` pour tout ce qui dépend du défilement (pas d'écouteur `scroll` lourd).
- **Classes d'état** pilotées par JS : `.scrolled` (header), `.open` (nav), `.active` (burger, liens), `.visible` (éléments `.reveal`), `.menu-open` (body, bloque le scroll).

## Photos

- Dans `public/images/`, en **WebP** (~50–150 Ko, 800 px de large ; `hero-large.webp` 1600 px pour ordinateur). Source : Unsplash (licence libre), crédit dans le footer.
- Choisir des photos **sombres et intenses** cohérentes avec le thème ; toujours les regarder avant de les utiliser. Télécharger via `https://images.unsplash.com/photo-<id>?w=800&q=72&fm=webp`.
- Toujours `width`/`height`, `alt` en français et `loading="lazy"` (sauf le hero, en fond CSS).
- Les chiffres affichés sur le site doivent être **vrais** (pas de « 120 exercices » qui n'existent pas).

## Journée type (Nutrition)

- 4 idées par repas et par objectif dans `IDEES_REPAS` (`script.js`) : `[description, kcal, protéines en g]`. La première idée de chaque liste doit rester identique au texte écrit dans le HTML.
- Repas **simples, sans recette**, avec des aliments du quotidien. Calories et protéines réalistes (arrondies à 5 g / 50 kcal) ; la journée type doit rester dans 1,6–2,2 g de protéines par kg pour ~75 kg.
- Boutons « ↻ Autre idée » (créés en JS) et « 🔀 Nouvelle journée » ; les totaux kcal et protéines se recalculent.

## Recherche d'aliments (Nutrition)

- Données dans `public/aliments.js` (chargé avant `script.js`) : valeurs **pour 100 g** (kcal, prot, gluc, lip), une `portion` courante, des `alias` (synonymes, pluriels, fautes fréquentes) et soit une photo `img` (`images/aliments/<nom>.webp`, 480×320), soit un `emoji` affiché sur fond dégradé.
- Recherche dans `initRechercheAliments` (`script.js`) : sans accents ni majuscules, préfixe > contient, puis tolérance aux fautes (distance avec inversion de lettres) en ne gardant que les plus proches.
- Pour ajouter un aliment : une entrée dans `ALIMENTS`, valeurs réalistes (ordre de grandeur Ciqual), puis vérifier qu'une recherche voisine ne renvoie pas de résultat absurde.

## Pages programmes

- **Une seule page** `public/programme.html?objectif=masse|seche|force&jours=2..5`, remplie en JS (`initProgramme` dans `script.js`) à partir de `public/programmes.js` : `EXERCICES` (nom, muscles, conseil, `groupe`, photo ou emoji), `SEANCES`, `SPLITS` (semaine selon 2 à 5 séances), `SCHEMAS` (séries / répétitions / repos en secondes selon l'objectif et le rôle `base` ou `iso`), `PROGRAMMES` (textes et règles d'or).
- Splits : 2 = full body A/B, 3 = full body A/B/C, 4 = haut/bas ×2, 5 = pecs-épaules-triceps A / dos-biceps A / jambes / pecs-épaules-triceps B / dos-biceps B (organisation voulue par le propriétaire ; dans les textes, préciser « arrière des bras » pour les triceps et « avant des bras » pour les biceps). **Jamais d'entraînement le vendredi ni le samedi** (choix du propriétaire du site) : la semaine affichée commence le **dimanche** (`NOMS_JOURS`) et toutes les semaines types tiennent du dimanche au jeudi. En force, le 1er exercice de chaque séance passe en 5 × 3–5 avec 3 min de repos. En sèche, 15 min de cardio en fin de séance.
- **Changer d'exercice** : alterne entre les exercices du même `groupe`, sans doublon dans la séance ; choix mémorisés dans `localStorage` (`ironpulse-exercices`, clé `objectif|séance|position`), ignorés si l'exercice choisi n'est plus dans la même famille. Un `groupe` = mêmes muscles **et** même type de mouvement (ex. `epaules-ciblees` = côté de l'épaule, `epaules-arriere` = arrière ; les dips sont dans `triceps`, les hip thrust dans `fessiers`, pas dans `charniere`). La salle du propriétaire a des machines : chaque famille propose si possible une version machine.
- **Conseils techniques** : simples, en « tu », et toujours avec le point de sécurité principal (dos plat, talons au sol…) ; pour les mouvements lourds à la barre (squat, développé couché), rappeler les barres de sécurité du rack ou un partenaire. Le contenu des programmes a été relu par une revue multi-agents le 21/10/2026 (20 corrections appliquées).
- **Carnet** : poids × répétitions par série, stocké par exercice dans `ironpulse-carnet` (20 entrées max) ; affiche la dernière séance, le gain de poids et un conseil de progression (`conseilProgression` : tout au max → +2,5 kg ; sous le min → garder ou baisser ; sinon +1 répétition).
- **Séance guidée — facultative** (choix du propriétaire : la liste classique reste l'affichage par défaut) : bouton « ▶ Commencer la séance guidée » en haut de chaque séance, qui ouvre `#guide` en plein écran (`ouvrirGuide` / `afficherGuide` dans `initProgramme`). Un exercice à la fois, séries à cocher (poids pré-rempli depuis le carnet, répétitions par défaut = dernière fois ou bas de la fourchette), minuteur lancé automatiquement après chaque série, chrono, écran maintenu allumé (Wake Lock), bilan final (durée, séries, kg soulevés) et enregistrement automatique dans le carnet. État sauvegardé à chaque action dans `ironpulse-seance-en-cours` : reprise possible pendant 4 h (« ▶ Reprendre la séance en cours »). Quitter en cours de route enregistre les séries déjà faites (après confirmation).
- **Minuteur de repos** (`creerMinuteur`) : basé sur l'heure de fin, −15 / +15 s, pause, vibration + bip (Web Audio préparé au clic) à la fin. Affiché au-dessus de la barre d'accès rapide.
- Photos d'exercices dans `public/images/exercices/` (480×360, WebP par défaut ; `img` peut contenir une extension, ex. `curl-pupitre.jpg`). 45 exercices sur 47 ont une photo ; `leg-curl-allonge` et `triceps-machine` gardent leur emoji faute de photo libre fiable. Règle : une photo doit montrer le **bon exercice avec le bon matériel** (ou, pour une machine, la bonne machine seule) — sinon on garde l'emoji plutôt qu'une image trompeuse.
- Sources de photos : **Pexels** (téléchargeable directement via `images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&w=480&h=360&fit=crop` avec l'en-tête `Accept: image/webp` pour obtenir du WebP) et **Pixabay** (CDN `cdn.pixabay.com`). Licences gratuites, sans attribution obligatoire ; crédit « Photos : Unsplash, Pexels et Pixabay » dans le footer des deux pages. Les pages de recherche de ces sites bloquent l'accès automatique : passer par une recherche web.
- Les cartes de l'accueil pointent vers `programme.html?objectif=…` ; le bouton « Calcule tes besoins » renvoie vers `index.html?objectif=…#calculateur`, qui présélectionne l'objectif.

## Calculateur

Code dans `script.js` (`initCalculator`, `calculerBesoins`, constantes `OBJECTIFS` / `LIMITES`), styles dans le bloc « CALCULATEUR » de `style.css`.
- Métabolisme de base : Mifflin-St Jeor ; dépense = métabolisme × coefficient d'activité (1,2 à 1,9).
- Objectifs : masse +300 kcal (protéines 2 g/kg, lipides 0,9 g/kg), sèche −400 kcal (2,2 / 0,8), maintien (1,8 / 0,9). Glucides = calories restantes. La cible ne descend jamais sous le métabolisme de base.
- Saisie mémorisée dans `localStorage` (clé `ironpulse-calculateur`, toujours dans un try/catch) ; recalcul en direct après le premier calcul. Rien n'est envoyé à un serveur.
- Champs à 16px minimum (sinon iOS zoome au focus).

## Choix de design

- **Thème sombre premium** : fonds `--bg #0a0a0b`, `--bg-alt #121214`, surfaces `--surface #18181b`, bordures `--border #2a2a30`.
- **Accents néon** : `--neon-red #ff2d55` → `--neon-orange #ff6b1a`, combinés dans `--gradient`. Effet lumineux via `--glow`. Utiliser `.text-gradient` pour mettre un mot en valeur dans un titre.
- **Typographie** (Google Fonts) : *Bebas Neue* pour titres, logo et chiffres ; *Inter* pour le texte courant.
- **Composants réutilisables** : `.btn--primary` / `.btn--ghost`, `.section` + `.section__header` (`__tag`, `__title`, `__subtitle`), `.card`.
- **Animations** : ajouter la classe `.reveal` à un élément pour qu'il apparaisse en fondu au défilement. Halo pulsant et grille dans le hero. Tout est désactivé sous `prefers-reduced-motion`.
- **Responsive** : voir « Priorité mobile » — menu burger plein écran (animation `clip-path` circulaire) sous `769px`.
- **Accessibilité** : `aria-expanded` / `aria-label` mis à jour sur le burger, fermeture du menu avec Échap.

## Prochaines étapes

1. **Section Contact** (`#contact`) dédiée avec formulaire (nom, e-mail, message) et validation JS, au lieu de pointer vers le footer.
2. **Liens réseaux sociaux** du footer (Instagram, YouTube) à renseigner.
3. Idée proposée au propriétaire : page « Mes progrès » (graphiques à partir du carnet, nombre de séances, semaines d'affilée).
