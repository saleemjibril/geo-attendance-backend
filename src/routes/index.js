import { Router } from 'express'
import adminRoutes from './admin.js'
import attendanceRoutes from './attendance.js'

const router = Router()

router.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() })
})

router.use('/api', attendanceRoutes)
router.use('/api/admin', adminRoutes)

export default router
