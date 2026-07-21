# Images OG sur Cloudflare Workers : Corriger les timeouts d'auto-requêtes

**TL;DR** — `nuxt-og-image` (v6.4.3) utilise `$fetch()`/`event.$fetch()` pour charger
les composants d'îles Vue et les assets images pendant le rendu des images OG. Sur
Cloudflare Workers, le fait de requêter son propre domaine cause un timeout 522. La
solution : remplacer chaque auto-requête par `useNitroApp().localFetch()`, qui garde la
requête à l'intérieur du processus Worker.

---

## Le problème

Après avoir déployé une app Nuxt 4 sur Cloudflare Workers via NuxtHub, les images OG
ne se chargeaient pas sur Discord, Twitter ou les crawlers. La page de preview OG dans
l'admin affichait :

```json
{
  "error": true,
  "statusCode": 502,
  "message": "Failed to fetch https://zimablue.cc/: 522 <none>"
}
```

**522** est le code Cloudflare pour "Connection Timed Out". Cela signifie que le Worker
a essayé de requêter son propre domaine sans pouvoir s'atteindre. Il était
déjà occupé à traiter la requête en cours. C'est une limitation fondamentale des
Cloudflare Workers : un Worker ne peut pas `fetch()` son propre domaine de manière
fiable.

## Architecture

L'application utilise `@nuxtjs/seo` (qui embarque `nuxt-og-image` v6.4.3) avec des
**composants Takumi** : des templates `.takumi.vue` personnalisés rendus côté serveur
en images PNG via `@takumi-rs/wasm`.

Le pipeline de rendu d'une seule image OG implique **trois requêtes internes** :

1. **Requête d'île** : `fetchIsland()` dans `kit.js` récupère le composant d'île Vue
   rendu à `/_nuxt_island/{Component}_{hash}.json?props=...`
2. **Assets images** : `fetchLocalAsset()` dans `fetchLocalAsset.js` récupère chaque
   source `<img>` (vignettes, couvertures) pour les convertir en data URI base64
3. **Preview admin** : Notre API `/api/admin/og-preview` récupère le HTML d'une page
   pour extraire les balises OG et les afficher dans le tableau de bord

Chacune de ces étapes utilisait `event.$fetch()` ou `$fetch()` global, qui sur
Cloudflare Workers se résolvent en une requête HTTP vers le domaine du Worker lui-même. Timeout garanti.

## La solution

Nitro (le moteur serveur qui fait tourner Nuxt) expose `useNitroApp().localFetch()`,
une méthode qui achemine une requête directement à travers le gestionnaire d'applications
Nitro, sans passer par HTTP. C'est la même fonction que Nitro utilise pour traiter les
requêtes entrantes dans le point d'entrée du runtime Cloudflare Worker.

Le pattern est simple :

```diff
-const html = await event.$fetch('/some/path', { headers: { accept: 'text/html' } })
+const nitroApp = useNitroApp()
+const response = await nitroApp.localFetch('/some/path', {
+  headers: { accept: 'text/html' }
+})
+const html = await response.text()
```

J'ai appliqué ce correctif à trois endroits dans `node_modules/nuxt-og-image/dist/runtime/` :

### 1. `server/util/kit.js` — `fetchIsland()` (critique)

Toutes les images OG Takumi passent par cette fonction. Elle récupère le composant
d'île Vue rendu avec les props serveur. Sans ce correctif, aucune image OG ne pouvait
être rendue.

### 2. `server/util/fetchLocalAsset.js` — `fetchLocalAsset()`

Les composants Takumi contiennent des balises `<img>` pour les vignettes et les images
de couverture. Le plugin de résolution d'images récupère chaque image pour l'intégrer
en data URI base64. Ces requêtes référençaient aussi le Worker lui-même.

### 3. `server/routes/resolve.js` — gestionnaire `/_og/r/`

Route secondaire utilisée pour la résolution dynamique d'image OG. Moins critique mais
suivait le même motif d'auto-requête.

J'ai aussi corrigé notre **API de preview OG admin** (`server/api/admin/og-preview.get.ts`)
qui avait exactement le même problème.

## Le système de patches

Le projet utilise des fichiers `patch` bruts appliqués via `postinstall` dans
`package.json`. J'ai mis à jour le `nuxt-og-image+6.4.3.patch` existant (qui
corrigeait déjà un bug de calcul de hash) et ajouté deux nouveaux fichiers de patch
pour les auto-requêtes restantes :

```json
"postinstall": "patch -p1 -i patches/nuxt-og-image+6.4.3.patch --forward --no-backup-if-mismatch ..."
```

Les patches sont des diffs unifiés ciblant les fichiers dans `node_modules/`, appliqués
avec `patch -p1` (suppression du premier segment de chemin). Le flag `--forward`
ignore les patches déjà appliqués, rendant les réinstallations sûres.

## Leçons apprises

1. **Cloudflare Workers + auto-requête ne font pas bon ménage.** Toute requête HTTP
   qu'un Worker fait vers son propre domaine timeout avec 522. Utilisez `localFetch`
   pour le routage interne.

2. **`useNitroApp().localFetch()` est l'échappatoire.** Elle contourne le réseau et
   achemine directement via le gestionnaire de requêtes Nitro. Le même chemin que les
   requêtes entrantes.

3. **Patchez avec parcimonie, documentez clairement.** Patcher `node_modules` est parfois
   la seule option quand un module n'expose pas les bons hooks. Gardez les patches
   petits, ciblés et bien documentés pour pouvoir les supprimer quand le correctif
   atterrit en amont.

4. **La preview admin n'est pas le vrai problème.** L'erreur originale était rapportée
   dans la preview OG admin, mais le pipeline de rendu lui-même (`fetchIsland` →
   `createVNodes` → rendu Takumi) avait les mêmes problèmes d'auto-requête. Tracez
   toujours le pipeline complet.

## Test

En local, l'endpoint d'image OG (`/_og/d/{encoded}.png`) retourne désormais un PNG
valide de 1200×630. L'API de preview admin ne crashe plus. Après déploiement,
vérifiez avec :

```bash
curl -s https://votre-domaine.com/ | grep 'og:image' | head -1
# Puis vérifiez que l'URL retourne une image :
curl -s -o /dev/null -w "%{http_code} %{content_type}" <url-image-og>
```

Et testez sur les plateformes réelles : Discord, Twitter Card Validator, Facebook
Sharing Debugger.

À bientôt pour un autre article.
