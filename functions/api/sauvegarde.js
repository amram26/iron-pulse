/* ==========================================================
   IRON PULSE — Sauvegarde en ligne du carnet
   Cloudflare Pages Functions : répond sur /api/sauvegarde.
   Stockage : espace KV relié au projet sous le nom « SAUVEGARDES ».

   Les données arrivent DÉJÀ CHIFFRÉES par le navigateur (AES-GCM,
   clé tirée du code personnel). Le serveur ne connaît ni le code ni
   le contenu : il range un bloc illisible sous un identifiant
   (empreinte SHA-256 du code).

   GET    /api/sauvegarde?id=<64 hex>  → la sauvegarde chiffrée (404 si aucune)
   PUT    /api/sauvegarde?id=<64 hex>  → enregistre { iv, donnees }
   DELETE /api/sauvegarde?id=<64 hex>  → supprime la sauvegarde
   ========================================================== */

const ID_VALIDE = /^[a-f0-9]{64}$/;
const TAILLE_MAX = 512 * 1024; // 512 Ko : un carnet très rempli pèse quelques dizaines de Ko
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

const repondre = (corps, statut = 200) => new Response(JSON.stringify(corps), {
    status: statut,
    headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
    }
});

export async function onRequest({ request, env }) {
    if (!env.SAUVEGARDES) return repondre({ erreur: 'stockage-non-configure' }, 503);

    const id = new URL(request.url).searchParams.get('id') || '';
    if (!ID_VALIDE.test(id)) return repondre({ erreur: 'id-invalide' }, 400);
    const cle = `carnet:${id}`;

    if (request.method === 'GET') {
        const sauvegarde = await env.SAUVEGARDES.get(cle);
        if (!sauvegarde) return repondre({ erreur: 'introuvable' }, 404);
        return new Response(sauvegarde, {
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }
        });
    }

    if (request.method === 'PUT') {
        const texte = await request.text();
        if (texte.length > TAILLE_MAX) return repondre({ erreur: 'trop-volumineux' }, 413);

        let corps;
        try { corps = JSON.parse(texte); } catch (e) { return repondre({ erreur: 'format' }, 400); }
        const valide = corps && typeof corps.iv === 'string' && typeof corps.donnees === 'string'
            && BASE64.test(corps.iv) && BASE64.test(corps.donnees);
        if (!valide) return repondre({ erreur: 'format' }, 400);

        const date = new Date().toISOString();
        await env.SAUVEGARDES.put(cle, JSON.stringify({ version: 1, iv: corps.iv, donnees: corps.donnees, date }));
        return repondre({ ok: true, date });
    }

    if (request.method === 'DELETE') {
        await env.SAUVEGARDES.delete(cle);
        return repondre({ ok: true });
    }

    return new Response(null, { status: 405, headers: { Allow: 'GET, PUT, DELETE' } });
}
