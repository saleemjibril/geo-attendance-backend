import cors from 'cors'
import express from 'express'
import { connectMongo } from './db/mongo.js'
import { createCorsOptions } from './lib/cors.js'
import { notFound, errorHandler } from './middleware/errors.js'
import routes from './routes/index.js'
import { bootstrapAdminsFromEnv } from './services/admins.js'

let bootstrapped = false

export function createApp() {
  const app = express()

  app.use(cors(createCorsOptions()))
  app.use(express.json())

  app.use(async (req, res, next) => {
    try {
      await connectMongo()
      if (!bootstrapped) {
        await bootstrapAdminsFromEnv()
        bootstrapped = true
      }
      next()
    } catch (err) {
      next(err)
    }
  })

  app.use('/', routes)
  app.use(notFound)
  app.use(errorHandler)

  return app
}
