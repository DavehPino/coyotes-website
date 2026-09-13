/** URL de embed de YouTube (dominio sin cookies) o null si el enlace no es de YouTube. */
export function youtubeEmbedUrl(url: string): string | null {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  const host = parsed.hostname.replace(/^(www|m)\./, '')
  let id: string | null = null

  if (host === 'youtu.be') {
    id = parsed.pathname.split('/')[1] ?? null
  } else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    if (parsed.pathname === '/watch') id = parsed.searchParams.get('v')
    else id = /^\/(?:embed|shorts|live)\/([^/?]+)/.exec(parsed.pathname)?.[1] ?? null
  }

  return id && /^[\w-]{6,}$/.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null
}
