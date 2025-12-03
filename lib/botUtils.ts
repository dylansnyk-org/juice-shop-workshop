/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */
import models = require('../models/index')
import { type Product } from '../data/types'
import Fuse from 'fuse.js'
const security = require('./insecurity')
const challengeUtils = require('./challengeUtils')
const challenges = require('../data/datacache').challenges

async function productPrice (query: string, user: string) {
  const [products] = await models.sequelize.query('SELECT * FROM Products')
  const fuse = new Fuse(products as Product[], {
    keys: ['name'],
    threshold: 0.4,
    includeScore: true
  })
  const results = fuse.search(query)
  const queriedProducts = results
    .map((result) => `${result.item.name} costs ${result.item.price}¤`)
  return {
    action: 'response',
    body: queriedProducts.length > 0 ? queriedProducts.join(', ') : 'Sorry I couldn\'t find any products with that name'
  }
}

function couponCode (query: string, user: string) {
  challengeUtils.solveIf(challenges.bullyChatbotChallenge, () => { return true })
  return {
    action: 'response',
    body: `Oooookay, if you promise to stop nagging me here's a 10% coupon code for you: ${security.generateCoupon(10)}`
  }
}

function testFunction (query: string, user: string) {
  return {
    action: 'response',
    body: '3be2e438b7f3d04c89d7749f727bb3bd'
  }
}

module.exports = {
  productPrice,
  couponCode,
  testFunction
}
