import { Attendance } from '../models/Attendance.js'
import { User } from '../models/User.js'

const externalIdCollation = { locale: 'en', strength: 2 }

export async function getUserByExternalId(externalId) {
  const trimmed = externalId.trim()
  return User.findOne({ externalId: trimmed }).collation(externalIdCollation)
}

export async function createUser({ externalId, name, phone }) {
  const user = await User.create({
    externalId: externalId.trim(),
    name: name.trim(),
    phone: phone.trim(),
  })
  return user
}

export async function getAttendanceForDate(userId, attendanceDate) {
  return Attendance.findOne({ userId, attendanceDate })
}

export async function recordAttendance({
  userId,
  attendanceDate,
  latitude,
  longitude,
  accuracyMeters,
  distanceFromVenueMeters,
}) {
  return Attendance.create({
    userId,
    attendanceDate,
    latitude,
    longitude,
    accuracyMeters: accuracyMeters ?? null,
    distanceFromVenueMeters,
  })
}

export function buildAttendanceDateFilter(from, to) {
  const filter = {}
  if (from || to) {
    filter.attendanceDate = {}
    if (from) filter.attendanceDate.$gte = from
    if (to) filter.attendanceDate.$lte = to
  }
  return filter
}

export async function listUsersWithAttendanceCounts({ from, to } = {}) {
  const dateFilter = buildAttendanceDateFilter(from, to)

  const pipeline = [
    ...(Object.keys(dateFilter).length ? [{ $match: dateFilter }] : []),
    { $group: { _id: '$userId', attendanceCount: { $sum: 1 } } },
  ]

  const counts = await Attendance.aggregate(pipeline)
  const countMap = new Map(
    counts.map((row) => [row._id.toString(), row.attendanceCount])
  )

  const users = await User.find().sort({ name: 1 }).lean()

  return users.map((user) => ({
    id: user._id.toString(),
    externalId: user.externalId,
    name: user.name,
    phone: user.phone,
    registeredAt: user.createdAt,
    attendanceCount: countMap.get(user._id.toString()) ?? 0,
  }))
}

export async function getUserById(userId) {
  return User.findById(userId)
}

export async function listAttendanceForUser(userId, { from, to } = {}) {
  const filter = { userId, ...buildAttendanceDateFilter(from, to) }
  const records = await Attendance.find(filter)
    .sort({ attendanceDate: -1 })
    .lean()

  return records.map((record) => ({
    id: record._id.toString(),
    date: record.attendanceDate,
    markedAt: record.markedAt,
    distanceMeters: record.distanceFromVenueMeters,
  }))
}
