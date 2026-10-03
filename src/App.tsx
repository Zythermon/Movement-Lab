import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { brand } from './brand'
import { StudioLinks } from './components/StudioLinks'
import { Tracker } from './components/Tracker'
import { supabase } from './lib/supabase'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [ready, setReady] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    const user = session?.user
    if (!user) return
    const metadata = user.user_metadata as { full_name?: string; name?: string }
    void supabase.from('profiles').upsert({
      id: user.id,
      email: user.email ?? null,
      full_name: metadata.full_name ?? metadata.name ?? null,
    })
  }, [session])

  const signIn = async () => {
    setAuthError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setAuthError(error.message)
  }

  if (!ready) {
    return (
      <div className="app boot">
        <p>Cargando…</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="app gate">
        <img className="wordmark" src="/logo.png" alt="Movement Lab" />
        <p className="eyebrow">{brand.lines[0]}</p>
        <h1>Registro</h1>
        <p className="lede">Seguimiento de tus entrenamientos.</p>
        <button type="button" className="save" onClick={() => void signIn()}>
          Ingresar con Google
        </button>
        {authError ? <p className="form-error">{authError}</p> : null}
        <StudioLinks />
      </div>
    )
  }

  return <Tracker session={session} />
}

export default App
