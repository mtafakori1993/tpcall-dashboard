import { useCallback, useEffect, useState } from 'react'
import { Flex, Grid, Heading, Button, ProgressCircle, repeat } from '@adobe/react-spectrum'
import { api, type Stats } from '../api'
import { t, fmtNum, fmtDuration } from '../i18n'

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="tp-card">
      <div className="tp-card-label">{label}</div>
      <div className="tp-card-value">{value}</div>
    </div>
  )
}

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [failed, setFailed] = useState(false)

  const load = useCallback(() => {
    api.stats().then(setStats).catch(() => setFailed(true))
  }, [])
  useEffect(load, [load])
  const reload = () => {
    setFailed(false)
    load()
  }

  if (failed)
    return (
      <Flex direction="column" alignItems="center" gap="size-200" marginTop="size-400">
        <span>{t.errors.load}</span>
        <Button variant="accent" onPress={reload}>{t.errors.retry}</Button>
      </Flex>
    )
  if (!stats)
    return (
      <Flex justifyContent="center" marginTop="size-400">
        <ProgressCircle aria-label="loading" isIndeterminate />
      </Flex>
    )

  const reasons = Object.entries(stats.calls_by_end_reason).sort((a, b) => b[1] - a[1])
  const max = Math.max(1, ...reasons.map(([, n]) => n))

  return (
    <Flex direction="column" gap="size-300" marginTop="size-300">
      <Flex justifyContent="end">
        <Button variant="secondary" style="outline" onPress={reload}>{t.nav.refresh}</Button>
      </Flex>
      <Grid columns={repeat('auto-fit', 'minmax(190px, 1fr)')} gap="size-200">
        <Card label={t.stats.users} value={fmtNum(stats.users)} />
        <Card label={t.stats.online} value={fmtNum(stats.online)} />
        <Card label={t.stats.callsToday} value={fmtNum(stats.calls_today)} />
        <Card label={t.stats.callsTotal} value={fmtNum(stats.calls_total)} />
        <Card label={t.stats.answered} value={fmtNum(stats.calls_answered)} />
        <Card label={t.stats.avgTalk} value={fmtDuration(stats.avg_talk_seconds)} />
        <Card label={t.stats.totalTalk} value={fmtDuration(stats.talk_seconds_total)} />
      </Grid>
      <div className="tp-card">
        <Heading level={3} marginTop={0}>{t.stats.reasons}</Heading>
        {reasons.length === 0 ? (
          <span className="tp-muted">{t.calls.empty}</span>
        ) : (
          <Flex direction="column" gap="size-150">
            {reasons.map(([reason, n]) => (
              <div key={reason}>
                <Flex justifyContent="space-between" marginBottom="size-50">
                  <span>{t.reasons[reason] ?? reason}</span>
                  <span className="tp-muted">{fmtNum(n)}</span>
                </Flex>
                <div className="tp-bar"><span style={{ width: `${(n / max) * 100}%` }} /></div>
              </div>
            ))}
          </Flex>
        )}
      </div>
    </Flex>
  )
}
