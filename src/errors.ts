import { ApiError } from './api'
import { t } from './i18n'

/** Maps an API failure to a Persian, user-facing message. */
export function errorMessage(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 0) return t.errors.network
    if (e.code === 'extension_already_exists') return t.errors.exists
    if (e.code === 'validation_error') return t.errors.validation
  }
  return t.errors.generic
}
