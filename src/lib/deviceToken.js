import { createHash, timingSafeEqual } from 'node:crypto'

const TOKEN_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isValidDeviceToken(token) {
  return typeof token === 'string' && TOKEN_PATTERN.test(token.trim())
}

export function hashDeviceToken(token) {
  return createHash('sha256').update(token.trim()).digest('hex')
}

export function deviceTokensMatch(storedHash, providedToken) {
  const providedHash = hashDeviceToken(providedToken)
  const left = Buffer.from(storedHash, 'hex')
  const right = Buffer.from(providedHash, 'hex')
  if (left.length !== right.length) return false
  return timingSafeEqual(left, right)
}
