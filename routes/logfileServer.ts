/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import path = require('path')
import { type Request, type Response, type NextFunction } from 'express'

module.exports = function serveLogFiles () {
  return ({ params }: Request, res: Response, next: NextFunction) => {
    const file = params.file

    if (!file.includes('/') && !file.includes('..') && !file.includes('\\')) {
      const sanitizedFile = path.basename(file)
      const resolvedPath = path.resolve('logs/', sanitizedFile)
      const baseDir = path.resolve('logs/')
      
      if (!resolvedPath.startsWith(baseDir)) {
        res.status(403)
        next(new Error('Invalid file path!'))
        return
      }
      
      res.sendFile(resolvedPath)
    } else {
      res.status(403)
      next(new Error('File names cannot contain forward slashes or directory traversal patterns!'))
    }
  }
}
