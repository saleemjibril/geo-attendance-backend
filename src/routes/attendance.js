import { Router } from 'express'
import { todayDateString } from '../lib/dates.js'
import {
  isGeofenceEnforced,
  isWithinVenue,
  readVenueFromEnv,
} from '../lib/geo.js'
import {
  assertDeviceForCheckIn,
  userDeviceSummary,
} from '../services/deviceBinding.js'
import {
  createUser,
  getAttendanceForDate,
  getUserByExternalId,
  recordAttendance,
} from '../services/users.js'

const router = Router()

function parseCoords(body) {
  const latitude = Number(body.latitude)
  const longitude = Number(body.longitude)
  const accuracyMeters =
    body.accuracyMeters === undefined || body.accuracyMeters === null
      ? null
      : Number(body.accuracyMeters)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return { error: 'latitude and longitude are required' }
  }
  if (
    accuracyMeters !== null &&
    (!Number.isFinite(accuracyMeters) || accuracyMeters < 0)
  ) {
    return { error: 'accuracyMeters must be a non-negative number' }
  }

  return { latitude, longitude, accuracyMeters }
}

function assertWithinVenue(coords) {
  const venue = readVenueFromEnv()
  if (!venue) {
    return {
      error:
        'Server location is not configured. Set ATTENDANCE_LAT and ATTENDANCE_LNG.',
      status: 503,
    }
  }

  if (
    coords.accuracyMeters !== null &&
    coords.accuracyMeters > venue.maxAccuracyMeters
  ) {
    return {
      error: `GPS accuracy is too low (${Math.round(coords.accuracyMeters)} m). Move outdoors or closer to a window and try again.`,
      status: 400,
      code: 'GPS_ACCURACY_TOO_LOW',
    }
  }

  const proximity = isWithinVenue(coords.latitude, coords.longitude, venue)
  if (!isGeofenceEnforced()) {
    return { venue, proximity, geofenceBypassed: true }
  }

  if (!proximity.allowed) {
    return {
      error: `You are about ${proximity.distanceMeters} m from ${venue.venueName}. You must be within ${proximity.radiusMeters} m to mark attendance.`,
      status: 403,
      code: 'OUTSIDE_GEOFENCE',
      ...proximity,
      venueName: venue.venueName,
    }
  }

  return { venue, proximity }
}

function formatUser(user) {
  return {
    externalId: user.externalId,
    name: user.name,
    phone: user.phone,
    registeredAt: user.createdAt,
  }
}

router.get('/config', (req, res) => {
  const venue = readVenueFromEnv()
  if (!venue) {
    return res.status(503).json({
      configured: false,
      message: 'Attendance location is not configured on the server.',
    })
  }

  res.json({
    configured: true,
    venueName: venue.venueName,
    radiusMeters: venue.radiusMeters,
    maxAccuracyMeters: venue.maxAccuracyMeters,
    geofenceEnforced: isGeofenceEnforced(),
  })
})

router.get('/users/:externalId', async (req, res, next) => {
  try {
    const externalId = req.params.externalId?.trim()
    if (!externalId) {
      return res.status(400).json({ error: 'ID is required' })
    }

    const user = await getUserByExternalId(externalId)
    if (!user) {
      return res.json({ exists: false })
    }

  res.json({
    exists: true,
    user: {
      ...formatUser(user),
      ...userDeviceSummary(user),
    },
  })
  } catch (err) {
    next(err)
  }
})

router.post('/users', async (req, res, next) => {
  try {
    const externalId = String(req.body.externalId ?? '').trim()
    const name = String(req.body.name ?? '').trim()
    const phone = String(req.body.phone ?? '').trim()

    if (!externalId || !name || !phone) {
      return res.status(400).json({
        error: 'externalId, name, and phone are required',
      })
    }

    if (await getUserByExternalId(externalId)) {
      return res.status(409).json({ error: 'A user with this ID already exists' })
    }

    const user = await createUser({ externalId, name, phone })
    res.status(201).json({ user: formatUser(user) })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'A user with this ID already exists' })
    }
    next(err)
  }
})

router.post('/check-in', async (req, res, next) => {
  try {
    const coords = parseCoords(req.body)
    if (coords.error) {
      return res.status(400).json({ error: coords.error })
    }

    const locationCheck = assertWithinVenue(coords)
    if (locationCheck.error) {
      return res.status(locationCheck.status).json({
        error: locationCheck.error,
        code: locationCheck.code,
        distanceMeters: locationCheck.distanceMeters,
        radiusMeters: locationCheck.radiusMeters,
        venueName: locationCheck.venueName,
      })
    }

    const externalId = String(req.body.externalId ?? '').trim()
    const name = String(req.body.name ?? '').trim()
    const phone = String(req.body.phone ?? '').trim()
    const deviceToken = String(req.body.deviceToken ?? '').trim()

    if (!externalId) {
      return res.status(400).json({ error: 'externalId is required' })
    }

    let user = await getUserByExternalId(externalId)

    if (!user) {
      if (!name || !phone) {
        return res.status(400).json({
          error: 'New users must provide name and phone',
          code: 'REGISTRATION_REQUIRED',
        })
      }
      try {
        user = await createUser({ externalId, name, phone })
      } catch (err) {
        if (err.code === 11000) {
          user = await getUserByExternalId(externalId)
        } else {
          throw err
        }
      }
    }

    const deviceCheck = await assertDeviceForCheckIn(user, deviceToken)
    if (deviceCheck.error) {
      return res.status(deviceCheck.status).json({
        error: deviceCheck.error,
        code: deviceCheck.code,
      })
    }

    const attendanceDate = todayDateString()
    const existing = await getAttendanceForDate(user._id, attendanceDate)
    if (existing) {
      return res.status(409).json({
        error: 'Attendance already marked for today',
        code: 'ALREADY_CHECKED_IN',
        markedAt: existing.markedAt,
      })
    }

    let record
    try {
      record = await recordAttendance({
        userId: user._id,
        attendanceDate,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracyMeters: coords.accuracyMeters,
        distanceFromVenueMeters: locationCheck.proximity.distanceMeters,
      })
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          error: 'Attendance already marked for today',
          code: 'ALREADY_CHECKED_IN',
        })
      }
      throw err
    }

    res.status(201).json({
      message: 'Attendance recorded',
      user: {
        externalId: user.externalId,
        name: user.name,
      },
      attendance: {
        date: attendanceDate,
        markedAt: record.markedAt,
        distanceMeters: locationCheck.proximity.distanceMeters,
        venueName: locationCheck.venue.venueName,
      },
    })
  } catch (err) {
    next(err)
  }
})

export default router
