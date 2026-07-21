# Restauration de scroll dans Nuxt 4 : une histoire qui m'a rendu fou

## Le problème

Tu connais Zima Blue, ma galerie d'illustrations ? L'accueil, c'est une longue page avec une grille d'images. Tu scrolles, tu trouves une illustration qui te plaît, tu cliques dessus. Hop, direction `/illustrations/[slug]`. Jusque-là, tout va bien.

Le problème arrive au retour. Tu veux retrouver ta place dans la grille, exactement là où tu étais. Et idéalement, sans voir la page se téléporter du haut vers le bas comme un vieux site des années 2000.

Le navigateur fait déjà ce travail tout seul. Mais le rendu est moche : la page s'affiche en haut, puis *scoot* elle défile vers la position sauvegardée. Ce micro-décalage, ce petit saut, m'a rendu dingue pendant des heures.

## Tentative 1 : `keepalive` (spoiler : ça marche pas)

Nuxt propose `definePageMeta({ keepalive: true })`. En théorie, ça encapsule la page dans un `<KeepAlive>` Vue. Le DOM reste en mémoire, le scroll avec. Magique.

```typescript
definePageMeta({ keepalive: true })
```

Sauf que… ça ne marche pas. La page est détruite et reconstruite à chaque navigation, comme si je n'avais rien écrit.

Pourquoi ? Parce que dans Nuxt 4, `<NuxtPage>` est enfermé dans `<NuxtLayout>`. Le `keepalive` est bien lu par `NuxtPage`, mais l'encapsulation `<KeepAlive>` ne traverse pas le `<slot />` du layout. C'est comme si tu emballais un cadeau, mais que quelqu'un le déballait discrètement avant de le donner.

Il y a [une issue Nuxt](https://github.com/nuxt/nuxt/issues/21831) qui traîne là-dessus. Pas résolue.

## Tentative 2 : tout faire à la main

Puisque le framework ne veut pas coopérer, j'ai décidé de prendre les choses en main.

```typescript
// app.vue
history.scrollRestoration = 'manual'
```

Hop, je désactive la restauration native du navigateur. Je vais gérer ça moi-même.

```typescript
// index.vue
onBeforeRouteLeave(() => {
  sessionStorage.setItem('scroll:/', String(window.scrollY))
})
```

Je sauvegarde la position avant de quitter la page. Je la restaure via `scrollBehavior` dans le routeur :

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

**Résultat :** la position est bonne, mais le scroll est *toujours* visible. Pourquoi ? Parce que `scrollBehavior` s'exécute dans le hook `afterEach` de Vue Router. À ce moment-là, le composant est déjà monté et le navigateur a déjà peint la page en haut. Mon `scrollTo` arrive trop tard, comme une excuse après l'engueulade.

## Tentative 3 : le piège des deux scripts

Pour faire persister une variable entre deux vies d'un composant, il faut la déclarer en dehors de `<script setup>` :

```vue
<script lang="ts">
let savedScrollY = 0
</script>

<script lang="ts" setup>
// savedScrollY survit maintenant aux montages/démontages
</script>
```

Sauf que j'ai oublié le `lang="ts"` sur le premier `<script>`. Et là, c'est le drame :

```
<script> and <script setup> must have the same language type.
```

Vite m'a gentiment rappelé que le typage, c'est pour tout le monde ou pour personne. Une erreur bête qui m'a fait perdre 10 minutes à regarder l'écran en soupirant.

## La conclusion (un peu amère)

Après tout ça, j'ai remis `history.scrollRestoration = 'auto'`. J'ai tout revert. Le comportement natif du navigateur est ce qui fonctionne le mieux.

Est-ce que le scroll est visible ? Oui, un tout petit peu. Est-ce que la position est correcte ? Aussi. Est-ce que c'est parfait ? Non. Est-ce que je passe à autre chose ? Oui.

Parfois, la meilleure solution, c'est d'accepter qu'une perfection à 99% est suffisante. `keepalive` serait la solution idéale, mais l'infrastructure de Nuxt 4 ne le permet pas encore. J'ai appris des trucs en chemin, et c'est bien aussi.
