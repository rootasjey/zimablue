import { hash } from "ohash"

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  if (!isAdminSession(session)) {
    throw createError({ statusCode: 403, message: 'Forbidden' })
  }

  const query = getQuery(event)
  const component = (query.component as string) || 'Default.takumi'
  const propsStr = (query.props as string) || '{}'
  let props: Record<string, unknown> = {}
  try { props = JSON.parse(propsStr) } catch {}

  const hashId = hash([component, props, {}, undefined]).replace(/[-_]/g, "")

  return {
    component,
    props,
    hashId,
    length: hashId.length,
  }
})
