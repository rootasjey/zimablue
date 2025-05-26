import { Image } from "~/types/image"

export default eventHandler(async () => {
  const dbResponse = await hubDatabase()
    .prepare(`
      SELECT *
      FROM images 
      ORDER BY sum_abs ASC
    `)
    .all()

    console.log(dbResponse)

  return dbResponse.results as unknown as Image[] ?? []
})
