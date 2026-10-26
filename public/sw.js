/* ==========================================================
   IRON PULSE — Service worker (application hors ligne)
   - Pages : réseau d'abord (pour avoir la dernière version),
     copie en cache si pas de réseau (en salle, sous-sol…).
   - CSS / JS / traductions : réponse immédiate depuis le cache,
     mise à jour en arrière-plan pour la prochaine visite.
   - Photos et polices : gardées en cache dès qu'elles ont été vues.
   Changer VERSION à chaque modification de ce fichier pour
   renouveler les fichiers de base. Les photos ont leur propre
   version (VERSION_PHOTOS) : on ne la change que si des photos
   existantes sont remplacées, pour éviter de tout retélécharger.
   ========================================================== */

const VERSION = 'v3';
const VERSION_PHOTOS = 'v1';
const CACHE_BASE = `iron-pulse-base-${VERSION}`;
const CACHE_PHOTOS = `iron-pulse-photos-${VERSION_PHOTOS}`;

// Cloudflare Pages sert les pages sans « .html » : on met en cache les adresses finales
const FICHIERS_BASE = [
    '/',
    '/programme',
    '/progres',
    '/style.css',
    '/script.js',
    '/i18n.js',
    '/i18n/en.js',
    '/i18n/he.js',
    '/aliments.js',
    '/programmes.js',
    '/manifest.webmanifest',
    '/icons/favicon.svg',
    '/icons/icon-192.png',
    '/images/hero.webp',
    '/images/prise-de-masse.webp',
    '/images/perte-de-gras.webp',
    '/images/force.webp'
];

self.addEventListener('install', evenement => {
    evenement.waitUntil(
        // Un fichier manquant ne doit pas empêcher de mettre les autres en cache
        caches.open(CACHE_BASE)
            .then(cache => Promise.allSettled(FICHIERS_BASE.map(fichier => cache.add(fichier))))
            .then(() => self.skipWaiting())
    );
});

// Supprime les caches des anciennes versions
self.addEventListener('activate', evenement => {
    evenement.waitUntil(
        caches.keys()
            .then(noms => Promise.all(noms
                .filter(nom => nom.startsWith('iron-pulse-') && nom !== CACHE_BASE && nom !== CACHE_PHOTOS)
                .map(nom => caches.delete(nom))))
            .then(() => self.clients.claim())
    );
});

// « /programme.html?objectif=masse » → « /programme » ; « /index.html » → « / »
const pageEnCache = url => {
    const chemin = url.pathname.replace(/\.html$/, '').replace(/\/index$/, '/');
    return caches.match(chemin || '/', { ignoreSearch: true });
};

const reseauDabord = async requete => {
    try {
        const reponse = await fetch(requete);
        if (reponse.ok && !reponse.redirected) {
            const cache = await caches.open(CACHE_BASE);
            cache.put(new URL(requete.url).pathname, reponse.clone());
        }
        return reponse;
    } catch (erreur) {
        return (await pageEnCache(new URL(requete.url))) || (await caches.match('/'));
    }
};

const cacheEtMiseAJour = async (requete, nomCache) => {
    const cache = await caches.open(nomCache);
    const enCache = await cache.match(requete, { ignoreSearch: true });
    const reseau = fetch(requete)
        .then(reponse => {
            if (reponse.ok || reponse.type === 'opaque') cache.put(requete, reponse.clone());
            return reponse;
        })
        .catch(() => enCache);
    return enCache || reseau;
};

const cacheDabord = async (requete, nomCache) => {
    const cache = await caches.open(nomCache);
    const enCache = await cache.match(requete);
    if (enCache) return enCache;
    const reponse = await fetch(requete);
    if (reponse.ok || reponse.type === 'opaque') cache.put(requete, reponse.clone());
    return reponse;
};

// Demande de la page : mettre en réserve une liste de photos (exercices, aliments) pour le hors ligne
self.addEventListener('message', evenement => {
    if (evenement.data?.type !== 'precharger' || !Array.isArray(evenement.data.urls)) return;
    evenement.waitUntil(caches.open(CACHE_PHOTOS).then(async cache => {
        for (const url of evenement.data.urls) {
            if (await cache.match(url)) continue;
            try {
                const reponse = await fetch(url);
                if (reponse.ok) await cache.put(url, reponse);
            } catch (erreur) { /* plus de réseau : on réessaiera à la prochaine visite */ }
        }
    }));
});

self.addEventListener('fetch', evenement => {
    const requete = evenement.request;
    if (requete.method !== 'GET') return;
    const url = new URL(requete.url);
    // La sauvegarde en ligne doit toujours parler au serveur, jamais à une copie en cache
    if (url.pathname.startsWith('/api/')) return;

    if (requete.mode === 'navigate') {
        evenement.respondWith(reseauDabord(requete));
    } else if (url.origin === self.location.origin && /\.(?:webp|jpe?g|png|svg)$/.test(url.pathname)) {
        evenement.respondWith(cacheDabord(requete, CACHE_PHOTOS));
    } else if (url.origin === self.location.origin) {
        evenement.respondWith(cacheEtMiseAJour(requete, CACHE_BASE));
    } else if (/fonts\.(?:googleapis|gstatic)\.com$/.test(url.hostname)) {
        evenement.respondWith(cacheDabord(requete, CACHE_PHOTOS));
    }
});
