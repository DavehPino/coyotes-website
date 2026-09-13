// Subida multiparte directa al bucket: la API firma una URL por trozo y el navegador los envía
// en paralelo con XMLHttpRequest (fetch no informa del progreso de subida).
import type { UploadStart, Video } from '@shared/schemas'
import { adminPost, isAbort } from './adminApi'

const CONCURRENCY = 3
const MAX_ATTEMPTS = 4

class PartError extends Error {
  constructor(
    message: string,
    readonly retryable: boolean,
  ) {
    super(message)
  }
}

type UploadVideoOptions = {
  matchId: string
  file: File
  title: string
  setNumber: number | null
  sortOrder: number
  safeword: string
  signal: AbortSignal
  /** Bytes enviados hasta ahora. */
  onProgress: (loaded: number) => void
}

export async function uploadVideo(options: UploadVideoOptions): Promise<Video> {
  const { matchId, file, safeword, signal, onProgress } = options
  const start = await adminPost<UploadStart>(
    '/uploads/start',
    { match_id: matchId, file_name: file.name, content_type: file.type || null, size_bytes: file.size },
    safeword,
    signal,
  )

  // Si falla un trozo se detienen los demás.
  const inner = new AbortController()
  const stop = () => inner.abort()
  signal.addEventListener('abort', stop, { once: true })

  const loadedByPart = new Map<number, number>()
  const report = () => {
    let total = 0
    for (const loaded of loadedByPart.values()) total += loaded
    onProgress(Math.min(total, file.size))
  }

  try {
    const parts = await runPool(start.parts, CONCURRENCY, async (part) => {
      const from = (part.part_number - 1) * start.part_size
      const blob = file.slice(from, Math.min(from + start.part_size, file.size))
      const etag = await withRetries(inner.signal, () =>
        putPart(part.url, blob, inner.signal, (loaded) => {
          loadedByPart.set(part.part_number, loaded)
          report()
        }),
      )
      return { part_number: part.part_number, etag }
    })

    return await adminPost<Video>(
      '/uploads/complete',
      {
        match_id: matchId,
        key: start.key,
        upload_id: start.upload_id,
        parts,
        title: options.title,
        set_number: options.setNumber,
        sort_order: options.sortOrder,
      },
      safeword,
      signal,
    )
  } catch (err) {
    inner.abort()
    // Limpieza en segundo plano de los trozos ya subidos; no bloquea el mensaje de error.
    void adminPost('/uploads/abort', { match_id: matchId, key: start.key, upload_id: start.upload_id }, safeword).catch(
      () => undefined,
    )
    throw err
  } finally {
    signal.removeEventListener('abort', stop)
  }
}

function putPart(url: string, blob: Blob, signal: AbortSignal, onProgress: (loaded: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new DOMException('Subida cancelada', 'AbortError'))
    const xhr = new XMLHttpRequest()
    const abort = () => xhr.abort()
    signal.addEventListener('abort', abort, { once: true })

    xhr.open('PUT', url)
    xhr.upload.onprogress = (event) => onProgress(event.loaded)
    xhr.onload = () => {
      signal.removeEventListener('abort', abort)
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader('ETag')
        if (!etag) {
          return reject(
            new PartError('El bucket no expone la cabecera ETag. Revisa la regla CORS del bucket (ExposeHeaders: ETag).', false),
          )
        }
        onProgress(blob.size)
        return resolve(etag)
      }
      if (xhr.status === 403) {
        return reject(new PartError('El bucket rechazó la subida (403). El enlace pudo caducar: vuelve a intentarlo.', false))
      }
      reject(new PartError(`El bucket respondió con un error (${xhr.status}).`, xhr.status >= 500 || xhr.status === 429))
    }
    xhr.onerror = () => {
      signal.removeEventListener('abort', abort)
      reject(
        new PartError('No se pudo enviar el video al bucket. Revisa la conexión o la regla CORS del bucket.', true),
      )
    }
    xhr.onabort = () => reject(new DOMException('Subida cancelada', 'AbortError'))
    xhr.send(blob)
  })
}

async function withRetries<T>(signal: AbortSignal, attempt: () => Promise<T>): Promise<T> {
  for (let n = 1; ; n += 1) {
    try {
      return await attempt()
    } catch (err) {
      const retryable = err instanceof PartError && err.retryable
      if (isAbort(err) || !retryable || n >= MAX_ATTEMPTS || signal.aborted) throw err
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (n - 1)))
    }
  }
}

/** Ejecuta `worker` sobre `items` con como mucho `limit` tareas a la vez, conservando el orden. */
async function runPool<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let next = 0
  const lane = async () => {
    while (next < items.length) {
      const index = next++
      results[index] = await worker(items[index]!)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, lane))
  return results
}
