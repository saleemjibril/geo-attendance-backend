import { Router } from 'express'
import { parseOptionalDateRange } from '../lib/dates.js'
import { requireAdmin, signAdminToken } from '../middleware/adminAuth.js'
import { findAdminByUsername, verifyAdminPassword } from '../services/admins.js'
import {
  getUserById,
  listAttendanceForUser,
  listUsersWithAttendanceCounts,
} from '../services/users.js'

const router = Router()

router.post('/login', async (req, res, next) => {
  try {
    const username = String(req.body.username ?? '').trim()
    const password = String(req.body.password ?? '')

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const admin = await findAdminByUsername(username)
    if (!admin || !(await verifyAdminPassword(admin, password))) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    const token = signAdminToken(admin._id.toString())
    res.json({ token })
  } catch (err) {
    next(err)
  }
})

router.use(requireAdmin)

router.get('/users', async (req, res, next) => {
  try {
    const range = parseOptionalDateRange(req.query)
    if (range.error) {
      return res.status(400).json({ error: range.error })
    }

    const users = await listUsersWithAttendanceCounts(range)
    res.json({
      from: range.from,
      to: range.to,
      users,
    })
  } catch (err) {
    next(err)
  }
})

router.get('/users/:userId', async (req, res, next) => {
  try {
    const user = await getUserById(req.params.userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    const range = parseOptionalDateRange(req.query)
    if (range.error) {
      return res.status(400).json({ error: range.error })
    }

    const attendance = await listAttendanceForUser(user._id, range)

    res.json({
      user: {
        id: user._id.toString(),
        externalId: user.externalId,
        name: user.name,
        phone: user.phone,
        registeredAt: user.createdAt,
      },
      from: range.from,
      to: range.to,
      attendanceCount: attendance.length,
      attendance,
    })
  } catch (err) {
    next(err)
  }
})

export default router
