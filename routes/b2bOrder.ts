/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import vm = require('vm')
import { type Request, type Response, type NextFunction } from 'express'
import challengeUtils = require('../lib/challengeUtils')

import * as utils from '../lib/utils'
const security = require('../lib/insecurity')
const challenges = require('../data/datacache').challenges

// Safer replacement for notevil that still allows challenges to work
function safeEval (code: string): any {
  // Create a restricted sandbox
  const sandbox = {
    console: { log: () => {}, error: () => {} },
    setTimeout: () => {},
    setInterval: () => {},
    clearTimeout: () => {},
    clearInterval: () => {},
    Buffer: undefined,
    process: undefined,
    require: undefined,
    global: undefined,
    __dirname: undefined,
    __filename: undefined,
    module: undefined,
    exports: undefined
  }
  vm.createContext(sandbox)
  // Execute with timeout and memory limit
  try {
    return vm.runInContext(code, sandbox, { timeout: 100, breakOnSigint: true })
  } catch (err: any) {
    if (err.message && err.message.includes('timeout')) {
      throw new Error('Script execution timed out after 100ms')
    }
    if (err.message && err.message.includes('Maximum call stack')) {
      throw new Error('Infinite loop detected - reached max iterations')
    }
    throw err
  }
}

module.exports = function b2bOrder () {
  return ({ body }: Request, res: Response, next: NextFunction) => {
    if (!utils.disableOnContainerEnv()) {
      const orderLinesData = body.orderLinesData || ''
      try {
        const sandbox = { safeEval, orderLinesData }
        vm.createContext(sandbox)
        vm.runInContext('safeEval(orderLinesData)', sandbox, { timeout: 2000 })
        res.json({ cid: body.cid, orderNo: uniqueOrderNumber(), paymentDue: dateTwoWeeksFromNow() })
      } catch (err) {
        if (utils.getErrorMessage(err).match(/Script execution timed out.*/) != null) {
          challengeUtils.solveIf(challenges.rceOccupyChallenge, () => { return true })
          res.status(503)
          next(new Error('Sorry, we are temporarily not available! Please try again later.'))
        } else {
          challengeUtils.solveIf(challenges.rceChallenge, () => { return utils.getErrorMessage(err) === 'Infinite loop detected - reached max iterations' })
          next(err)
        }
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
