# Iron Pulse — Guide du propriétaire

Ce fichier résume **tout le site** : ce qu'il fait, comment s'en servir, comment le modifier et le mettre en ligne.
Il est rangé à côté de `CLAUDE.md`, en dehors du dossier `public/` : il n'apparaît **jamais** sur le site.

> `CLAUDE.md` = la documentation technique (pour Claude et pour le code).
> `GUIDE.md` = ce guide, pour toi.

---

## 1. Le site en bref

| | |
|---|---|
| **Adresse du site** | https://iron-pulse-site.pages.dev |
| **Code (GitHub)** | https://github.com/amram26/iron-pulse (branche `main`) |
| **Hébergement** | Cloudflare Pages, projet `iron-pulse-site` — gratuit |
| **Langues** | Français, anglais, hébreu (bouton FR · EN · עב en haut) |
| **Prix** | Gratuit, sans compte, sans publicité |

Le site est pensé **d'abord pour le téléphone**. On peut l'**installer comme une application**
(bouton « 📱 Installer l'application » en bas de page, ou sur iPhone : Partager → « Sur l'écran d'accueil »)
et il **marche sans internet** (sauf les vidéos et la sauvegarde en ligne).

⚠️ Dans Cloudflare, le projet **`zombie-gamer`** n'a rien à voir avec Iron Pulse : ne jamais y toucher.

---

## 2. Les pages

| Page | Adresse | Contenu |
|---|---|---|
| Accueil | `/` | Présentation, 3 programmes, nutrition, recherche d'aliments, journal du jour, calculateur |
| Programme | `/programme?objectif=masse` (ou `seche`, `force`) | Semaine d'entraînement, séances, exercices, carnet, séance guidée |
| Mes progrès | `/progres` | Statistiques, courbes, poids du corps, sauvegardes |
| Confidentialité | `/confidentialite` | Ce qui est gardé et où (sans compte, sans traceur) |

---

## 3. Toutes les fonctions

### 🏋️ Entraînement (page Programme)
- **3 programmes** : Prise de masse, Perte de gras, Force.
- **2 à 5 séances par semaine**. Jamais le vendredi ni le samedi : la semaine va du dimanche au jeudi.
- **5 séances** = pecs-épaules-triceps / dos-biceps / jambes, puis on recommence (versions B).
- **48 exercices**, presque tous avec photo, avec séries, répétitions, repos et un conseil de sécurité.
- **⇄ Changer** : remplace un exercice par un autre de la même famille (souvent une version machine).
- **✏️ Créer mon propre programme** : tu choisis tes jours et tes exercices (10 maximum par séance).
- **🔥 Échauffement calculé** : des séries légères avant le premier exercice, calculées d'après ton poids de travail.
- **⏱ Minuteur de repos** : −15 / +15 s, pause, vibration et bip à la fin.
- **📝 Carnet** : poids × répétitions de chaque série, avec un conseil pour progresser (« ajoute 2,5 kg »…).
- **▶ Séance guidée** (facultative) : un exercice à la fois, séries à cocher, minuteur automatique, écran toujours allumé, bilan à la fin. Une séance interrompue peut être reprise pendant 4 h.
- **🏆 Records** : un message avec confettis quand tu bats ton meilleur résultat.
- **🌙 Semaine légère** : proposée quand tu stagnes ou après 8 semaines d'affilée (moins de séries, poids −10 %).
- **🧮 Disques & charge max** : quels disques mettre sur la barre, et ta charge max estimée.
- **🎬 Vidéos** : touche la photo d'un exercice pour voir un tutoriel YouTube dans la langue du site (sinon en anglais).

### 🍽️ Nutrition (page d'accueil)
- **Journée type** masse ou sèche, repas simples, bouton « ↻ Autre idée » pour varier.
- **Recherche d'aliments** : 170 aliments (dont houmous, falafel, shakshuka, cottage, bamba…), calories et protéines, en 3 langues, avec les fautes de frappe acceptées.
- **Journal du jour** : « + Ajouter à mon journal » sur un aliment, puis les barres montrent tes calories et protéines du jour par rapport à ton objectif.
- **Calculateur** : calories et macros selon ton âge, poids, taille, activité et objectif.

### 📈 Mes progrès
- Séances, semaines d'affilée, kg soulevés, calendrier des 12 dernières semaines.
- Courbe et tableau par exercice, records.
- **Poids du corps** : une pesée par jour, courbe, rythme par semaine (met aussi à jour le calculateur).
- **Sauvegarde en ligne chiffrée** : un code personnel de 12 caractères permet de retrouver tout ton carnet sur un nouveau téléphone. **Garde ce code précieusement** : sans lui, personne ne peut récupérer la sauvegarde.
- **Sauvegarde par fichier** (repliée) : télécharger / restaurer un fichier.

---

## 4. Modifier le site sur l'ordinateur

1. Ouvre le dossier du projet dans **VS Code**.
2. Pour voir le site : clic droit sur **`public/index.html`** → **« Open with Live Server »**.
   (Ouvrir le fichier par double-clic marche aussi, mais **les vidéos ne se lisent pas** dans ce cas.)
3. Demande les changements à Claude, regarde le résultat dans le navigateur.

Tous les fichiers du site sont dans **`public/`**. Rien d'autre ne doit y aller.

---

## 5. Mettre en ligne

Avec Claude : dis simplement **« envoie »**. Claude enregistre les changements sur GitHub, Cloudflare met le site à jour **en ~1 minute**, puis Claude vérifie que c'est bien en ligne.

Sur le téléphone, si l'ancienne version reste affichée : **ferme et rouvre** la page ou l'application une ou deux fois.

---

## 6. Vérifier sur un vrai téléphone

Tout a été testé le 28/10/2026 sur un téléphone simulé (voir l'historique ci-dessous).
Ce qui ne peut se vérifier que sur un vrai téléphone :

- [ ] Le minuteur **vibre et bipe** à la fin du repos.
- [ ] En séance guidée, l'**écran reste allumé**.
- [ ] Une **vidéo** démarre quand on touche la photo d'un exercice.
- [ ] En **mode avion**, l'application s'ouvre et les programmes s'affichent.

---

## 7. Idées pour plus tard

- Badges de motivation (« 10 séances », « 4 semaines d'affilée »…).
- Compteur d'eau dans le journal du jour.
- Partager un record en image (WhatsApp, Instagram).
- Mettre tes propres photos de la salle pour les 3 exercices sans photo (leg curl allongé, dips assis machine, rowing T-bar).
- Liens Instagram / YouTube et adresse de contact en bas de page, **si tu crées ces comptes**.
- Nom de domaine personnel : **pas pour l'instant** (tu ne veux pas payer), on garde l'adresse gratuite.

---

## 8. Historique du projet

| Date | Ce qui a été fait |
|---|---|
| 21/10/2026 | Structure du site (téléphone d'abord), mise en ligne sur Cloudflare, calculateur |
| 21/10/2026 | Nutrition avec photos, repas variés, recherche d'aliments |
| 21/10/2026 | Pages programmes (2 à 5 séances, minuteur, choix des exercices, carnet), photos d'exercices |
| 22/10/2026 | Anglais et hébreu (la mise en page ne bouge pas quand on change de langue) |
| 26/10/2026 | Application installable et hors ligne, aperçu de partage |
| 26/10/2026 | Séance guidée facultative |
| 26/10/2026 | Page « Mes progrès » |
| 26/10/2026 | Sauvegarde en ligne chiffrée avec code personnel |
| 27/10/2026 | Records, poids du corps, disques & charge max |
| 27/10/2026 | Échauffement calculé, Mon programme, semaine légère, journal du jour, 170 aliments |
| 27/10/2026 | Vidéos YouTube (FR / EN / HE), rowing T-bar avec appui poitrine |
| 28/10/2026 | Page Confidentialité, bas de page sans faux liens |
| 28/10/2026 | Vérification complète du site en ligne, boutons plus faciles à toucher |
