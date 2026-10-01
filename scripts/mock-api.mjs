// Tiny in-memory mock of the tpcall admin API for local UI development.
//   node scripts/mock-api.mjs            (listens on :9091)
//   VITE_API_BASE=http://localhost:9091 npm run dev      login: 101 / admin123
import http from 'node:http'

const now = Date.now()
const iso = (msAgo) => new Date(now - msAgo).toISOString()
let users = [
  ['محمد تفکری', '101', true, 3e5, 9e9], ['سارا احمدی', '102', true, 6e5, 8e9],
  ['علی رضایی', '103', false, 864e5, 7e9], ['مریم کاظمی', '104', false, 3e8, 6e9],
  ['رضا موسوی', '105', true, 12e5, 5e9],
].map(([name, extension, online, login, created], i) => ({
  id: `u${i}`, name, extension, online, is_admin: extension === '101',
  created_at: iso(created), last_login_at: iso(login),
}))
const reasons = ['completed', 'completed', 'no_answer', 'rejected', 'completed', 'caller_cancelled']
const calls = Array.from({ length: 70 }, (_, i) => {
  const a = users[i % 5], b = users[(i + 2) % 5], r = reasons[i % reasons.length]
  const started = now - i * 3.1e6
  const dur = r === 'completed' ? 20 + ((i * 37) % 400) : null
  return {
    call_id: `c${i}`, caller_name: a.name, caller_extension: a.extension, callee_name: b.name,
    callee_extension: b.extension, started_at: new Date(started).toISOString(),
    answered_at: dur ? new Date(started + 5000).toISOString() : null,
    ended_at: new Date(started + 5000 + (dur ?? 8) * 1000).toISOString(), duration_seconds: dur, end_reason: r,
  }
})

const send = (res, code, body) => {
  res.writeHead(code, {
    'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  })
  res.end(body === undefined ? undefined : JSON.stringify(body))
}
const err = (res, code, c, message) => send(res, code, { error: { code: c, message } })

http.createServer((req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204)
  const url = new URL(req.url, 'http://x')
  let raw = ''
  req.on('data', (d) => (raw += d))
  req.on('end', () => {
    const body = raw ? JSON.parse(raw) : {}
    const p = url.pathname
    if (p === '/api/v1/auth/login') {
      return body.extension === '101' && body.password === 'admin123'
        ? send(res, 200, { access_token: 'mock', token_type: 'Bearer' })
        : err(res, 401, 'invalid_credentials', 'invalid extension or password')
    }
    if (req.headers.authorization !== 'Bearer mock') return err(res, 401, 'unauthorized', 'authentication required')
    if (p === '/api/v1/admin/me') return send(res, 200, { name: 'محمد تفکری', extension: '101', is_admin: true })
    if (p === '/api/v1/admin/stats') {
      const by = {}
      calls.forEach((c) => (by[c.end_reason] = (by[c.end_reason] || 0) + 1))
      const answered = calls.filter((c) => c.answered_at)
      const talk = answered.reduce((s, c) => s + c.duration_seconds, 0)
      return send(res, 200, { users: users.length, online: users.filter((u) => u.online).length, calls_total: calls.length,
        calls_today: 8, calls_answered: answered.length, talk_seconds_total: talk,
        avg_talk_seconds: Math.round(talk / answered.length), calls_by_end_reason: by })
    }
    if (p === '/api/v1/admin/calls') {
      const limit = +url.searchParams.get('limit') || 30, offset = +url.searchParams.get('offset') || 0
      return send(res, 200, { calls: calls.slice(offset, offset + limit), limit, offset, has_more: offset + limit < calls.length })
    }
    if (p === '/api/v1/admin/users' && req.method === 'GET') return send(res, 200, { users })
    if (p === '/api/v1/admin/users' && req.method === 'POST') {
      if (users.some((u) => u.extension === body.extension)) return err(res, 409, 'extension_already_exists', 'exists')
      const u = { id: `u${Date.now()}`, name: body.name, extension: body.extension, online: false, is_admin: false,
        created_at: new Date().toISOString(), last_login_at: null }
      users.push(u)
      users.sort((a, b) => a.extension.localeCompare(b.extension))
      return send(res, 201, u)
    }
    const m = p.match(/^\/api\/v1\/admin\/users\/(\d{3})(\/password)?$/)
    if (m) {
      const u = users.find((x) => x.extension === m[1])
      if (!u) return err(res, 404, 'user_not_found', 'user not found')
      if (m[2]) return send(res, 204)
      if (req.method === 'PATCH') { u.name = body.name; return send(res, 200, u) }
      if (req.method === 'DELETE') { users = users.filter((x) => x !== u); return send(res, 204) }
    }
    err(res, 404, 'not_found', 'not found')
  })
}).listen(9091, () => console.log('mock api on :9091 (login 101 / admin123)'))
