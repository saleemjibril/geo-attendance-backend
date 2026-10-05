import bcrypt from 'bcryptjs'
import { Admin } from '../models/Admin.js'

const usernameCollation = { locale: 'en', strength: 2 }
const PASSWORD_ROUNDS = 12

export async function findAdminByUsername(username) {
  const trimmed = username.trim()
  return Admin.findOne({ username: trimmed }).collation(usernameCollation)
}

export async function createAdmin({ username, password }) {
  const trimmedUsername = username.trim()
  const passwordHash = await bcrypt.hash(password, PASSWORD_ROUNDS)
  return Admin.create({
    username: trimmedUsername,
    passwordHash,
  })
}

export async function verifyAdminPassword(admin, password) {
  return bcrypt.compare(password, admin.passwordHash)
}

/** Creates the first admin from env when the collection is empty (one-time bootstrap). */
export async function bootstrapAdminsFromEnv() {
  const count = await Admin.countDocuments()
  if (count > 0) return

  const username = process.env.ADMIN_BOOTSTRAP_USERNAME?.trim()
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD

  if (!username || !password) {
    console.warn(
      'No admin accounts in MongoDB. Set ADMIN_BOOTSTRAP_USERNAME and ADMIN_BOOTSTRAP_PASSWORD to create the first admin, or run npm run seed:admin.'
    )
    return
  }

  await createAdmin({ username, password })
  console.log(`Created bootstrap admin account: ${username}`)
}
