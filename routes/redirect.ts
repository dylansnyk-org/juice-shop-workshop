/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import utils = require('../lib/utils')
import challengeUtils = require('../lib/challengeUtils')
import { type Request, type Response, type NextFunction } from 'express'

const security = require('../lib/insecurity')
const challenges = require('../data/datacache').challenges

module.exports = function performRedirect () {
  return ({ query }: Request, res: Response, next: NextFunction) => {
    const toUrl = String(query.to || '')
    
    // Validate URL format and prevent open redirects
    try {
      const url = new URL(toUrl)
      // Only allow HTTPS and specific whitelisted domains
      const allowedDomains = ['github.com', 'blockchain.info', 'explorer.dash.org', 'etherscan.io', 'spreadshirt.com', 'spreadshirt.de', 'stickeryou.com', 'leanpub.com']
      const isAllowed = url.protocol === 'https:' && allowedDomains.some(domain => url.hostname.endsWith(domain))
      
      if (!isAllowed) {
        res.status(406)
        next(new Error('Redirect to this domain is not allowed: ' + url.hostname))
        return
      }
      
      if (security.isRedirectAllowed(toUrl)) {
        challengeUtils.solveIf(challenges.redirectCryptoCurrencyChallenge, () => { return toUrl === 'https://explorer.dash.org/address/Xr556RzuwX6hg5EGpkybbv5RanJoZN17kW' || toUrl === 'https://blockchain.info/address/1AbKfgvw9psQ41NbLi8kufDQTezwG8DRZm' || toUrl === 'https://etherscan.io/address/0x0f933ab9fcaaa782d0279c300d73750e1311eae6' })
        challengeUtils.solveIf(challenges.redirectChallenge, () => { return isUnintendedRedirect(toUrl) })
        res.redirect(toUrl)
      } else {
        res.status(406)
        next(new Error('Unrecognized target URL for redirect: ' + toUrl))
      }
    } catch (error) {
      res.status(400)
      next(new Error('Invalid URL format: ' + toUrl))
    }
  }
}

function isUnintendedRedirect (toUrl: string) {
  let unintended = true
  for (const allowedUrl of security.redirectAllowlist) {
    unintended = unintended && !utils.startsWith(toUrl, allowedUrl)
  }
  return unintended
}
