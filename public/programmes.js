/* ==========================================================
   IRON PULSE — Données des programmes d'entraînement
   Une séance = une liste d'exercices avec un rôle :
   « base » (gros mouvement) ou « iso » (exercice ciblé).
   Séries, répétitions et repos dépendent de l'objectif (SCHEMAS).
   img : nom du fichier dans images/exercices/ (sinon emoji).
   groupe : exercices interchangeables (mêmes muscles) pour le
   bouton « Changer d'exercice ».
   ========================================================== */

const EXERCICES = {
    // ---------- Jambes ----------
    'squat': { nom: "Squat à la barre", muscles: "Cuisses, fessiers", groupe: "jambes", img: "squat", emoji: "🦵",
        conseil: "Dos plat et talons au sol, descends au moins jusqu'à ce que les cuisses soient parallèles au sol. Règle les barres de sécurité du rack juste sous ta position basse." },
    'presse': { nom: "Presse à cuisses", muscles: "Cuisses, fessiers", groupe: "jambes", img: "presse", emoji: "🦵",
        conseil: "Pousse avec tout le pied, bas du dos bien collé au dossier : descends sans que les fesses décollent, et ne verrouille pas les genoux en haut." },
    'squat-goblet': { nom: "Squat avec haltère", muscles: "Cuisses, fessiers", groupe: "jambes", img: "squat-goblet", emoji: "🦵",
        conseil: "Tiens un haltère contre la poitrine, descends en gardant le buste droit." },
    'hack-squat': { nom: "Hack squat (machine)", muscles: "Cuisses, fessiers", groupe: "jambes", img: "hack-squat", emoji: "🦵",
        conseil: "Dos bien collé au dossier, descends profond en gardant les talons au sol." },
    'smith-squat': { nom: "Squat à la Smith machine", muscles: "Cuisses, fessiers", groupe: "jambes", img: "smith-squat", emoji: "🦵",
        conseil: "Pieds légèrement devant la barre, descends en gardant le dos droit. La barre guidée rassure au début." },
    'fentes': { nom: "Fentes avec haltères", muscles: "Cuisses, fessiers", groupe: "jambes", img: "fentes", emoji: "🦵",
        conseil: "Grand pas en avant, le genou arrière frôle le sol. Les répétitions comptent par jambe." },
    'leg-ext': { nom: "Leg extension (machine)", muscles: "Avant des cuisses", groupe: "jambes-ciblees", img: "leg-ext", emoji: "🦵",
        conseil: "Tends les jambes, tiens une seconde en haut, redescends lentement." },
    'sdt-roumain': { nom: "Soulevé de terre jambes tendues", muscles: "Arrière des cuisses, fessiers", groupe: "charniere", img: "sdt-roumain", emoji: "🦵",
        conseil: "Dos plat, genoux légèrement pliés : pousse les fesses en arrière en gardant la barre près des jambes, puis remonte en serrant les fessiers." },
    'souleve': { nom: "Soulevé de terre", muscles: "Dos, fessiers, jambes", groupe: "charniere", img: "souleve", emoji: "🏋️",
        conseil: "Dos plat, barre collée aux tibias : pousse le sol avec les jambes." },
    'hip-thrust': { nom: "Hip thrust", muscles: "Fessiers", groupe: "fessiers", img: "hip-thrust", emoji: "🦵",
        conseil: "Dos appuyé sur un banc, monte les hanches et serre les fessiers une seconde en haut." },
    'hip-thrust-machine': { nom: "Hip thrust (machine)", muscles: "Fessiers", groupe: "fessiers", img: "hip-thrust-machine", emoji: "🦵",
        conseil: "Règle la ceinture sur les hanches, pousse vers le haut et serre les fessiers une seconde." },
    'leg-curl': { nom: "Leg curl assis (machine)", muscles: "Arrière des cuisses", groupe: "ischios", img: "leg-curl", emoji: "🦵",
        conseil: "Cale bien le haut des cuisses sous le rouleau, plie les jambes en contrôlant, puis remonte lentement." },
    'sdt-halteres': { nom: "Soulevé de terre jambes tendues aux haltères", muscles: "Arrière des cuisses, fessiers", groupe: "charniere", img: "sdt-halteres", emoji: "🦵",
        conseil: "Haltères le long des jambes, genoux légèrement pliés : descends en poussant les fesses en arrière, dos plat, puis remonte en serrant les fessiers." },
    'leg-curl-allonge': { nom: "Leg curl allongé (machine)", muscles: "Arrière des cuisses", groupe: "ischios", emoji: "🦵",
        conseil: "Hanches bien plaquées sur le banc, ramène les talons vers les fesses sans à-coup." },
    'mollets': { nom: "Mollets debout", muscles: "Mollets", groupe: "mollets", img: "mollets", emoji: "🦶",
        conseil: "Monte sur la pointe des pieds le plus haut possible, redescends lentement." },
    'mollets-assis': { nom: "Mollets assis (machine)", muscles: "Mollets", groupe: "mollets", img: "mollets-assis", emoji: "🦶",
        conseil: "Amplitude complète : talons bien bas, puis pointe des pieds bien haut." },

    // ---------- Pectoraux & épaules ----------
    'dc': { nom: "Développé couché", muscles: "Pectoraux, triceps", groupe: "pecs", img: "developpe-couche", emoji: "🏋️",
        conseil: "Omoplates serrées, pieds au sol, descends la barre jusqu'à la poitrine sans la faire rebondir. En lourd, demande à quelqu'un de rester derrière toi pour t'aider, ou règle les barres de sécurité du rack." },
    'dc-incline': { nom: "Développé incliné aux haltères", muscles: "Haut des pectoraux", groupe: "pecs", img: "developpe-incline", emoji: "🏋️",
        conseil: "Banc légèrement incliné, descends les haltères lentement de chaque côté de la poitrine." },
    'pompes': { nom: "Pompes", muscles: "Pectoraux, triceps", groupe: "pecs", img: "pompes", emoji: "💪",
        conseil: "Corps gainé, descends la poitrine près du sol. Trop facile ? Mets les pieds sur un banc." },
    'dips': { nom: "Dips", muscles: "Triceps, pectoraux", groupe: "triceps", img: "dips", emoji: "💪",
        conseil: "Descends jusqu'à ce que les coudes forment un angle droit, buste légèrement penché en avant. Trop dur ? Utilise la machine de dips assistés." },
    'chest-press': { nom: "Développé pectoraux (machine)", muscles: "Pectoraux, triceps", groupe: "pecs", img: "chest-press", emoji: "🏋️",
        conseil: "Règle le siège pour avoir les poignées à hauteur de poitrine, pousse sans décoller le dos." },
    'smith-incline': { nom: "Développé incliné à la Smith machine", muscles: "Haut des pectoraux", groupe: "pecs", img: "smith-incline", emoji: "🏋️",
        conseil: "Banc légèrement incliné sous la barre guidée, descends jusqu'au haut de la poitrine." },
    'ecarte': { nom: "Écarté à la poulie", muscles: "Pectoraux", groupe: "pecs-cibles", img: "ecarte", emoji: "🏋️",
        conseil: "Bras légèrement pliés, rapproche les mains devant la poitrine." },
    'butterfly': { nom: "Butterfly (machine)", muscles: "Pectoraux", groupe: "pecs-cibles", img: "butterfly", emoji: "🏋️",
        conseil: "Rapproche les poignées devant toi en serrant les pectoraux, reviens lentement." },
    'dm': { nom: "Développé militaire", muscles: "Épaules", groupe: "epaules", img: "developpe-militaire", emoji: "🏋️",
        conseil: "Abdos serrés, pousse la barre au-dessus de la tête sans cambrer le dos." },
    'dm-halteres': { nom: "Développé épaules aux haltères", muscles: "Épaules", groupe: "epaules", img: "developpe-halteres", emoji: "🏋️",
        conseil: "Assis dos droit, pousse les haltères au-dessus de la tête puis redescends aux oreilles." },
    'dm-machine': { nom: "Développé épaules (machine)", muscles: "Épaules", groupe: "epaules", img: "dm-machine", emoji: "🏋️",
        conseil: "Dos collé au dossier, pousse les poignées vers le haut sans verrouiller les coudes." },
    'elevations': { nom: "Élévations latérales", muscles: "Épaules", groupe: "epaules-ciblees", img: "elevations", emoji: "💪",
        conseil: "Haltères légers : monte les bras sur les côtés jusqu'à la hauteur des épaules." },
    'elevations-poulie': { nom: "Élévations latérales à la poulie", muscles: "Épaules", groupe: "epaules-ciblees", img: "elevations-poulie", emoji: "💪",
        conseil: "Poulie basse, un bras à la fois : monte le bras sur le côté jusqu'à l'épaule, redescends lentement." },
    'face-pull': { nom: "Face pull", muscles: "Arrière des épaules", groupe: "epaules-arriere", img: "face-pull", emoji: "💪",
        conseil: "Poulie à hauteur du visage (ou un peu plus haut) : tire la corde vers le front en écartant les mains, coudes hauts. Très bon pour la santé des épaules." },
    'oiseau-machine': { nom: "Oiseau à la machine", muscles: "Arrière des épaules", groupe: "epaules-arriere", img: "oiseau-machine", emoji: "💪",
        conseil: "Face à la machine, ouvre les bras vers l'arrière en gardant les coudes légèrement pliés." },

    // ---------- Dos ----------
    'traction': { nom: "Tractions", muscles: "Dos, biceps", groupe: "dos-vertical", img: "traction", emoji: "💪",
        conseil: "Tire les coudes vers les hanches. Trop dur ? Prends un élastique d'aide ou le tirage vertical." },
    'tirage-vertical': { nom: "Tirage vertical (machine)", muscles: "Dos, biceps", groupe: "dos-vertical", img: "tirage-vertical", emoji: "💪",
        conseil: "Tire la barre vers le haut de la poitrine en gardant le buste droit." },
    'rowing': { nom: "Rowing haltère", muscles: "Dos", groupe: "dos-horizontal", img: "rowing", emoji: "💪",
        conseil: "Un genou et une main posés sur le banc, dos plat : tire l'haltère vers la hanche en serrant l'omoplate." },
    'tirage-horizontal': { nom: "Tirage horizontal à la poulie", muscles: "Milieu du dos", groupe: "dos-horizontal", img: "tirage-horizontal", emoji: "💪",
        conseil: "Poitrine sortie, tire vers le ventre et serre les omoplates." },
    'rowing-machine': { nom: "Rowing assis (machine)", muscles: "Milieu du dos", groupe: "dos-horizontal", img: "rowing-machine", emoji: "💪",
        conseil: "Poitrine contre l'appui, tire les poignées vers toi en serrant les omoplates." },
    'rowing-t': { nom: "Rowing T-bar avec appui poitrine", muscles: "Milieu du dos", groupe: "dos-horizontal", emoji: "💪",
        conseil: "Poitrine bien collée à l'appui pendant toute la série (ça protège le bas du dos), tire les poignées vers le ventre en serrant les omoplates, coudes près du corps, puis redescends lentement." },

    // ---------- Bras ----------
    'curl': { nom: "Curl haltères", muscles: "Biceps", groupe: "biceps", img: "curl", emoji: "💪",
        conseil: "Coudes collés au corps, monte sans balancer le buste." },
    'curl-marteau': { nom: "Curl marteau", muscles: "Biceps, avant-bras", groupe: "biceps", img: "curl-marteau", emoji: "💪",
        conseil: "Paumes face à face, monte les haltères sans bouger les coudes." },
    'curl-poulie': { nom: "Curl à la poulie", muscles: "Biceps", groupe: "biceps", img: "curl-poulie", emoji: "💪",
        conseil: "Poulie basse, coudes fixes le long du corps, monte la barre jusqu'aux épaules." },
    'curl-pupitre': { nom: "Curl au pupitre (machine)", muscles: "Biceps", groupe: "biceps", img: "curl-pupitre.jpg", emoji: "💪",
        conseil: "Bras posés sur le pupitre, monte sans décoller les coudes et redescends lentement." },
    'triceps': { nom: "Extension triceps à la poulie", muscles: "Triceps", groupe: "triceps", img: "triceps", emoji: "💪",
        conseil: "Coudes collés au corps, tends complètement les bras en bas." },
    'extension-haltere': { nom: "Extension triceps au-dessus de la tête", muscles: "Triceps", groupe: "triceps", img: "extension-haltere", emoji: "💪",
        conseil: "Un haltère à deux mains derrière la tête, tends les bras vers le plafond." },
    'triceps-machine': { nom: "Dips assis (machine)", muscles: "Triceps", groupe: "triceps", emoji: "💪",
        conseil: "Assis, coudes près du corps, pousse les poignées vers le bas jusqu'à bras tendus." },

    // ---------- Abdominaux ----------
    'gainage': { nom: "Gainage (planche)", muscles: "Abdominaux", groupe: "abdos", img: "gainage", emoji: "🔥", duree: true,
        conseil: "Corps bien droit des épaules aux talons, ne laisse pas tomber les hanches." },
    'abdos': { nom: "Relevés de jambes", muscles: "Abdominaux", groupe: "abdos", img: "abdos", emoji: "🔥",
        conseil: "Allongé (bas du dos collé au sol) ou suspendu à une barre, monte les jambes sans prendre d'élan et redescends lentement. Plie les genoux si c'est trop dur." },
    'crunch': { nom: "Crunch", muscles: "Abdominaux", groupe: "abdos", img: "crunch", emoji: "🔥",
        conseil: "Enroule le haut du dos en soufflant, sans tirer sur la nuque." },
    'crunch-machine': { nom: "Crunch à la machine", muscles: "Abdominaux", groupe: "abdos", img: "crunch-machine", emoji: "🔥",
        conseil: "Enroule le buste vers les genoux en soufflant, charge modérée et mouvement contrôlé." }
};

const SEANCES = {
    'full-a': { nom: "Full body A", court: "Full A", focus: "Tout le corps",
        exos: [['squat', 'base'], ['dc', 'base'], ['rowing', 'base'], ['elevations', 'iso'], ['curl', 'iso'], ['gainage', 'iso']] },
    'full-b': { nom: "Full body B", court: "Full B", focus: "Tout le corps",
        exos: [['sdt-roumain', 'base'], ['dm', 'base'], ['traction', 'base'], ['fentes', 'iso'], ['triceps', 'iso'], ['mollets', 'iso']] },
    'full-c': { nom: "Full body C", court: "Full C", focus: "Tout le corps",
        exos: [['presse', 'base'], ['dc-incline', 'base'], ['tirage-horizontal', 'base'], ['leg-curl', 'iso'], ['face-pull', 'iso'], ['abdos', 'iso']] },
    'haut-a': { nom: "Haut du corps A", court: "Haut A", focus: "Pectoraux, dos, épaules, bras",
        exos: [['dc', 'base'], ['rowing', 'base'], ['dm', 'base'], ['traction', 'base'], ['curl', 'iso'], ['triceps', 'iso']] },
    'bas-a': { nom: "Bas du corps A", court: "Bas A", focus: "Cuisses, fessiers, mollets",
        exos: [['squat', 'base'], ['sdt-roumain', 'base'], ['presse', 'base'], ['leg-curl', 'iso'], ['mollets', 'iso'], ['gainage', 'iso']] },
    'haut-b': { nom: "Haut du corps B", court: "Haut B", focus: "Pectoraux, dos, épaules, bras",
        exos: [['smith-incline', 'base'], ['tirage-horizontal', 'base'], ['elevations', 'iso'], ['ecarte', 'iso'], ['face-pull', 'iso'], ['curl', 'iso'], ['triceps', 'iso']] },
    'bas-b': { nom: "Bas du corps B", court: "Bas B", focus: "Fessiers, cuisses, abdos",
        exos: [['souleve', 'base'], ['hip-thrust', 'base'], ['fentes', 'iso'], ['leg-ext', 'iso'], ['leg-curl', 'iso'], ['abdos', 'iso']] },
    // Semaine à 5 séances : pecs-épaules-triceps / dos-biceps / jambes, puis on recommence (versions B)
    'push': { nom: "Pecs, épaules, triceps A", court: "Pecs A", focus: "Pectoraux, épaules, arrière des bras",
        exos: [['dc', 'base'], ['dm', 'base'], ['dc-incline', 'base'], ['elevations', 'iso'], ['dips', 'iso'], ['triceps', 'iso']] },
    'pull': { nom: "Dos, biceps A", court: "Dos A", focus: "Dos, avant des bras",
        exos: [['traction', 'base'], ['rowing', 'base'], ['tirage-horizontal', 'base'], ['face-pull', 'iso'], ['curl', 'iso'], ['abdos', 'iso']] },
    'jambes': { nom: "Jambes", court: "Jambes", focus: "Cuisses, fessiers, mollets",
        exos: [['squat', 'base'], ['sdt-roumain', 'base'], ['presse', 'base'], ['leg-ext', 'iso'], ['leg-curl', 'iso'], ['mollets', 'iso']] },
    'push-b': { nom: "Pecs, épaules, triceps B", court: "Pecs B", focus: "Pectoraux, épaules, arrière des bras",
        exos: [['smith-incline', 'base'], ['dm-halteres', 'base'], ['dips', 'base'], ['ecarte', 'iso'], ['elevations', 'iso'], ['extension-haltere', 'iso']] },
    'pull-b': { nom: "Dos, biceps B", court: "Dos B", focus: "Dos, avant des bras",
        exos: [['tirage-vertical', 'base'], ['rowing', 'base'], ['face-pull', 'iso'], ['curl-marteau', 'iso'], ['curl', 'iso'], ['crunch', 'iso']] }
};

// Organisation de la semaine selon le nombre de séances (null = repos), du dimanche au samedi.
// Vendredi et samedi sont toujours des jours de repos.
const SPLITS = {
    2: { description: "Tout le corps à chaque séance : idéal si tu as peu de temps.",
        semaine: ['full-a', null, null, 'full-b', null, null, null] },
    3: { description: "Tout le corps, 3 séances différentes : le meilleur choix pour bien progresser.",
        semaine: ['full-a', null, 'full-b', null, 'full-c', null, null] },
    4: { description: "Haut du corps et bas du corps en alternance : chaque muscle 2 fois par semaine.",
        semaine: ['haut-a', 'bas-a', null, 'haut-b', 'bas-b', null, null] },
    5: { description: "Pecs-épaules-triceps, dos-biceps, jambes, puis on recommence : vendredi et samedi restent libres.",
        semaine: ['push', 'pull', 'jambes', 'push-b', 'pull-b', null, null] }
};

// Séries, répétitions et repos (en secondes) selon l'objectif et le rôle de l'exercice
const SCHEMAS = {
    masse: {
        base: { series: 4, reps: "8 à 10", repos: 120 },
        iso: { series: 3, reps: "10 à 12", repos: 90 }
    },
    seche: {
        base: { series: 3, reps: "8 à 10", repos: 90 },
        iso: { series: 3, reps: "12 à 15", repos: 60 }
    },
    force: {
        premier: { series: 5, reps: "3 à 5", repos: 180 },
        base: { series: 3, reps: "6 à 8", repos: 120 },
        iso: { series: 3, reps: "10 à 12", repos: 90 }
    },
    duree: { series: 3, reps: "30 à 45 secondes", repos: 60 }
};

const PROGRAMMES = {
    masse: {
        titre: "Prise de masse", tag: "Hypertrophie", img: "images/prise-de-masse.webp", joursDefaut: 4,
        intro: "Gagner du muscle : des charges moyennes, beaucoup de séries, et manger un peu plus que ce que tu dépenses.",
        regles: [
            ["📈", "Progresse chaque semaine", "Ajoute une répétition ou un peu de poids dès que c'est possible."],
            ["🎯", "Va presque jusqu'au bout", "Arrête chaque série quand il te reste 1 ou 2 répétitions dans le réservoir."],
            ["🍽️", "Mange un peu plus", "Environ 300 kcal de plus que tes besoins, avec beaucoup de protéines."],
            ["😴", "Récupère", "7 à 9 h de sommeil : c'est là que le muscle grandit."]
        ]
    },
    seche: {
        titre: "Perte de gras", tag: "Sèche & définition", img: "images/perte-de-gras.webp", joursDefaut: 3, cardio: true,
        intro: "Perdre du gras en gardant ton muscle : de la musculation, un peu de cardio et un léger déficit calorique.",
        regles: [
            ["🏋️", "Garde des charges lourdes", "C'est ce qui dit à ton corps de garder ses muscles."],
            ["🏃", "Ajoute du cardio", "15 min après chaque séance, et 8 000 à 10 000 pas par jour."],
            ["🍽️", "Mange un peu moins", "Environ 400 kcal de moins que tes besoins, mais beaucoup de protéines."],
            ["⚖️", "Sois patient", "Vise 0,5 à 1 % de ton poids en moins par semaine, pas plus."]
        ]
    },
    force: {
        titre: "Force", tag: "Powerbuilding", img: "images/force.webp", joursDefaut: 4,
        intro: "Devenir plus fort sur les grands mouvements : séries lourdes sur le premier exercice, puis du travail pour le muscle.",
        regles: [
            ["🔥", "Échauffe-toi bien", "Fais 3 ou 4 séries de plus en plus lourdes avant tes séries de travail."],
            ["🏋️", "Le premier exercice est lourd", "3 à 5 répétitions, avec 3 min de repos pour être à fond."],
            ["📈", "Monte petit à petit", "Ajoute 2,5 kg dès que toutes tes séries passent proprement."],
            ["✅", "La technique d'abord", "Une répétition propre vaut mieux qu'une répétition lourde mal faite."]
        ]
    }
};
