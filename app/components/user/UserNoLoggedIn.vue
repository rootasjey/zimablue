<template>
  <section class="text-center py-12">
    <div class="i-ph-user-circle-x text-6xl text-gray-400 dark:text-gray-600 mb-4"></div>
    <h2 class="text-xl font-600 text-gray-800 dark:text-gray-200 mb-2">
      Please Sign In
    </h2>
    <p class="text-gray-600 dark:text-gray-400 mb-6">
      You need to be 
      <NLink to="/login" class="underline underline-dashed decoration-offset-6 hover:underline-rose hover:text-rose-5">signed in</NLink> 
      to view your profile and manage your gallery.
    </p>
    <NLink to="/" class="arrow">
      <span>Go back to gallery</span>
    </NLink>
  </section>
</template>