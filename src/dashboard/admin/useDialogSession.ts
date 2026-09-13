import { useState } from 'react'

/**
 * Estado de un diálogo de alta que se descarga y monta la primera vez que se abre.
 * Conserva el borrador al cerrarlo; tras guardar, la siguiente apertura empieza de cero
 * (cambia `session`, que se usa como key del formulario).
 */
export function useDialogSession() {
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [session, setSession] = useState(0)
  const [finished, setFinished] = useState(false)

  return {
    mounted,
    open,
    session,
    openDialog() {
      if (finished) {
        setSession((n) => n + 1)
        setFinished(false)
      }
      setMounted(true)
      setOpen(true)
    },
    /** `done`: ya se guardó algo y el formulario debe empezar vacío la próxima vez. */
    close(done: boolean) {
      setOpen(false)
      if (done) setFinished(true)
    },
    /** Empieza otra alta sin cerrar el diálogo. */
    restart() {
      setSession((n) => n + 1)
      setFinished(false)
    },
  }
}
