import { connectMongo } from '../src/db/mongo.js'
import { Attendance } from '../src/models/Attendance.js'
import { User } from '../src/models/User.js'

await connectMongo()

const attendanceResult = await Attendance.deleteMany({})
const usersResult = await User.deleteMany({})

console.log(
  `Deleted ${usersResult.deletedCount} user(s) and ${attendanceResult.deletedCount} attendance record(s).`
)

process.exit(0)
