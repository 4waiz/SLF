import { useState } from 'react'
import type { FormEvent } from 'react'

interface LoginScreenProps {
  onLogin: () => void
}

/**
 * Operator sign-in. The BRIDGE mark fades in, then the form. Credentials for the
 * demonstration build are Operator / 123.
 */
export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (username.trim().toLowerCase() === 'operator' && password === '123') {
      setError(null)
      onLogin()
    } else {
      setError('Incorrect operator ID or passcode.')
    }
  }

  return (
    <div className="login">
      <div className="intro-aurora" aria-hidden="true" />

      <main className="login-card">
        <img
          src="/darksvg.png"
          alt="BRIDGE"
          className="brand-img brand-lg intro-rise"
          style={{ animationDelay: '0.05s' }}
        />
        <p className="subtitle intro-rise" style={{ animationDelay: '0.35s' }}>
          SLF · Digital Work Instructions
        </p>

        <form className="login-form intro-rise" style={{ animationDelay: '0.55s' }} onSubmit={handleSubmit}>
          <label className="login-field">
            <span>Operator ID</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoFocus
              placeholder="Operator"
            />
          </label>
          <label className="login-field">
            <span>Passcode</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••"
            />
          </label>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="login-btn">
            Sign In
          </button>
        </form>

        <p className="login-foot intro-rise" style={{ animationDelay: '0.75s' }}>
          Authorised personnel only
        </p>
      </main>
    </div>
  )
}
