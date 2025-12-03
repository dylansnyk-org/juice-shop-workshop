/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import fs = require('fs')
import { type Request, type Response, type NextFunction } from 'express'
import logger from '../lib/logger'
import fetch from 'node-fetch'
import RateLimit from 'express-rate-limit'

import { UserModel } from '../models/user'
import * as utils from '../lib/utils'
const security = require('../lib/insecurity')

// Rate limiter: max 5 profile image uploads per minute per IP
const uploadRateLimiter = RateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5,
  message: 'Too many profile image uploads, please try again later',
  standardHeaders: true,
  legacyHeaders: false
})

module.exports = function profileImageUrlUpload () {
  return [uploadRateLimiter, async (req: Request, res: Response, next: NextFunction) => {
    if (req.body.imageUrl !== undefined) {
      const url = req.body.imageUrl
      if (url.match(/(.)*solve\/challenges\/server-side(.)*/) !== null) req.app.locals.abused_ssrf_bug = true
      const loggedInUser = security.authenticatedUsers.get(req.cookies.token)
      if (loggedInUser) {
        try {
          const imageResponse = await fetch(url)
          if (imageResponse.ok) {
            const ext = ['jpg', 'jpeg', 'png', 'svg', 'gif'].includes(String(url).split('.').slice(-1)[0].toLowerCase()) ? String(url).split('.').slice(-1)[0].toLowerCase() : 'jpg'
            const filePath = `frontend/dist/frontend/assets/public/images/uploads/${loggedInUser.data.id}.${ext}`
            const fileStream = fs.createWriteStream(path.basename(filePath))
            await new Promise((resolve, reject) => {
              imageResponse.body?.pipe(fileStream)
              imageResponse.body?.on('error', reject)
              fileStream.on('finish', resolve)
            })
            const user = await UserModel.findByPk(loggedInUser.data.id)
            await user?.update({ profileImage: `/assets/public/images/uploads/${loggedInUser.data.id}.${ext}` })
          } else {
            const user = await UserModel.findByPk(loggedInUser.data.id)
            await user?.update({ profileImage: url })
          }
        } catch (err: unknown) {
          const user = await UserModel.findByPk(loggedInUser.data.id)
          await user?.update({ profileImage: url }).catch((error: Error) => { next(error) })
          logger.warn(`Error retrieving user profile image: ${utils.getErrorMessage(err)}; using image link directly`)
        }
      } else {
        next(new Error('Blocked illegal activity by ' + req.socket.remoteAddress))
      }
    }
    res.location(process.env.BASE_PATH + '/profile')
    res.redirect(process.env.BASE_PATH + '/profile')
  }]
}
