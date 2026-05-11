/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import path = require('path')
import { type Request, type Response, type NextFunction } from 'express'
import challengeUtils = require('../lib/challengeUtils')

import * as utils from '../lib/utils'
const security = require('../lib/insecurity')
const challenges = require('../data/datacache').challenges

module.exports = function servePublicFiles () {
  return ({ params, query }: Request, res: Response, next: NextFunction) => {
    const file = params.file

    if (!file.includes('/')) {
      verify(file, res, next)
    } else {
      res.status(403)
      next(new Error('File names cannot contain forward slashes!'))
    }
  }

  function verify (file: string, res: Response, next: NextFunction) {
    if (file && (endsWithAllowlistedFileType(file) || (file === 'incident-support.kdbx'))) {
      file = security.cutOffPoisonNullByte(file)

      // Additional path traversal protection
      if (isPathTraversal(file)) {
        res.status(403)
        next(new Error('Path traversal detected!'))
        return
      }

      challengeUtils.solveIf(challenges.directoryListingChallenge, () => { return file.toLowerCase() === 'acquisitions.md' })
      verifySuccessfulPoisonNullByteExploit(file)

      // Use path.join instead of path.resolve and normalize the path
      const safePath = path.normalize(path.join('ftp', file))
      
      // Ensure the resolved path is still within the ftp directory
      if (!safePath.startsWith('ftp' + path.sep) && safePath !== 'ftp') {
        res.status(403)
        next(new Error('Path traversal detected!'))
        return
      }

      // Use absolute path to prevent any remaining path traversal issues
      const absolutePath = path.resolve(process.cwd(), safePath)
      
      // Double-check that the absolute path is still within the expected directory
      const expectedBase = path.resolve(process.cwd(), 'ftp')
      if (!absolutePath.startsWith(expectedBase)) {
        res.status(403)
        next(new Error('Path traversal detected!'))
        return
      }

      res.sendFile(absolutePath)
    } else {
      res.status(403)
      next(new Error('Only .md and .pdf files are allowed!'))
    }
  }

  function verifySuccessfulPoisonNullByteExploit (file: string) {
    challengeUtils.solveIf(challenges.easterEggLevelOneChallenge, () => { return file.toLowerCase() === 'eastere.gg' })
    challengeUtils.solveIf(challenges.forgottenDevBackupChallenge, () => { return file.toLowerCase() === 'package.json.bak' })
    challengeUtils.solveIf(challenges.forgottenBackupChallenge, () => { return file.toLowerCase() === 'coupons_2013.md.bak' })
    challengeUtils.solveIf(challenges.misplacedSignatureFileChallenge, () => { return file.toLowerCase() === 'suspicious_errors.yml' })

    challengeUtils.solveIf(challenges.nullByteChallenge, () => {
      return challenges.easterEggLevelOneChallenge.solved || challenges.forgottenDevBackupChallenge.solved || challenges.forgottenBackupChallenge.solved ||
        challenges.misplacedSignatureFileChallenge.solved || file.toLowerCase() === 'encrypt.pyc'
    })
  }

  function endsWithAllowlistedFileType (param: string) {
    return utils.endsWith(param, '.md') || utils.endsWith(param, '.pdf')
  }

  function isPathTraversal (file: string) {
    // Check for various path traversal patterns
    const dangerousPatterns = [
      /\.\./,                    // Parent directory references
      /\\/,                      // Backslashes (Windows path separators)
      /%2e%2e/i,                // URL encoded ..
      /%2f/i,                   // URL encoded /
      /%5c/i,                   // URL encoded \
      /\.\.%2f/i,               // URL encoded ../
      /\.\.%5c/i,               // URL encoded ..\
      /%2e%2e%2f/i,             // URL encoded ../
      /%2e%2e%5c/i,             // URL encoded ..\
      /\0/,                     // Null bytes
      /\x00/,                   // Null bytes (hex)
      /\.\.\/\.\.\/\.\./,       // Multiple parent directory references
      /\.\.\\\.\.\\\.\./,       // Multiple parent directory references (Windows)
    ]

    return dangerousPatterns.some(pattern => pattern.test(file))
  }
}
