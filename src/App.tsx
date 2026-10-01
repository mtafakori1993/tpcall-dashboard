import { useCallback, useEffect, useState } from 'react'
import { Provider, defaultTheme, Flex, View, Button, Tabs, TabList, TabPanels, Item, ProgressCircle } from '@adobe/react-spectrum'
import { ToastContainer } from '@react-spectrum/toast'
import { api, getToken, onUnauthorized } from './api'
import { t, faDigits } from './i18n'
import Login from './pages/Login'
import Overview from './pages/Overview'
import Users from './pages/Users'
import Calls from './pages/Calls'

type Me = { name: string; extension: string }

export default function App() {
  const [me, setMe] = useState<Me | null>(null)
  const [booting, setBooting] = useState<boolean>(!!getToken())

  const logout = useCallback(() => {
    api.logout()
    setMe(null)
  }, [])

  useEffect(() => {
    onUnauthorized.handler = logout
  }, [logout])

  useEffect(() => {
    if (!getToken()) return
    api
      .me()
      .then((m) => (m.is_admin ? setMe(m) : api.logout()))
      .catch(() => api.logout())
      .finally(() => setBooting(false))
  }, [])

  return (
    <Provider theme={defaultTheme} colorScheme="dark" locale="fa-IR" UNSAFE_className="tp-root">
      <ToastContainer />
      {booting ? (
        <Flex height="100vh" alignItems="center" justifyContent="center">
          <ProgressCircle aria-label="loading" isIndeterminate size="L" />
        </Flex>
      ) : !me ? (
        <Login onLoggedIn={setMe} />
      ) : (
        <Shell me={me} onLogout={logout} />
      )}
    </Provider>
  )
}

function Shell({ me, onLogout }: { me: Me; onLogout: () => void }) {
  return (
    <Flex direction="column" minHeight="100vh">
      <View UNSAFE_className="tp-topbar" paddingX="size-300" paddingY="size-150">
        <Flex alignItems="center" justifyContent="space-between" gap="size-200" wrap>
          <Flex alignItems="center" gap="size-150">
            <img src="/favicon.svg" width={32} height={32} alt="" />
            <span className="tp-brand">{t.appName}</span>
          </Flex>
          <Flex alignItems="center" gap="size-200">
            <span className="tp-muted">
              {me.name} · {faDigits(me.extension)}
            </span>
            <Button variant="secondary" style="outline" onPress={onLogout}>
              {t.nav.logout}
            </Button>
          </Flex>
        </Flex>
      </View>
      <View padding="size-300" flex>
        <Tabs aria-label={t.appName} maxWidth={1200} marginX="auto">
          <TabList>
            <Item key="overview">{t.nav.overview}</Item>
            <Item key="users">{t.nav.users}</Item>
            <Item key="calls">{t.nav.calls}</Item>
          </TabList>
          <TabPanels>
            <Item key="overview">
              <Overview />
            </Item>
            <Item key="users">
              <Users selfExtension={me.extension} />
            </Item>
            <Item key="calls">
              <Calls />
            </Item>
          </TabPanels>
        </Tabs>
      </View>
    </Flex>
  )
}
