import { z } from 'zod'

export default eventHandler(async (event) => {
  console.log(`2• 0`);
  const { pathname } = await getValidatedRouterParams(event, z.object({
    pathname: z.string().min(1)
  }).parse)

  console.log(`2 • server/api/images/[pathname] : ${pathname}`);

  const imagePathname = `images/${pathname}`
  return hubBlob().serve(event, imagePathname)
})
