import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    externalId: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
  },
  { timestamps: true }
)

userSchema.index(
  { externalId: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } }
)

export const User = mongoose.model('User', userSchema)
