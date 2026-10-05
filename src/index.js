import cors from 'cors'
import express from 'express'
import { connectMongo } from './db/mongo.js'
import { bootstrapAdminsFromEnv } from './services/admins.js'
import { notFound, errorHandler } from './middleware/errors.js'
import routes from './routes/index.js'

const app = express()
const PORT = process.env.PORT || 3000
const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000'

app.use(
  cors({
    origin: corsOrigin.split(',').map((o) => o.trim()),
  })
)
app.use(express.json())
app.use('/', routes)
app.use(notFound)
app.use(errorHandler)

await connectMongo()
await bootstrapAdminsFromEnv()

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
