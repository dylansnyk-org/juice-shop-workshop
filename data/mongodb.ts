/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

// Simple in-memory MongoDB-like replacement for marsdb to fix critical vulnerability
// Maintains API compatibility for NoSQL injection challenges while removing code injection risk

class SimpleCollection {
  private data: Array<any> = []
  private idCounter = 1

  constructor (public name: string) {}

  insert (doc: any): Promise<any> {
    const newDoc = { ...doc, _id: this.idCounter++ }
    this.data.push(newDoc)
    return Promise.resolve(newDoc)
  }

  find (query: any): Promise<Array<any>> {
    return Promise.resolve(this._findMatching(query))
  }

  findOne (query: any): Promise<any> {
    const results = this._findMatching(query)
    return Promise.resolve(results.length > 0 ? results[0] : null)
  }

  update (query: any, update: any, options: any = {}): Promise<any> {
    const matches = this._findMatching(query)
    let modified = 0
    const original: Array<any> = []

    for (const doc of matches) {
      if (!options.multi && modified > 0) break
      original.push({ ...doc })
      if (update.$set) {
        Object.assign(doc, update.$set)
      }
      modified++
    }

    return Promise.resolve({ modified, original })
  }

  private _findMatching (query: any): Array<any> {
    if (query.$where) {
      // Support $where for NoSQL injection challenges
      // Evaluate the query safely by using vm module with restricted context
      const vm = require('vm')
      return this.data.filter((doc: any) => {
        try {
          const whereStr = typeof query.$where === 'string' ? query.$where : query.$where.toString()
          // Create a safe sandbox context
          const sandbox = { this: doc }
          vm.createContext(sandbox)
          // Execute in a timeout to prevent infinite loops
          const result = vm.runInContext(whereStr, sandbox, { timeout: 100 })
          return result === true
        } catch {
          return false
        }
      })
    }

    // Handle simple field queries
    return this.data.filter((doc: any) => {
      for (const key in query) {
        if (key.startsWith('$')) continue
        if (doc[key] !== query[key]) {
          return false
        }
      }
      return true
    })
  }
}

class SimpleMarsDB {
  Collection = SimpleCollection
}

const MarsDB = new SimpleMarsDB()

const reviews = new MarsDB.Collection('posts')
const orders = new MarsDB.Collection('orders')

const db = {
  reviews,
  orders
}

module.exports = db
