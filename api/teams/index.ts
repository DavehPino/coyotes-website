// GET /api/teams → TeamSummary[] (rivales por nombre). Sin caché: el formulario de alta
// tiene que ver al instante un equipo recién creado.
import { handle, noStore } from '../_lib/http.js'
import { listRivalTeams } from '../_lib/teams.js'

export const GET = handle(async () => noStore(await listRivalTeams()))
