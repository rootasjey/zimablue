export default defineNuxtRouteMiddleware((to, from) => {
  const { loggedIn, user } = useUserSession()

  // Check if user is logged in
  if (!loggedIn.value) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required'
    })
  }

  // Check if user has admin role
  if (user.value?.role !== 'admin') {
    throw createError({
      statusCode: 403,
      statusMessage: 'Admin access required'
    })
  }
})
