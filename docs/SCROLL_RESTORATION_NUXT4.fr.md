# Restauration de scroll dans une SPA Nuxt 4

## Le problème

Sur Zima Blue (galerie d'illustrations), l'accueil est une page à scroll vertical avec une grille d'images. En cliquant sur une image, l'utilisateur navigue vers `/illustrations/[slug]`. Au retour sur l'accueil, on veut retrouver exactement la même position de scroll — idéalement sans voir le défilement.

Le comportement natif du navigateur restaure la position, mais elle est visible : la page se rend en haut, puis saute à la position sauvegardée. Ce micro-décalage est gênant.

## Tentative 1 : `keepalive: true`

Nuxt 3+ propose `definePageMeta({ keepalive: true })` qui encapsule la page dans un `<KeepAlive>` Vue. Le DOM reste en mémoire, le scroll est préservé intact.

```typescript
definePageMeta({ keepalive: true })
```

**Résultat : rien.** La page est toujours détruite/reconstruite. Pourquoi ?

Dans Nuxt 4, `<NuxtPage>` est enfant de `<NuxtLayout>`. Le `keepalive` de `definePageMeta` est lu par `NuxtPage`, mais l'encapsulation dans `<KeepAlive>` ne traverse pas le `<slot />` du layout. Le composant page est bien dans `NuxtPage`, mais le layout récupère la page via son slot et la rend dans son propre template. Le KeepAlive est appliqué au mauvais endroit dans la chaîne de rendu.

C'est un bug connu, discuté [dans les issues Nuxt](https://github.com/nuxt/nuxt/issues/21831), mais pas résolu pour la configuration `NuxtLayout` + `NuxtPage`.

## Tentative 2 : `history.scrollRestoration = 'manual'`

Idée : désactiver la restauration native du navigateur et tout gérer manuellement.

```typescript
// app.vue
history.scrollRestoration = 'manual'
```

```typescript
// index.vue
onBeforeRouteLeave(() => {
  sessionStorage.setItem('scroll:/', String(window.scrollY))
})
```

Avec un `scrollBehavior` personnalisé dans `app/router.options.ts` :

```typescript
scrollBehavior(to, from, savedPosition) {
  if (to.path === '/') {
    const saved = sessionStorage.getItem('scroll:/')
    if (saved) return { top: Number(saved) }
  }
  if (savedPosition) return savedPosition
  return { top: 0 }
}
```

**Résultat :** la position est correcte, mais le scroll est toujours visible. Le problème est que le `scrollBehavior` de Vue Router s'exécute dans le hook `afterEach`, après que le composant est monté. À ce stade, le navigateur a déjà peint la page en haut. Le scrollTo arrive trop tard.

## Tentative 3 : `<script>` + `<script setup>` — piège !

Pour qu'une variable persiste entre les montages/démontages du composant, il faut la déclarer dans un bloc `<script>` (module-level), pas dans `<script setup>`.

```vue
<script lang="ts">
let savedScrollY = 0
</script>

<script lang="ts" setup>
// savedScrollY est maintenant persistante
</script>
```

**Piège :** `<script>` et `<script setup>` doivent avoir le même `lang`. Si `<script setup lang="ts">`, alors `<script>` doit aussi avoir `lang="ts"`. Sinon, Vite/Vue jette une erreur :

```
<script> and <script setup> must have the same language type.
```

## La solution acceptée

Après toutes ces tentatives, le comportement natif du navigateur (`history.scrollRestoration = 'auto'`) est celui qui fonctionne le mieux. La position est correcte, le scroll est visible mais rapide. C'est un compromis acceptable pour une SPA.

Ce qui a été retenu :
- Pas de `keepalive` (incompatible Nuxt 4 + layout)
- Pas de `scrollRestoration = 'manual'` (trop de complexité pour un gain marginal)
- Restauration native du navigateur (comportement par défaut)

La leçon : la restauration de scroll invisible dans une SPA avec `NuxtLayout` est un problème non trivial. `keepalive` serait la solution idéale mais bute sur l'infrastructure du framework.
