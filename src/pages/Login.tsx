import { useState, type FormEvent } from 'react'
import { Flex, View, Heading, TextField, Button, ProgressCircle } from '@adobe/react-spectrum'
import { api, ApiError } from '../api'
import { t } from '../i18n'

export default function Login({ onLoggedIn }: { onLoggedIn: (m: { name: string; extension: string }) => void }) {
  const [extension, setExtension] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      onLoggedIn(await api.login(extension.trim(), password))
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setError(t.login.forbidden)
      else if (err instanceof ApiError && err.status === 401) setError(t.login.badCreds)
      else if (err instanceof ApiError && err.status === 0) setError(t.login.network)
      else setError(t.errors.generic)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Flex height="100vh" alignItems="center" justifyContent="center" UNSAFE_style={{ padding: 16 }}>
      <form onSubmit={submit} className="tp-login" style={{ width: '100%' }}>
        <div className="tp-card" style={{ padding: 28 }}>
          <Flex direction="column" gap="size-200" alignItems="center">
            <img src="/favicon.svg" width={56} height={56} alt="" />
            <Heading level={2} margin={0}>{t.appName}</Heading>
            <span className="tp-muted">{t.login.title}</span>
          </Flex>
          <View marginTop="size-300">
            <Flex direction="column" gap="size-150">
              <TextField
                label={t.login.extension}
                value={extension}
                onChange={setExtension}
                inputMode="numeric"
                autoFocus
                isRequired
                width="100%"
                UNSAFE_className="tp-ltr"
              />
              <TextField
                label={t.login.password}
                type="password"
                value={password}
                onChange={setPassword}
                isRequired
                width="100%"
                UNSAFE_className="tp-ltr"
              />
              {error && (
                <div role="alert" style={{ color: '#ff8a80', fontSize: 14 }}>
                  {error}
                </div>
              )}
              <Button type="submit" variant="accent" isDisabled={busy || !extension || !password} marginTop="size-100">
                {busy ? <ProgressCircle aria-label="…" isIndeterminate size="S" /> : t.login.submit}
              </Button>
            </Flex>
          </View>
        </div>
      </form>
    </Flex>
  )
}
