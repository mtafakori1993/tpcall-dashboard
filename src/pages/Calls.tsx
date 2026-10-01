import { useCallback, useEffect, useState } from 'react'
import { Flex, Button, ProgressCircle, TableView, TableHeader, TableBody, Column, Row, Cell } from '@adobe/react-spectrum'
import { api, type AdminCall } from '../api'
import { t, fmtDate, fmtDuration, faDigits } from '../i18n'

const PAGE = 30

export default function Calls() {
  const [rows, setRows] = useState<AdminCall[]>([])
  const [more, setMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)

  const fetchPage = useCallback((offset: number) => {
    api
      .calls(PAGE, offset)
      .then((p) => {
        setRows((prev) => (offset === 0 ? p.calls : [...prev, ...p.calls]))
        setMore(p.has_more)
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false))
  }, [])
  useEffect(() => fetchPage(0), [fetchPage])
  const load = (offset: number) => {
    setLoading(true)
    setFailed(false)
    fetchPage(offset)
  }

  return (
    <Flex direction="column" gap="size-200" marginTop="size-300">
      <TableView renderEmptyState={() => <span className="tp-muted">{loading ? '' : failed ? t.errors.load : t.calls.empty}</span>} aria-label={t.nav.calls} density="spacious" overflowMode="wrap" height="size-6000">
        <TableHeader>
          <Column key="caller" isRowHeader>{t.calls.caller}</Column>
          <Column key="callee">{t.calls.callee}</Column>
          <Column key="started">{t.calls.started}</Column>
          <Column key="duration" width={110}>{t.calls.duration}</Column>
          <Column key="result">{t.calls.result}</Column>
        </TableHeader>
        <TableBody>
          {rows.map((c) => (
            <Row key={c.call_id}>
              <Cell>{c.caller_name} <span className="tp-muted">({faDigits(c.caller_extension)})</span></Cell>
              <Cell>{c.callee_name} <span className="tp-muted">({faDigits(c.callee_extension)})</span></Cell>
              <Cell>{fmtDate(c.started_at)}</Cell>
              <Cell>{fmtDuration(c.duration_seconds)}</Cell>
              <Cell>{t.reasons[c.end_reason] ?? c.end_reason}</Cell>
            </Row>
          ))}
        </TableBody>
      </TableView>
      <Flex justifyContent="center" gap="size-200" alignItems="center">
        {loading && <ProgressCircle aria-label="loading" isIndeterminate size="S" />}
        {failed && <Button variant="secondary" onPress={() => load(rows.length)}>{t.errors.retry}</Button>}
        {more && !loading && (
          <Button variant="secondary" style="outline" onPress={() => load(rows.length)}>{t.calls.more}</Button>
        )}
      </Flex>
    </Flex>
  )
}
