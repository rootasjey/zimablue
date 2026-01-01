export function isAdminSession(session: Awaited<ReturnType<typeof requireUserSession>>): boolean {
  const user = session.user as { role?: string } | undefined
  return !!user && user.role === 'admin'
}
