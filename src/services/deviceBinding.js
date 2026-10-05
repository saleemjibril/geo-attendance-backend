import {
  deviceTokensMatch,
  hashDeviceToken,
  isValidDeviceToken,
} from '../lib/deviceToken.js'
import { User } from '../models/User.js'

export function userDeviceSummary(user) {
  return {
    deviceBound: Boolean(user.deviceTokenHash),
    deviceBoundAt: user.deviceBoundAt ?? null,
  }
}

export async function bindDeviceToUser(user, deviceToken) {
  if (!isValidDeviceToken(deviceToken)) {
    return { error: 'Invalid device token', status: 400, code: 'INVALID_DEVICE' }
  }

  user.deviceTokenHash = hashDeviceToken(deviceToken)
  user.deviceBoundAt = new Date()
  await user.save()
  return { bound: true }
}

export async function assertDeviceForCheckIn(user, deviceToken) {
  if (!isValidDeviceToken(deviceToken)) {
    return {
      error: 'A valid device token is required',
      status: 400,
      code: 'INVALID_DEVICE',
    }
  }

  if (!user.deviceTokenHash) {
    return bindDeviceToUser(user, deviceToken)
  }

  if (!deviceTokensMatch(user.deviceTokenHash, deviceToken)) {
    return {
      error:
        'This ID is registered to another device. Use your own phone or ask an admin to unbind the device.',
      status: 403,
      code: 'DEVICE_MISMATCH',
    }
  }

  return { ok: true }
}

export async function unbindUserDevice(userId) {
  return User.findByIdAndUpdate(
    userId,
    { $unset: { deviceTokenHash: '', deviceBoundAt: '' } },
    { new: true }
  )
}
