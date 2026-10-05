export function getAllowedOrigins() {
  return (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

export function createCorsOptions() {
  const allowedOrigins = getAllowedOrigins()

  return {
    origin(origin, callback) {
      // Non-browser clients (no Origin header)
      if (!origin) {
        callback(null, true)
        return
      }

      const normalized = origin.replace(/\/$/, '')
      const isAllowed = allowedOrigins.includes(normalized)

      callback(null, isAllowed)
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }
}
