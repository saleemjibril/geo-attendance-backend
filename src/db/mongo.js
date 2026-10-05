import mongoose from 'mongoose'

const globalCache = globalThis

export async function connectMongo() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    throw new Error('MONGODB_URI is not set in the environment')
  }

  if (globalCache._mongoose?.connection?.readyState === 1) {
    return globalCache._mongoose.connection
  }

  if (!globalCache._mongoosePromise) {
    mongoose.set('strictQuery', true)
    globalCache._mongoosePromise = mongoose.connect(uri).then((conn) => {
      console.log('Connected to MongoDB')
      globalCache._mongoose = mongoose
      return conn
    })
  }

  return globalCache._mongoosePromise
}
