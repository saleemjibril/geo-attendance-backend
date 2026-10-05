import jwt from 'jsonwebtoken'

function getJwtSecret() {
  const secret = process.env.ADMIN_JWT_SECRET
  if (!secret) {
    throw new Error('ADMIN_JWT_SECRET is not configured')
  }
  return secret
}

export function signAdminToken(adminId) {
  return jwt.sign({ role: 'admin', sub: adminId }, getJwtSecret(), {
    expiresIn: '12h',
  })
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const payload = jwt.verify(token, getJwtSecret())
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' })
    }
    req.admin = payload
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
}
