import mongoose from 'mongoose'

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
)

adminSchema.index(
  { username: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
)

export const Admin = mongoose.model('Admin', adminSchema)
