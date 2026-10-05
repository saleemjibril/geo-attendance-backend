import { connectMongo } from '../src/db/mongo.js'
import { createAdmin, findAdminByUsername } from '../src/services/admins.js'

const username = process.env.ADMIN_BOOTSTRAP_USERNAME?.trim()
const password = process.env.ADMIN_BOOTSTRAP_PASSWORD

if (!username || !password) {
  console.error(
    'Set ADMIN_BOOTSTRAP_USERNAME and ADMIN_BOOTSTRAP_PASSWORD in .env'
  )
  process.exit(1)
}

await connectMongo()

const existing = await findAdminByUsername(username)
if (existing) {
  console.log(`Admin "${username}" already exists — no changes made.`)
  process.exit(0)
}

await createAdmin({ username, password })
console.log(`Admin "${username}" created.`)

process.exit(0)
