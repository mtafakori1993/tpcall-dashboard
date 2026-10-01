// Thin client for the tpcall backend (/api/v1). The JWT lives in sessionStorage so it
// is dropped when the tab closes.

export const API_BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ??
  'https://tpcallapi.tafakorpardazan.ir'

const TOKEN_KEY = 'tpcall.token'

export const getToken = (): string | null => {
  try {
    return sessionStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}
const setToken = (t: string | null) => {
  try {
    if (t) sessionStorage.setItem(TOKEN_KEY, t)
    else sessionStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage unavailable: stay logged in for this page only */
  }
}

export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

/** Fired when the API answers 401 so the app can return to the login screen. */
export const onUnauthorized: { handler: () => void } = { handler: () => {} }

async function request<T>(method: string, path: string, body?: unknown, auth = true): Promise<T> {
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  let res: Response
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'network', 'network')
  }
  if (res.status === 204) return undefined as T

  let data: unknown = null
  try {
    data = await res.json()
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string } } | null)?.error
    if (res.status === 401 && auth) onUnauthorized.handler()
    throw new ApiError(res.status, err?.code ?? 'error', err?.message ?? res.statusText)
  }
  return data as T
}

export interface AdminUser {
  id: string
  name: string
  extension: string
  online: boolean
  is_admin: boolean
  created_at: string
  last_login_at: string | null
}
export interface Stats {
  users: number
  online: number
  calls_total: number
  calls_today: number
  calls_answered: number
  talk_seconds_total: number
  avg_talk_seconds: number
  calls_by_end_reason: Record<string, number>
}
export interface AdminCall {
  call_id: string
  caller_name: string
  caller_extension: string
  callee_name: string
  callee_extension: string
  started_at: string
  answered_at: string | null
  ended_at: string | null
  duration_seconds: number | null
  end_reason: string
}
export interface CallsPage {
  calls: AdminCall[]
  limit: number
  offset: number
  has_more: boolean
}

export const api = {
  async login(extension: string, password: string) {
    const r = await request<{ access_token: string }>('POST', '/api/v1/auth/login', { extension, password }, false)
    setToken(r.access_token)
    const me = await request<{ name: string; extension: string; is_admin: boolean }>('GET', '/api/v1/admin/me')
    if (!me.is_admin) {
      setToken(null)
      throw new ApiError(403, 'forbidden', 'forbidden')
    }
    return me
  },
  me: () => request<{ name: string; extension: string; is_admin: boolean }>('GET', '/api/v1/admin/me'),
  logout: () => setToken(null),
  stats: () => request<Stats>('GET', '/api/v1/admin/stats'),
  users: () => request<{ users: AdminUser[] }>('GET', '/api/v1/admin/users').then((r) => r.users),
  createUser: (name: string, extension: string, password: string) =>
    request<AdminUser>('POST', '/api/v1/admin/users', { name, extension, password }),
  renameUser: (extension: string, name: string) =>
    request<AdminUser>('PATCH', `/api/v1/admin/users/${extension}`, { name }),
  resetPassword: (extension: string, password: string) =>
    request<void>('POST', `/api/v1/admin/users/${extension}/password`, { password }),
  deleteUser: (extension: string) => request<void>('DELETE', `/api/v1/admin/users/${extension}`),
  calls: (limit: number, offset: number) =>
    request<CallsPage>('GET', `/api/v1/admin/calls?limit=${limit}&offset=${offset}`),
}
