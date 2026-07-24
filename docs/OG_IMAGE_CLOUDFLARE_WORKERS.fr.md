# Images OG sur Cloudflare Workers : 7 bugs, 8 patches, ~20 déploiements

**TL;DR** — Faire fonctionner des images Open Graph jolies (Takumi, thumbnails,
polices personnalisées) sur Nuxt 4 + Cloudflare Workers s'est avéré **bien plus
complexe que prévu**. Sept bugs distincts, huit patches de `node_modules`,
une vingtaine de déploiements, et des centaines de tests plus tard, nous avons
des OG images opérationnelles. Voici l'histoire complète.

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
a essayé de requêter son propre domaine sans pouvoir s'atteindre — il était déjà
occupé à traiter la requête en cours. C'est une limitation fondamentale des
Cloudflare Workers : un Worker ne peut pas `fetch()` son propre domaine.

Mais le problème était bien plus profond que ça. Ce n'était pas un bug, c'était
**une douzaine de bugs interconnectés** qui s'empilaient sur trois couches :
l'application, le module nuxt-og-image, et le runtime Cloudflare.

---

## Architecture

L'application utilise `@nuxtjs/seo` (qui embarque `nuxt-og-image` v6.4.3) avec des
**composants Takumi** : des templates `.takumi.vue` personnalisés rendus côté serveur
en images PNG via `@takumi-rs/wasm`.

Le pipeline de rendu d'une seule image OG implique plusieurs couches :

1. **Résolution du composant** : l'URL OG contient un nom de composant (`c_Default.takumi`)
2. **Requête d'île** : `fetchIsland()` dans `kit.js` récupère le composant d'île Vue
   rendu à `/_nuxt_island/{Component}_{hash}.json?props=...`
3. **Assets images** : les `<img>` dans le composant sont chargés via
   `fetchLocalAsset()` et convertis en data URI base64
4. **Polices** : les fichiers de police (TTF/WOFF2) sont chargés via un resolver
   dédié dans `font-assets`
5. **Preview admin** : Notre API `/api/admin/og-preview` récupère le HTML d'une page
   pour extraire les balises OG

Chaque étape fait une requête réseau ou une requête HTTP vers le Worker —
et sur Cloudflare Workers, **n'importe quelle requête HTTP vers son propre
domaine crée un deadlock**.

---

## Bug #1 : Le hash d'île invalide (upstream)

Le premier obstacle était le plus silencieux. Le `nuxt-og-image` calcule un hash
pour chaque composant d'île afin de valider les requêtes. Mais la version 6.4.3
avait un bug : le hash était calculé avec seulement `[component, props]` (2 arguments)
au lieu de `[component, props, {}, undefined]` (4 arguments) comme l'attendait le
handler d'île de Nuxt 4.

**Résultat** : `400 Invalid island request hash` sur toutes les images.

**Fix** : Patch de `fetchIsland` dans `kit.js` — `patches/nuxt-og-image+6.4.3.patch`

```diff
- const hashId = hash([component, props]).replaceAll("_", "-");
+ const hashId = hash([component, props, {}, undefined]).replace(/[-_]/g, "");
```

---

## Bug #2 : Self-fetch dans fetchIsland (Cloudflare Workers)

Le même `fetchIsland` utilisait `e.$fetch()` pour charger le composant d'île.
Sur Cloudflare Workers, `e.$fetch()` résout l'URL relative en absolue
(`http://localhost/path`) via ofetch, ce qui contourne le routeur interne de Nitro
et tombe dans `globalThis.fetch()` → self-fetch → 522.

**Fix** : Utiliser `e.fetch()` au lieu de `e.$fetch()` — `e.fetch()` garde l'URL
relative intacte et utilise `localFetch` directement.

```diff
- return e.$fetch(`/__nuxt_island/${component}_${hashId}.json`, { params: {...} })
+ const url = `/__nuxt_island/${component}_${hashId}.json?${query}`;
+ return e.fetch(url, { headers: { accept: "application/json" } })
```

> **Pourquoi `e.fetch` vs `e.$fetch` ?** `e.fetch` est configuré dans le handler
> `onRequest` de Nitro pour utiliser `localFetch` avec le contexte d'événement
> correct. `e.$fetch` passe par `ofetch` qui résout les URLs relatives en URLs
> absolues avant d'appeler le fetch sous-jacent, ce qui casse `localFetch`.

---

## Bug #3 : URL du site en localhost (upstream)

L'URL du site était compilée à `http://localhost:3000` pendant le build car
`NUXT_PUBLIC_SITE_URL` n'était pas défini au moment du build. Même avec la variable
d'environnement configurée dans le dashboard Cloudflare (runtime-only), le module
`nuxt-site-config` ne lisait jamais la valeur à runtime.

**Résultat** : `og:image` pointait vers `http://localhost:3000/_og/d/...` au lieu
de `https://zimablue.cc/_og/d/...`.

**Fix** : Patch du middleware `init.js` de `nuxt-site-config` pour lire
`runtimeConfig.public.siteUrl` — la valeur est bien disponible à runtime via
Nitro qui mappe `NUXT_PUBLIC_SITE_URL` → `runtimeConfig.public.siteUrl`.

---

## Bug #4 : URL des thumbnails (Cloudflare Workers)

Les vignettes dans les props OG étaient des URLs absolues : `https://zimablue.cc/images/...`.
Quand le plugin `imageSrc` tentait de les charger, il utilisait `$fetch()` avec
l'URL absolue → self-fetch → 522.

**Fix** : Changer la construction des URLs de thumbnails dans les pages pour
utiliser des chemins relatifs (`/images/...`) au lieu d'URLs absolues.
Modification dans `app/pages/index.vue`, `collections/index.vue`,
`collections/[slug].vue`, `settings.vue`, `developers.vue`.

```diff
- return `${origin}/${cleanPath}`
+ return p.startsWith('/') ? p : `/${p}`
```

Les chemins relatifs forcent le plugin `imageSrc` à passer par `fetchLocalAsset`
→ `localFetch` → le handler Nitro `/images/**:pathname` qui a accès à R2.

---

## Bug #5 : Contexte de plateforme manquant (Cloudflare Workers)

`fetchLocalAsset` utilise `useNitroApp().localFetch()` pour router les requêtes
internes. Mais `localFetch` crée une requête mock via `fetchNodeRequestHandler`
qui ne reçoit **pas** le contexte Cloudflare (`context._platform`). Sans ce contexte,
les handlers Nitro (comme `/images/` qui utilise `hub:blob` pour accéder à R2)
n'ont pas accès aux bindings Cloudflare (BLOB, DB, KV, etc.).

**Résultat** : Les images R2 n'étaient pas accessibles via `localFetch`.

**Fix** : Passer `context: { _platform: event.context?._platform || {} }` dans
l'appel à `localFetch` dans `fetchLocalAsset.js`.

```diff
  return useNitroApp().localFetch(path, {
    method: "GET",
    signal: deadline,
    headers: { ...headers },
+   context: {
+     _platform: event.context?._platform || {}
+   }
  })
```

---

## Bug #6 : Polices en self-fetch (Cloudflare Workers)

Les fichiers de police (TTF/WOFF2) sont chargés par `font-assets/node.js` qui
utilise `fetch(url)` ET `event.$fetch(url)` — deux chemins qui causent un
self-fetch sur Cloudflare Workers.

**Fix** : Remplacer les deux par `fetchLocalAsset` (déjà patché pour utiliser
`localFetch` avec le contexte de plateforme).

---

## Bug #7 : Assets statiques et cache CDN (nuxt-og-image + Cloudflare)

Le module `nuxt-og-image` ajoute par défaut des headers de cache agressifs :

```
cache-control: public, max-age=259200, s-maxage=259200, immutable
```

Avec `immutable`, Cloudflare cache la réponse pendant 3 jours. Même après
redéploiement, l'ancienne image est servie sans toucher le Worker.

**Fix** : Purger manuellement le cache CDN Cloudflare pour les URLs `/_og/*`
entre chaque déploiement. Le cache est parfois difficile à vider complètement
à cause du flag `immutable`.

---

## Bug #8 : Cache de build Cloudflare (infra)

Le système de build Cloudflare restore deux caches séparés avant chaque build :
- **Build output cache** (`.output/`) : l'output Nitro/Vite précédent
- **Dependencies cache** (`node_modules/`) : incluant `node_modules/.cache/nitro/`

Même avec des patches appliqués correctement, le bundle Nitro pouvait réutiliser
des chunks d'un build précédent si les caches n'étaient pas vidés. Les changements
de composants `.vue` n'étaient parfois pas pris en compte.

**Fix** : Ajouter `rm -rf node_modules/.cache .output .nuxt` dans le script
`build` du `package.json` pour forcer un rebuild complet à chaque déploiement.
Ne garder qu'une seule clé `"build"` (un doublon accidentel causait l'utilisation
du mauvais script).

---

## Résultat final

Après **8 patches** appliqués via `postinstall`, les OG images fonctionnent :

| Patch | Fichier source | Problème |
|---|---|---|
| `nuxt-og-image+6.4.3.patch` | `kit.js` | Hash d'île invalide + self-fetch |
| `nuxt-og-image+6.4.3-local-fetch.patch` | `fetchLocalAsset.js` | Self-fetch + contexte de plateforme |
| `nuxt-og-image+6.4.3-resolve-fetch.patch` | `resolve.js` | Self-fetch |
| `nuxt-og-image+6.4.3-image-src.patch` | `imageSrc.js` | Self-fetch URLs absolues |
| `nuxt-og-image+6.4.3-font-assets.patch` | `font-assets/node.js` | Self-fetch polices |
| `nuxt-site-config+4.0.8-runtime-url.patch` | `init.js` | URL site en localhost |
| `server/api/admin/og-preview.get.ts` | — | Self-fetch preview admin |
| Pages Vue (`*.vue`) | Chemins relatifs | Self-fetch thumbnails |

**État actuel :**

- ✅ Thumbnails visibles sur toutes les pages OG
- ✅ Overlay dégradé + texte sur les pages de détail
- ✅ URL OG correcte (`https://zimablue.cc/_og/d/...`)
- ✅ Admin preview fonctionnelle
- ✅ OG images validées sur Discord, Twitter et Notion
- ⚠️ Polices Caprasimo non chargées à cause d'un fallback ASSETS défaillant
- ⚠️ Layout de la page `/collections` incomplet (overlay non rendu)

---

## Leçons apprises

### 1. Cloudflare Workers + self-fetch = mort

Toute requête HTTP qu'un Worker fait vers son propre domaine timeout avec 522.
La solution est `useNitroApp().localFetch()` qui route la requête à travers
le gestionnaire Nitro sans passer par le réseau.

### 2. `localFetch` ne transmet pas le contexte de plateforme

Quand on utilise `localFetch`, le contexte Cloudflare (`_platform` avec les
bindings R2, DB, KV, etc.) n'est **pas** automatiquement transmis à la requête
enfant. Il faut explicitement le passer via `context._platform`.

### 3. Les patches node_modules sont un mal nécessaire

Quand un module ne prévoit pas de hook pour le comportement qu'on veut modifier,
patcher `node_modules/` est la seule option. Le système de fichiers `.patch`
appliqués via `postinstall` est simple et fiable, mais il faut maintenir ces
patches à jour quand le module évolue.

### 4. `e.$fetch` ≠ `e.fetch` sur Workers

`e.$fetch` passe par ofetch qui résout les URLs relatives en absolues. Sur
Cloudflare Workers, ça cause un self-fetch. `e.fetch` (configuré dans le
`onRequest` handler de Nitro) garde l'URL relative et utilise `localFetch`
directement.

### 5. La complexité vient des couches superposées

Le pipeline OG Image traverse 7 couches : application Vue → composants Takumi →
résolution d'île → plugins de rendu → chargement d'assets → handler Nitro →
bindings Cloudflare. Un problème à n'importe quelle couche peut tout casser,
mais les symptômes sont souvent les mêmes (522, 400, ou une image vide).

### 6. Le cache CDN de Cloudflare est très agressif

Avec `immutable`, le CDN garde les OG images pendant 3 jours sans jamais
revalider. Après chaque déploiement qui change le rendu, il faut purger
le cache CDN ou forcer une regénération avec un cache-buster.

### 7. Toujours vérifier le JSON de package.json

Un doublon accidentel de la clé `"build"` dans `package.json` a fait perdre
plusieurs heures de debugging — le mauvais script était exécuté à cause
d'un comportement non défini des clés dupliquées en JSON.

---

## Est-ce que c'est normal autant de bugs ?

**Non.** Mais c'est la combinaison de plusieurs facteurs :

- `nuxt-og-image` v6.4.3 est un module relativement récent avec quelques bugs
  upstream connus (hash d'île, polices)
- Nuxt 4 a introduit des changements dans le registre des composants d'île
  (nommage PascalCase) et dans le comportement de `localFetch`
- Cloudflare Workers impose une contrainte unique (pas de self-fetch) qui n'est
  pas anticipée par la plupart des modules côté serveur
- Le rendu Takumi via WASM ajoute une couche de complexité supplémentaire
  (CSS limité, pas de support de tous les sélecteurs)
- Le pipeline de build Cloudflare avec caches multiples est difficile à
  invalider complètement

**Si on devait recommencer**, on utiliserait probablement des OG images plus
simples (Satori au lieu de Takumi) et on investiguerait `wrangler dev` pour
tester localement avec les bindings Cloudflare avant de déployer.

---

## Notes techniques complémentaires

### Configuration finale de `package.json`

```json
{
  "scripts": {
    "build": "rm -rf node_modules/.cache .output .nuxt && NODE_OPTIONS='--max-old-space-size=4096' nuxt build",
    "postinstall": "patch -p1 -i patches/nuxt-og-image+6.4.3.patch --forward --no-backup-if-mismatch 2>/dev/null || true; patch -p1 -i patches/nuxt-og-image+6.4.3-takumi-fonts.patch --forward --no-backup-if-mismatch 2>/dev/null || true; ..."
  }
}
```

### Liste complète des patches

1. `patches/nuxt-og-image+6.4.3.patch` — corrige le hash d'île et le self-fetch (`fetchIsland`)
2. `patches/nuxt-og-image+6.4.3-takumi-fonts.patch` — corrige le chargement des polices Takumi (déjà présent dans le package)
3. `patches/nuxt-og-image+6.4.3-local-fetch.patch` — remplace `event.$fetch` par `localFetch` dans `fetchLocalAsset`, avec contexte de plateforme
4. `patches/nuxt-og-image+6.4.3-resolve-fetch.patch` — remplace `event.$fetch` par `localFetch` dans la route `/_og/r/`
5. `patches/nuxt-og-image+6.4.3-image-src.patch` — ajoute un fallback `localFetch` pour les URLs absolues du même domaine
6. `patches/nuxt-og-image+6.4.3-font-assets.patch` — remplace `fetch`/`event.$fetch` par `fetchLocalAsset` pour les polices
7. `patches/nuxt-site-config+4.0.8-runtime-url.patch` — lit `NUXT_PUBLIC_SITE_URL` depuis le runtimeConfig

### Pages modifiées pour les chemins relatifs

- `app/pages/index.vue`
- `app/pages/collections/index.vue`
- `app/pages/collections/[slug].vue`
- `app/pages/settings.vue`
- `app/pages/developers.vue`

Toutes les constructions d'URLs de thumbnails utilisent maintenant des chemins
relatifs (`/images/...`) au lieu d'URLs absolues (`https://zimablue.cc/images/...`).

---

*Article écrit pendant une session de debugging de ~8 heures avec ~20 déploiements.
Publié pour que la prochaine personne qui rencontre ce problème ne passe pas le
même temps à le résoudre.*
