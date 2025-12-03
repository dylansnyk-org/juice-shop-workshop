/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

import { Component } from '@angular/core'
import { DomSanitizer } from '@angular/platform-browser'
import * as jwtDecode from 'jwt-decode'

@Component({
  selector: 'app-last-login-ip',
  templateUrl: './last-login-ip.component.html',
  styleUrls: ['./last-login-ip.component.scss']

})

export class LastLoginIpComponent {
  lastLoginIp: any = '?'
  constructor (private readonly sanitizer: DomSanitizer) {}

  ngOnInit () {
    try {
      this.parseAuthToken()
    } catch (err) {
      console.log(err)
    }
  }

  parseAuthToken () {
    let payload = {} as any
    const token = localStorage.getItem('token')
    if (token) {
      payload = jwtDecode(token)
      if (payload.data.lastLoginIp) {
        // Sanitize IP address to prevent XSS
        const sanitizedIp = String(payload.data.lastLoginIp || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        this.lastLoginIp = this.sanitizer.bypassSecurityTrustHtml(`<small>${sanitizedIp}</small>`)
      }
    }
  }
}
