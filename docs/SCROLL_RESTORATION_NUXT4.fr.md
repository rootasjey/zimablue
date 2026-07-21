# Garder le scroll d'une page Nuxt 4 au retour de navigation

## Le contexte

Sur Zima Blue, l'accueil est une longue page avec une grille d'illustrations. L'utilisateur scrolle, clique sur une image, visite la page dédiée, puis revient. À ce moment-là, on aimerait qu'il retrouve exactement sa place — sans voir la page défiler du haut vers le bas.

Le navigateur restaure déjà la position tout seul, mais le rendu n'est pas idéal : la page s'affiche en haut, puis glisse vers la position sauvegardée. Un micro-saut qu'on aurait aimé éviter.

## Pourquoi `keepalive` n'a pas marché

Nuxt propose `definePageMeta({ keepalive: true })` pour garder le DOM d'une page en mémoire via `<KeepAlive>`.

```typescript
definePageMeta({ keepalive: true })
```

Sauf que ça n'a rien changé. Le composant était toujours détruit et recréé.

La raison : dans Nuxt 4, `<NuxtPage>` est enfant de `<NuxtLayout>`. Le `keepalive` est lu par `NuxtPage` mais l'encapsulation `<KeepAlive>` ne traverse pas le `<slot />` du layout. Le composant page se retrouve sans protection.

C'est [une issue connue](https://github.com/nuxt/nuxt/issues/21831), pas encore résolue pour cette configuration.

## Les tentatives manuelles

J'ai essayé de désactiver la restauration native (`history.scrollRestoration = 'manual'`), de sauvegarder la position dans `sessionStorage` via `onBeforeRouteLeave`, et de la restituer via `scrollBehavior` dans le routeur.

La position était correcte, mais le défilement toujours visible. Pourquoi ? Parce que Vue Router exécute `scrollBehavior` dans le hook `afterEach`, une fois le composant déjà monté et affiché en haut. Le scroll arrive trop tard.

J'ai aussi appris (par l'erreur) que quand on utilise deux blocs `<script>` et `<script setup>` dans un `.vue`, ils doivent avoir le même `lang`. Sans `lang="ts"` sur le premier, Vite/Vue refuse tout simplement de compiler.

## Ce qu'on retient

J'ai tout revert et laissé le comportement natif du navigateur. La position est correcte, le défilement est rapide. Pas idéal, mais fonctionnel.

Parfois la meilleure solution, c'est d'accepter un petit défaut plutôt que de passer des heures à le traquer. `keepalive` aurait été parfait, mais l'infrastructure de Nuxt 4 ne le permet pas encore. On y reviendra quand l'issue sera résolue.
