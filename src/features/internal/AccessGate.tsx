import { useState, type FormEvent } from 'react'
import { LOGO_SRC } from '@/config'
import { useLogin } from './useSession'

export function AccessGate() {
  const [code, setCode] = useState('')
  const login = useLogin()

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (code.trim()) login.mutate({ code: code.trim() })
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-coyote-rust bg-coyote-night p-8"
      >
        <img src={LOGO_SRC} alt="" className="mx-auto w-24 rounded-full" />
        <h1 className="text-center text-4xl text-coyote-gold">Acceso staff</h1>
        <label className="flex flex-col gap-2 text-sm text-coyote-ash">
          Código de acceso
          <input
            type="password"
            autoComplete="current-password"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="rounded-lg border border-coyote-steel bg-coyote-black px-3 py-2 text-coyote-silver"
          />
        </label>
        {login.error && (
          <p role="alert" className="text-sm text-coyote-orange">
            {login.error.message}
          </p>
        )}
        <button
          type="submit"
          disabled={login.isPending}
          className="rounded-lg bg-coyote-gold px-4 py-2 font-semibold text-coyote-black hover:bg-coyote-yellow disabled:opacity-60"
        >
          {login.isPending ? 'Comprobando…' : 'Entrar'}
        </button>
      </form>
    </main>
  )
}
