import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Flex, Button, SearchField, ProgressCircle, StatusLight, ActionMenu, Item, Text,
  TableView, TableHeader, TableBody, Column, Row, Cell,
  DialogContainer, Dialog, Heading, Content, ButtonGroup, Divider, TextField,
} from '@adobe/react-spectrum'
import { ToastQueue } from '@react-spectrum/toast'
import { api, type AdminUser } from '../api'
import { errorMessage } from '../errors'
import { t, fmtDate, faDigits } from '../i18n'

type DialogState =
  | { kind: 'create' }
  | { kind: 'rename' | 'reset' | 'delete'; user: AdminUser }
  | null

export default function Users({ selfExtension }: { selfExtension: string }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)

  const load = useCallback(() => {
    api
      .users()
      .then((u) => {
        setUsers(u)
        setFailed(false)
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [])
  useEffect(load, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? users.filter((u) => u.name.toLowerCase().includes(q) || u.extension.includes(q)) : users
  }, [users, query])

  const done = (message: string) => {
    ToastQueue.positive(message, { timeout: 3000 })
    setDialog(null)
    load()
  }

  return (
    <Flex direction="column" gap="size-200" marginTop="size-300">
      <Flex gap="size-200" wrap alignItems="end" justifyContent="space-between">
        <SearchField label={t.users.search} labelPosition="side" isQuiet={false} value={query} onChange={setQuery} width="size-4600" maxWidth="100%" />
        <Button variant="accent" onPress={() => setDialog({ kind: 'create' })}>{t.users.add}</Button>
      </Flex>

      {loading ? (
        <Flex justifyContent="center" marginTop="size-400"><ProgressCircle aria-label="loading" isIndeterminate /></Flex>
      ) : failed ? (
        <Flex direction="column" alignItems="center" gap="size-200" marginTop="size-400">
          <span>{t.errors.load}</span>
          <Button variant="accent" onPress={() => { setLoading(true); load() }}>{t.errors.retry}</Button>
        </Flex>
      ) : (
        <TableView renderEmptyState={() => <span className="tp-muted">{t.users.empty}</span>} aria-label={t.nav.users} density="spacious" overflowMode="wrap" height="size-6000">
          <TableHeader>
            <Column key="name" isRowHeader>{t.users.name}</Column>
            <Column key="ext" width={100}>{t.users.extension}</Column>
            <Column key="status" width={130}>{t.users.status}</Column>
            <Column key="login">{t.users.lastLogin}</Column>
            <Column key="created">{t.users.created}</Column>
            <Column key="actions" width={90} align="center">{t.users.actions}</Column>
          </TableHeader>
          <TableBody>
            {filtered.map((u) => (
              <Row key={u.id}>
                <Cell>
                  {u.name} {u.is_admin && <span className="tp-muted">({t.users.admin})</span>}
                </Cell>
                <Cell>{faDigits(u.extension)}</Cell>
                <Cell>
                  <StatusLight variant={u.online ? 'positive' : 'neutral'}>{u.online ? t.users.online : t.users.offline}</StatusLight>
                </Cell>
                <Cell>{u.last_login_at ? fmtDate(u.last_login_at) : t.users.never}</Cell>
                <Cell>{fmtDate(u.created_at)}</Cell>
                <Cell>
                  <ActionMenu
                    aria-label={`${t.users.actions}: ${u.name}`}
                    isQuiet
                    onAction={(k) => setDialog({ kind: k as 'rename' | 'reset' | 'delete', user: u })}
                    disabledKeys={u.extension === selfExtension ? ['delete'] : []}
                  >
                    <Item key="rename">{t.users.edit}</Item>
                    <Item key="reset">{t.users.reset}</Item>
                    <Item key="delete"><Text>{t.users.delete}</Text></Item>
                  </ActionMenu>
                </Cell>
              </Row>
            ))}
          </TableBody>
        </TableView>
      )}

      <DialogContainer onDismiss={() => setDialog(null)}>
        {dialog?.kind === 'create' && <CreateDialog onClose={() => setDialog(null)} onDone={() => done(t.users.created_ok)} />}
        {dialog?.kind === 'rename' && <RenameDialog user={dialog.user} onClose={() => setDialog(null)} onDone={() => done(t.users.renamed_ok)} />}
        {dialog?.kind === 'reset' && <ResetDialog user={dialog.user} onClose={() => setDialog(null)} onDone={() => done(t.users.reset_ok)} />}
        {dialog?.kind === 'delete' && <DeleteDialog user={dialog.user} onClose={() => setDialog(null)} onDone={() => done(t.users.deleted_ok)} />}
      </DialogContainer>
    </Flex>
  )
}

/** Shared shell: runs `action`, shows the error inline, keeps the dialog open on failure. */
function useAction(action: () => Promise<unknown>, onDone: () => void) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const run = async () => {
    setBusy(true)
    setError(null)
    try {
      await action()
      onDone()
    } catch (e) {
      setError(errorMessage(e))
      setBusy(false)
    }
  }
  return { busy, error, run }
}

const ErrorLine = ({ msg }: { msg: string | null }) =>
  msg ? <div role="alert" style={{ color: '#ff8a80', marginTop: 8 }}>{msg}</div> : null

function CreateDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState('')
  const [ext, setExt] = useState('')
  const [pw, setPw] = useState('')
  const valid = name.trim().length >= 2 && /^[1-9][0-9]{2}$/.test(ext) && pw.length >= 6
  const { busy, error, run } = useAction(() => api.createUser(name.trim(), ext, pw), onDone)
  return (
    <Dialog>
      <Heading>{t.users.addTitle}</Heading>
      <Divider />
      <Content>
        <Flex direction="column" gap="size-150">
          <TextField label={t.users.name} value={name} onChange={setName} autoFocus width="100%" />
          <TextField label={t.users.extension} description={t.users.extensionHint} value={ext} onChange={setExt} inputMode="numeric" maxLength={3} width="100%" UNSAFE_className="tp-ltr" />
          <TextField label={t.login.password} description={t.users.passwordHint} type="password" value={pw} onChange={setPw} width="100%" UNSAFE_className="tp-ltr" />
        </Flex>
        <ErrorLine msg={error} />
      </Content>
      <ButtonGroup>
        <Button variant="secondary" onPress={onClose}>{t.users.cancel}</Button>
        <Button variant="accent" isDisabled={!valid || busy} onPress={run}>{t.users.create}</Button>
      </ButtonGroup>
    </Dialog>
  )
}

function RenameDialog({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: () => void }) {
  const [name, setName] = useState(user.name)
  const { busy, error, run } = useAction(() => api.renameUser(user.extension, name.trim()), onDone)
  return (
    <Dialog>
      <Heading>{t.users.editTitle}</Heading>
      <Divider />
      <Content>
        <TextField label={t.users.name} value={name} onChange={setName} autoFocus width="100%" />
        <ErrorLine msg={error} />
      </Content>
      <ButtonGroup>
        <Button variant="secondary" onPress={onClose}>{t.users.cancel}</Button>
        <Button variant="accent" isDisabled={name.trim().length < 2 || busy} onPress={run}>{t.users.save}</Button>
      </ButtonGroup>
    </Dialog>
  )
}

function ResetDialog({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: () => void }) {
  const [pw, setPw] = useState('')
  const { busy, error, run } = useAction(() => api.resetPassword(user.extension, pw), onDone)
  return (
    <Dialog>
      <Heading>{t.users.resetTitle}</Heading>
      <Divider />
      <Content>
        <p style={{ marginTop: 0 }}>{user.name} ({faDigits(user.extension)})</p>
        <TextField label={t.login.password} description={t.users.passwordHint} type="password" value={pw} onChange={setPw} autoFocus width="100%" UNSAFE_className="tp-ltr" />
        <ErrorLine msg={error} />
      </Content>
      <ButtonGroup>
        <Button variant="secondary" onPress={onClose}>{t.users.cancel}</Button>
        <Button variant="accent" isDisabled={pw.length < 6 || busy} onPress={run}>{t.users.save}</Button>
      </ButtonGroup>
    </Dialog>
  )
}

function DeleteDialog({ user, onClose, onDone }: { user: AdminUser; onClose: () => void; onDone: () => void }) {
  const { busy, error, run } = useAction(() => api.deleteUser(user.extension), onDone)
  return (
    <Dialog role="alertdialog">
      <Heading>{t.users.deleteTitle}</Heading>
      <Divider />
      <Content>
        <p style={{ marginTop: 0 }}><b>{user.name}</b> ({faDigits(user.extension)})</p>
        <p>{t.users.deleteWarn}</p>
        <ErrorLine msg={error} />
      </Content>
      <ButtonGroup>
        <Button variant="secondary" onPress={onClose}>{t.users.cancel}</Button>
        <Button variant="negative" isDisabled={busy} onPress={run}>{t.users.confirmDelete}</Button>
      </ButtonGroup>
    </Dialog>
  )
}
