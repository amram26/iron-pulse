# Iron Pulse

Site vitrine dédié à la musculation et à la performance. HTML/CSS/JS pur, sans framework ni étape de build.

**Tout le contenu visible du site doit être rédigé en français** (textes, `aria-label`, `alt`, messages JS). Le tutoiement est utilisé pour s'adresser au visiteur.

## Lancer le site

Aucune installation requise : ouvrir `index.html` dans un navigateur, ou utiliser l'extension VS Code **Live Server** (clic droit sur `index.html` → « Open with Live Server ») pour le rechargement automatique.

## Structure

```
Iron_Pulse/
├── index.html   # Page unique (one-page) avec ancres de navigation
├── style.css    # Tous les styles, organisés par sections commentées
├── script.js    # Interactions, tout dans un seul DOMContentLoaded
└── CLAUDE.md
```

### Sections de `index.html`

| Ancre          | Contenu                                              | État       |
|----------------|------------------------------------------------------|------------|
| `#accueil`     | Hero : titre, sous-titre, 2 boutons, compteurs animés | Fait       |
| `#programmes`  | 3 cartes : Prise de masse, Perte de gras, Force      | Fait       |
| `#nutrition`   | —                                                    | À créer    |
| `#calculateur` | —                                                    | À créer    |
| `#contact`     | Pointe actuellement vers le `<footer>`               | Provisoire |

Le menu de navigation contient déjà les liens vers les sections manquantes.

## Priorité mobile

Le site est pensé **d'abord pour le téléphone** (« mobile first ») :
- Les styles de base de `style.css` ciblent le mobile ; on enrichit avec des `@media (min-width: …)` : `600px` (tablette), `769px` (menu horizontal), `961px` (grilles à 3 colonnes). Ne pas ajouter de `max-width` queries.
- Effets de survol uniquement dans `@media (hover: hover)`.
- Zones tactiles d'au moins 44–48px, boutons pleine largeur sur mobile, `100svh` pour le hero, marges `safe-area-inset` (encoche iPhone).
- Ne jamais mettre de `backdrop-filter` directement sur `.header` : il confinerait le menu mobile plein écran (le flou est sur `.header::before`).
- Le seuil `768` dans `script.js` (fermeture du menu au redimensionnement) doit rester aligné avec la media query `769px`.

## Déploiement

Hébergé sur **Cloudflare Pages**, projet `iron-pulse` (envoi direct, sans Git) : https://iron-pulse-b9o.pages.dev — distinct du projet `zombie-gamer`, à ne pas écraser. Seuls `index.html`, `style.css` et `script.js` sont mis en ligne (pas `CLAUDE.md`) : régénérer `iron-pulse-site.zip` avant chaque envoi.

## Conventions de code

- **Nommage CSS : BEM** — `.bloc`, `.bloc__element`, `.bloc--modificateur` (ex. `.card__title`, `.card--featured`, `.btn--primary`).
- **Variables CSS** dans `:root` en haut de `style.css` : toujours les réutiliser plutôt que coder des couleurs en dur.
- **Commentaires** de section en français : `/* ---------- Nom ---------- */`.
- **Indentation** : 4 espaces.
- **JS** : vanilla, `const`/fonctions fléchées, `IntersectionObserver` pour tout ce qui dépend du défilement (pas d'écouteur `scroll` lourd).
- **Classes d'état** pilotées par JS : `.scrolled` (header), `.open` (nav), `.active` (burger, liens), `.visible` (éléments `.reveal`), `.menu-open` (body, bloque le scroll).

## Choix de design

- **Thème sombre premium** : fonds `--bg #0a0a0b`, `--bg-alt #121214`, surfaces `--surface #18181b`, bordures `--border #2a2a30`.
- **Accents néon** : `--neon-red #ff2d55` → `--neon-orange #ff6b1a`, combinés dans `--gradient`. Effet lumineux via `--glow`. Utiliser `.text-gradient` pour mettre un mot en valeur dans un titre.
- **Typographie** (Google Fonts) : *Bebas Neue* pour titres, logo et chiffres ; *Inter* pour le texte courant.
- **Composants réutilisables** : `.btn--primary` / `.btn--ghost`, `.section` + `.section__header` (`__tag`, `__title`, `__subtitle`), `.card`.
- **Animations** : ajouter la classe `.reveal` à un élément pour qu'il apparaisse en fondu au défilement. Halo pulsant et grille dans le hero. Tout est désactivé sous `prefers-reduced-motion`.
- **Responsive** : points de rupture à `960px` (cartes en 1 colonne), `768px` (menu burger plein écran avec animation `clip-path` circulaire), `480px` (boutons pleine largeur).
- **Accessibilité** : `aria-expanded` / `aria-label` mis à jour sur le burger, fermeture du menu avec Échap.

## Prochaines étapes

1. **Section Nutrition** (`#nutrition`) : principes clés (protéines, glucides, lipides, hydratation), exemples de repas selon l'objectif.
2. **Section Calculateur** (`#calculateur`) : formulaire (sexe, âge, poids, taille, niveau d'activité, objectif) → calcul du métabolisme de base (Mifflin-St Jeor), des besoins caloriques (TDEE) et de la répartition des macronutriments. Calcul côté client en JS.
3. **Section Contact** (`#contact`) dédiée avec formulaire (nom, e-mail, message) et validation JS, au lieu de pointer vers le footer.
4. **Pages programmes détaillées** : les liens « Voir le programme → » des cartes pointent vers `#` pour l'instant.
5. **Liens réseaux sociaux** du footer (Instagram, YouTube) à renseigner.
6. Améliorations possibles : images/visuels pour le hero et les cartes, favicon, balises Open Graph pour le partage.
