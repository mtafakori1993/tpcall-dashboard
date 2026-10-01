# TPCall Dashboard

Admin dashboard for the [TPCall](https://gitlab.tafakorpardazan.ir/tafakor-pardazan/tpcall-backend) VoIP
backend: overview statistics, user management (create / rename / reset password / delete) and the
call log. Persian (RTL) UI.

- **Live:** https://tpcalldashboard.tafakorpardazan.ir
- **Stack:** React 19 + TypeScript + Vite, [React Spectrum](https://spectrum.adobe.com/) (Adobe Spectrum),
  Vazir font (self-hosted, SIL OFL), nginx (unprivileged) in Kubernetes.
- **Theme:** Tafakor Pardazan palette (`src/theme.css`) mapped onto Spectrum's color variables.

## Access

Log in with the extension and password of a TPCall user whose extension is listed in the backend's
`ADMIN_EXTENSIONS` (ConfigMap `tpcall-config`, namespace `tpcall`). Everyone else gets "no access".
The dashboard calls `/api/v1/admin/*` on the backend; the JWT is kept in `sessionStorage` only.

## Local development

```bash
npm ci
node scripts/mock-api.mjs                                   # mock backend on :9091, login 101 / admin123
VITE_API_BASE=http://localhost:9091 npm run dev             # http://localhost:5173
# or against the real API (the backend only allows the dashboard origin via CORS):
VITE_API_BASE=https://tpcallapi.tafakorpardazan.ir npm run dev
npm run lint && npm run build
```

`VITE_API_BASE` is baked into the bundle at build time (Dockerfile build arg; default = production API).

## Deployment

GitLab CI (`.gitlab-ci.yml`) on every push to `main`: **test** (`npm run lint`, `npm run build`) →
**build** (BuildKit image → GitLab registry, tag = commit SHA) → **deploy** (kustomize → `kubectl apply`
in namespace `tpcall`, automatic rollback if the rollout fails). The same runners and the
`ci/ci-deploy` ServiceAccount as `tpcall-backend` are used; test/build jobs go through the outbound proxy.

Kubernetes objects (`deploy/base`): Deployment `dashboard` (nginx-unprivileged, read-only root fs),
Service, NetworkPolicy (Traefik only), Ingress `tpcalldashboard.tafakorpardazan.ir` with TLS from the
Traefik `le` resolver. The image pull secret `gitlab-registry` in `tpcall` must be able to read this
project's registry (a **group-level** deploy token with `read_registry` covers all projects).

DNS: `tpcalldashboard.tafakorpardazan.ir` → `193.151.152.230`.

## Security notes

- nginx sends a strict CSP (own origin + the API only), HSTS, `X-Frame-Options: DENY`, no-referrer.
- Authorization is enforced by the backend (`403` for non-admins); the UI check is only for convenience.
- Deleting a user also removes their call history and closes their live session (backend behavior).
