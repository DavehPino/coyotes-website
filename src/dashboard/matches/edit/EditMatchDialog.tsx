import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useId, useState, type FormEvent, type ReactNode } from 'react'
import type { MatchCreated, MatchDetail, Video } from '@shared/schemas'
import { adminPost, errorMessage, isUnauthorized, safewordStore } from '../../admin/adminApi'
import { RivalField } from '../../admin/RivalField'
import { SafewordStep } from '../../admin/SafewordStep'
import { useRivalTeams, type NewTeamDraft } from '../../admin/teams'
import { Button, Chip, FormError, Modal , TabList, TabPanel, Tabs, type TabItem } from '../../ui'
import { patchMatchDetail, refreshMatchData } from '../api'
import { validateVideos, type Errors, type MatchDraft, type VideoDraft } from '../new/draft'
import { MatchFields } from '../new/MatchStep'
import { VideoUploadRows } from '../new/SubmitProgress'
import { useVideoUploads } from '../new/useVideoUploads'
import { VideoDraftList, VideoPicker } from '../new/VideosStep'
import { draftFromMatch, rivalNameOf, toMatchUpdateInput, validateMatchEdit, type MatchEditDraft } from './draft'
import { MatchVideoList } from './MatchVideoList'

export type EditTab = 'details' | 'videos'

const TAB_LABELS: Record<EditTab, string> = { details: 'Datos del partido', videos: 'Videos' }

const SAFEWORD_REJECTED = 'La palabra clave ya no es válida. Escríbela de nuevo para continuar.'

type EditMatchDialogProps = {
  open: boolean
  match: MatchDetail
  initialTab: EditTab
  onClose: () => void
}

/**
 * Edición de un partido ya cargado: sus datos (rival, fecha, parciales...) y sus videos (subir, renombrar, eliminar).
 * El slug no cambia, así que la URL y la carpeta del bucket siguen siendo las mismas.
 */
export default function EditMatchDialog({ open, match, initialTab, onClose }: EditMatchDialogProps) {
  const formId = useId()
  const queryClient = useQueryClient()
  const rivals = useRivalTeams()

  const [safeword, setSafeword] = useState<string | null>(() => safewordStore.get())
  const [askSafeword, setAskSafeword] = useState(() => safeword === null)
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [tab, setTab] = useState<EditTab>(initialTab)

  // Datos del partido
  const [draft, setDraft] = useState<MatchEditDraft>(() => draftFromMatch(match))
  const [savedInput] = useState(() => JSON.stringify(toMatchUpdateInput(match.id, draftFromMatch(match))))
  const [errors, setErrors] = useState<Errors>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Videos
  const [pending, setPending] = useState<VideoDraft[]>([])
  const [batch, setBatch] = useState<VideoDraft[]>([])
  const [videoErrors, setVideoErrors] = useState<Errors>({})
  const [rowsBusy, setRowsBusy] = useState(0)
  const [uploadedCount, setUploadedCount] = useState(0)

  const requireSafeword = useCallback((message: string) => {
    safewordStore.clear()
    setSafeword(null)
    setNotice(message)
    setAskSafeword(true)
  }, [])

  const refresh = useCallback(
    () => refreshMatchData(queryClient, match.slug).catch(() => undefined),
    [queryClient, match.slug],
  )

  const onUnauthorized = useCallback(() => requireSafeword(SAFEWORD_REJECTED), [requireSafeword])
  const onUploaded = useCallback(() => void refresh(), [refresh])
  const { uploads, uploading, uploadAll, cancel } = useVideoUploads({ onUnauthorized, onUploaded })

  /** Escritura desde las filas de videos: si la palabra clave falla, se vuelve a pedir. */
  async function post<T>(path: string, body: unknown): Promise<T> {
    if (!safeword) {
      requireSafeword('Escribe la palabra clave para continuar.')
      throw new Error('Falta la palabra clave')
    }
    try {
      return await adminPost<T>(path, body, safeword)
    } catch (err) {
      if (isUnauthorized(err)) requireSafeword(SAFEWORD_REJECTED)
      throw err
    }
  }

  const dirty = JSON.stringify(toMatchUpdateInput(match.id, draft)) !== savedInput
  const busy = saving || verifying || uploading || rowsBusy > 0
  const handleClose = () => !busy && onClose()

  const patchMatch = (patch: Partial<MatchDraft>) => setDraft((prev) => ({ ...prev, match: { ...prev.match, ...patch } }))
  const patchNewTeam = (patch: Partial<NewTeamDraft>) =>
    setDraft((prev) => ({ ...prev, newTeam: { ...prev.newTeam, ...patch } }))

  async function handleSaveDetails(event: FormEvent) {
    event.preventDefault()
    const found = validateMatchEdit(draft, rivals.data ?? [])
    setErrors(found)
    setSaveError(null)
    if (Object.keys(found).length > 0) return
    if (!safeword) return requireSafeword('Escribe la palabra clave para guardar.')

    setSaving(true)
    try {
      await adminPost<MatchCreated>('/match-update', toMatchUpdateInput(match.id, draft), safeword)
      await refresh()
      onClose()
    } catch (err) {
      if (isUnauthorized(err)) requireSafeword(SAFEWORD_REJECTED)
      else setSaveError(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(event: FormEvent) {
    event.preventDefault()
    const found = validateVideos(pending)
    setVideoErrors(found)
    if (Object.keys(found).length > 0 || pending.length === 0) return
    if (!safeword) return requireSafeword('Escribe la palabra clave para subir los videos.')

    // Los nuevos van detrás de los que ya tiene el partido.
    const firstOrder = match.videos.reduce((max, video) => Math.max(max, video.sort_order + 1), 0)
    const items = pending.map((video, index) => ({ video, sortOrder: firstOrder + index }))
    setBatch(pending)
    setUploadedCount(0)
    const done = await uploadAll(match.id, items, safeword)
    setUploadedCount(done.length)
    setPending((prev) => prev.filter((video) => !done.includes(video.key)))
    setBatch([])
  }

  // Aviso por video de un intento de subida que no terminó.
  const uploadNotes = Object.fromEntries(
    pending.flatMap((video) => {
      const upload = uploads[video.key]
      if (upload?.status === 'error') return [[video.key, upload.error ?? 'Error en la subida']]
      if (upload?.status === 'cancelled') return [[video.key, 'Subida cancelada']]
      return []
    }),
  )

  let footer: ReactNode
  if (askSafeword) {
    footer = (
      <>
        <Button variant="ghost" onClick={handleClose} disabled={verifying}>
          Cancelar
        </Button>
        <Button type="submit" form={formId} variant="primary" disabled={verifying}>
          {verifying ? 'Comprobando…' : 'Continuar'}
        </Button>
      </>
    )
  } else if (tab === 'details') {
    footer = (
      <>
        <Button variant="ghost" onClick={handleClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" form={formId} variant="primary" disabled={saving || rivals.isPending || !dirty}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </Button>
      </>
    )
  } else if (uploading) {
    footer = <Button onClick={cancel}>Cancelar subidas</Button>
  } else if (pending.length > 0) {
    footer = (
      <>
        <Button variant="ghost" onClick={handleClose} disabled={busy}>
          Cerrar
        </Button>
        <Button type="submit" form={formId} variant="primary" disabled={busy}>
          {pending.length === 1 ? 'Subir 1 video' : `Subir ${pending.length} videos`}
        </Button>
      </>
    )
  } else {
    footer = (
      <Button variant="primary" onClick={handleClose} disabled={busy}>
        Listo
      </Button>
    )
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={askSafeword ? 'Editar partido' : TAB_LABELS[tab]}
      eyebrow={askSafeword ? <Chip tone="ash">Acceso restringido</Chip> : <Chip tone="gold">Editar partido</Chip>}
      footer={footer}
      dismissible={!busy}
      scrollResetKey={askSafeword ? 'safeword' : tab}
    >
      {askSafeword ? (
        <SafewordStep
          formId={formId}
          notice={notice}
          onBusyChange={setVerifying}
          onVerified={(value) => {
            safewordStore.set(value)
            setSafeword(value)
            setNotice(null)
            setAskSafeword(false)
          }}
        />
      ) : (
        <Tabs value={tab} onChange={setTab}>
          <div className="flex flex-col gap-4">
            <TabSwitch value={tab} disabled={busy} />
            <TabPanel value={tab} className="flex flex-col gap-4">
              {tab === 'details' ? (
                <form id={formId} onSubmit={handleSaveDetails} noValidate className="flex flex-col gap-4">
                  <RivalField
                    autoFocus
                    value={draft.teamChoice}
                    onChange={(teamChoice) => setDraft((prev) => ({ ...prev, teamChoice }))}
                    newTeam={draft.newTeam}
                    onNewTeamChange={patchNewTeam}
                    errors={errors}
                  />
                  <MatchFields
                    match={draft.match}
                    rivalName={rivalNameOf(draft, rivals.data ?? [])}
                    errors={errors}
                    onChange={patchMatch}
                  />
                  <p className="text-xs text-coyote-ash">
                    La dirección del partido y la carpeta de sus videos no cambian aunque cambies la fecha o el rival.
                  </p>
                  {saveError && <FormError>{saveError}</FormError>}
                </form>
              ) : (
                <>
                  <section aria-labelledby={`${formId}-saved`} className="flex flex-col gap-2">
                    <h3 id={`${formId}-saved`} className="text-2xl leading-none text-coyote-silver">
                      Subidos
                    </h3>
                    <MatchVideoList
                      videos={match.videos}
                      post={post}
                      disabled={uploading}
                      onBusyChange={(rowBusy) => setRowsBusy((count) => count + (rowBusy ? 1 : -1))}
                      onUpdated={(video: Video) => {
                        patchMatchDetail(queryClient, match.slug, (current) => ({
                          ...current,
                          videos: current.videos.map((item) => (item.id === video.id ? video : item)),
                        }))
                        void refresh()
                      }}
                      onDeleted={(videoId) => {
                        patchMatchDetail(queryClient, match.slug, (current) => ({
                          ...current,
                          videos: current.videos.filter((item) => item.id !== videoId),
                          video_count: Math.max(0, current.video_count - 1),
                        }))
                        void refresh()
                      }}
                    />
                  </section>

                  <form
                    id={formId}
                    onSubmit={handleUpload}
                    noValidate
                    aria-labelledby={`${formId}-new`}
                    className="flex flex-col gap-3"
                  >
                    <h3 id={`${formId}-new`} className="pt-1 text-2xl leading-none text-coyote-silver">
                      Añadir videos
                    </h3>
                    {uploading ? (
                      <ol className="flex flex-col gap-2" aria-live="polite">
                        <VideoUploadRows videos={batch} uploads={uploads} canRetry={false} onRetryVideo={() => undefined} />
                      </ol>
                    ) : (
                      <>
                        {uploadedCount > 0 && pending.length === 0 && (
                          <p role="status" className="text-sm text-coyote-gold">
                            {uploadedCount === 1 ? 'Video subido.' : `${uploadedCount} videos subidos.`}
                          </p>
                        )}
                        <VideoPicker onAdd={(added) => setPending((prev) => [...prev, ...added])} />
                        <VideoDraftList videos={pending} errors={videoErrors} notes={uploadNotes} onChange={setPending} />
                        {pending.length > 0 && (
                          <p className="text-xs text-coyote-ash">
                            Se suben directamente al almacenamiento del equipo. Mantén esta ventana abierta hasta que
                            terminen.
                          </p>
                        )}
                      </>
                    )}
                  </form>
                </>
              )}
            </TabPanel>
          </div>
        </Tabs>
      )}
    </Modal>
  )
}

function TabSwitch({ value, disabled }: { value: EditTab; disabled: boolean }) {
  const items: TabItem<EditTab>[] = (Object.keys(TAB_LABELS) as EditTab[]).map((tab) => ({
    value: tab,
    children: TAB_LABELS[tab],
    // Mientras se guarda o se sube no se cambia de pestaña; la activa sigue enfocable.
    disabled: disabled && tab !== value,
  }))
  return (
    // Radio exterior 12 px = interior 8 px + 4 px de padding
    <TabList label="Qué editar" items={items} className="grid grid-cols-2 gap-1 rounded-xl bg-coyote-black p-1 shadow-border" />
  )
}
