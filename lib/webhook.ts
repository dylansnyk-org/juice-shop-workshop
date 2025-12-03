/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import os from 'os'
import axios from 'axios'
import logger from './logger'
import config from 'config'
import colors from 'colors/safe'
import * as utils from './utils'
import { totalCheatScore } from './antiCheat'

export const notify = async (challenge: { key: any, name: any }, cheatScore = -1, webhook = process.env.SOLUTIONS_WEBHOOK) => {
  if (!webhook) {
    return
  }
  try {
    const res = await axios.post(webhook, {
      solution: {
        challenge: challenge.key,
        cheatScore,
        totalCheatScore: totalCheatScore(),
        issuedOn: new Date().toISOString()
      },
      ctfFlag: utils.ctfFlag(challenge.name),
      issuer: {
        hostName: os.hostname(),
        os: `${os.type()} (${os.release()})`,
        appName: config.get('application.name'),
        config: process.env.NODE_ENV ?? 'default',
        version: utils.version()
      }
    })
    logger.info(`Webhook ${colors.bold(webhook)} notified about ${colors.cyan(challenge.key)} being solved: ${res.status < 400 ? colors.green(res.status.toString()) : colors.red(res.status.toString())}`)
  } catch (error: any) {
    const statusCode = error.response?.status || 500
    logger.info(`Webhook ${colors.bold(webhook)} notified about ${colors.cyan(challenge.key)} being solved: ${colors.red(statusCode.toString())}`)
  }
}
