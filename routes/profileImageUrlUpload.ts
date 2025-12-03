/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import fs = require('fs')
import { type Request, type Response, type NextFunction } from 'express'
import logger from '../lib/logger'

import { UserModel } from '../models/user'
import * as utils from '../lib/utils'
const security = require('../lib/insecurity')
const request = require('request')

module.exports = function profileImageUrlUpload () {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.body.imageUrl !== undefined) {
      // Type validation
      if (typeof req.body.imageUrl !== 'string') {
        res.status(400).send('Invalid image URL type')
        return
      }
      const url = req.body.imageUrl
      
      // Validate URL to prevent SSRF
      try {
        const parsedUrl = new URL(url)
        const protocol = parsedUrl.protocol
        const hostname = parsedUrl.hostname.toLowerCase()
        
        // Only allow http and https
        if (protocol !== 'http:' && protocol !== 'https:') {
          res.status(400).send('Invalid URL protocol')
          return
        }
        
        // Block private/internal IP ranges and localhost
        const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', '::1', '[::1]']
        if (blockedHosts.includes(hostname) || 
            hostname.startsWith('192.168.') || 
            hostname.startsWith('10.') || 
            hostname.startsWith('172.16.') ||
            hostname.startsWith('169.254.')) {
          res.status(400).send('Access to internal resources is not allowed')
          return
        }
      } catch (e) {
        res.status(400).send('Invalid URL format')
        return
      }
      
      if (url.match(/(.)*solve\/challenges\/server-side(.)*/) !== null) req.app.locals.abused_ssrf_bug = true
      const loggedInUser = security.authenticatedUsers.get(req.cookies.token)
      if (loggedInUser) {
        const imageRequest = request
          .get(url)
          .on('error', function (err: unknown) {
            UserModel.findByPk(loggedInUser.data.id).then(async (user: UserModel | null) => { return await user?.update({ profileImage: url }) }).catch((error: Error) => { next(error) })
            logger.warn(`Error retrieving user profile image: ${utils.getErrorMessage(err)}; using image link directly`)
          })
          .on('response', function (res: Response) {
            if (res.statusCode === 200) {
              const ext = ['jpg', 'jpeg', 'png', 'svg', 'gif'].includes(url.split('.').slice(-1)[0].toLowerCase()) ? url.split('.').slice(-1)[0].toLowerCase() : 'jpg'
              const safeUserId = String(loggedInUser.data.id).replace(/[^a-zA-Z0-9]/g, '')
              const safeExt = ext.replace(/[^a-zA-Z0-9]/g, '')
              
              // Construct and validate the file path to prevent traversal
              const uploadsDir = path.resolve('frontend/dist/frontend/assets/public/images/uploads')
              const targetFile = path.resolve(uploadsDir, `${safeUserId}.${safeExt}`)
              
              // Ensure the target file is within the uploads directory
              if (!targetFile.startsWith(uploadsDir + path.sep)) {
                next(new Error('Invalid file path'))
                return
              }
              
              imageRequest.pipe(fs.createWriteStream(targetFile))
              UserModel.findByPk(loggedInUser.data.id).then(async (user: UserModel | null) => { return await user?.update({ profileImage: `/assets/public/images/uploads/${safeUserId}.${safeExt}` }) }).catch((error: Error) => { next(error) })
            } else UserModel.findByPk(loggedInUser.data.id).then(async (user: UserModel | null) => { return await user?.update({ profileImage: url }) }).catch((error: Error) => { next(error) })
          })
      } else {
        next(new Error('Blocked illegal activity by ' + req.socket.remoteAddress))
      }
    }
    res.location(process.env.BASE_PATH + '/profile')
    res.redirect(process.env.BASE_PATH + '/profile')
  }
}
