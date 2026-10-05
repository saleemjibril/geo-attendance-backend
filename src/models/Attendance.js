import mongoose from 'mongoose'

const attendanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    attendanceDate: { type: String, required: true },
    markedAt: { type: Date, default: Date.now },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    accuracyMeters: { type: Number, default: null },
    distanceFromVenueMeters: { type: Number, required: true },
  },
  { timestamps: true }
)

attendanceSchema.index({ userId: 1, attendanceDate: 1 }, { unique: true })
attendanceSchema.index({ attendanceDate: 1 })

export const Attendance = mongoose.model('Attendance', attendanceSchema)
