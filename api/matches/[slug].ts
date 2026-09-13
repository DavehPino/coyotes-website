// GET /api/matches/:slug → MatchDetail (404 si no existe)
import { matchSlugSchema } from '../../shared/schemas.js'
import { badRequest, cached, handle, notFound, pathParam } from '../_lib/http.js'
import { getMatchBySlug } from '../_lib/matches.js'

export const GET = handle(async (request) => {
  const slug = matchSlugSchema.safeParse(pathParam(request))
  if (!slug.success) throw badRequest('Slug inválido')

  const match = await getMatchBySlug(slug.data)
  if (!match) throw notFound('Partido no encontrado')
  return cached(match)
})
