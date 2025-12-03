/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

// SECURITY FIX: Removed vm and notevil due to critical RCE vulnerabilities
// import vm = require('vm')
import { type Request, type Response, type NextFunction } from 'express'
import challengeUtils = require('../lib/challengeUtils')

import * as utils from '../lib/utils'
const security = require('../lib/insecurity')
// const safeEval = require('notevil') // REMOVED: CVE-2021-23771
const challenges = require('../data/datacache').challenges

module.exports = function b2bOrder () {
  return ({ body }: Request, res: Response, next: NextFunction) => {
    // SECURITY FIX: Disabled unsafe code execution features
    // RCE challenges are now disabled for security
    if (!utils.disableOnContainerEnv()) {
      // Validate orderLinesData as JSON only - no code execution
      const orderLinesData = body.orderLinesData || ''
      try {
        // Safe JSON parsing only
        const parsedData = typeof orderLinesData === 'string' ? JSON.parse(orderLinesData) : orderLinesData
        if (!Array.isArray(parsedData)) {
          throw new Error('Order data must be an array')
        }
        res.json({ cid: body.cid, orderNo: uniqueOrderNumber(), paymentDue: dateTwoWeeksFromNow() })
      } catch (err) {
        res.status(400)
        next(new Error('Invalid order data format'))
      }
    } else {
      res.json({ cid: body.cid, orderNo: uniqueOrderNumber(), paymentDue: dateTwoWeeksFromNow() })
    }
  }

  function uniqueOrderNumber () {
    return security.hash(new Date() + '_B2B')
  }

  function dateTwoWeeksFromNow () {
    return new Date(new Date().getTime() + (14 * 24 * 60 * 60 * 1000)).toISOString()
  }
}
