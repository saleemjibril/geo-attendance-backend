const EARTH_RADIUS_METERS = 6_371_000

function toRadians(degrees) {
  return (degrees * Math.PI) / 180
}

/** Haversine distance between two WGS84 points, in meters. */
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const φ1 = toRadians(lat1)
  const φ2 = toRadians(lat2)
  const Δφ = toRadians(lat2 - lat1)
  const Δλ = toRadians(lon2 - lon1)

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

/** Dev-only: set ATTENDANCE_DISABLE_GEOFENCE=true in .env (ignored in production). */
export function isGeofenceEnforced() {
  const disabled =
    process.env.ATTENDANCE_DISABLE_GEOFENCE === 'true' ||
    process.env.ATTENDANCE_DISABLE_GEOFENCE === '1'
  if (!disabled) return true
  if (process.env.NODE_ENV === 'production') return true
  return false
}

export function readVenueFromEnv() {
  const lat = Number(process.env.ATTENDANCE_LAT)
  const lng = Number(process.env.ATTENDANCE_LNG)
  const radiusMeters = Number(process.env.ATTENDANCE_RADIUS_METERS ?? 100)
  const maxAccuracyMeters = Number(process.env.ATTENDANCE_MAX_GPS_ACCURACY_METERS ?? 80)
  const venueName = process.env.ATTENDANCE_VENUE_NAME ?? 'Main building'

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return {
    lat,
    lng,
    radiusMeters,
    maxAccuracyMeters,
    venueName,
  }
}

export function isWithinVenue(userLat, userLng, venue) {
  const distance = distanceMeters(userLat, userLng, venue.lat, venue.lng)
  return {
    allowed: distance <= venue.radiusMeters,
    distanceMeters: Math.round(distance),
    radiusMeters: venue.radiusMeters,
  }
}
