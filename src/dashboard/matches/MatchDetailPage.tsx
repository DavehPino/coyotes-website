import { Link, useParams } from 'react-router'

// Placeholder: PROMPT.md §5.4 define el detalle del partido con sus videos.
export function MatchDetailPage() {
  const { slug } = useParams()
  return (
    <section className="flex flex-col gap-2">
      <Link to="/partidos" className="text-sm text-coyote-orange hover:underline">
        ← Partidos
      </Link>
      <h1 className="text-5xl text-coyote-gold">Partido</h1>
      <p className="text-coyote-ash">{slug}: detalle y videos pendientes de implementar.</p>
    </section>
  )
}
