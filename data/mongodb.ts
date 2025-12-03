/*
 * Copyright (c) 2014-2023 Bjoern Kimminich & the OWASP Juice Shop contributors.
 * SPDX-License-Identifier: MIT
 */

// SECURITY FIX: MarsDB removed due to critical code injection vulnerability
// Using simple in-memory storage as replacement
interface Review {
  _id: string
  [key: string]: any
}

interface Order {
  _id: string
  [key: string]: any
}

class SimpleCollection {
  private data: Map<string, any> = new Map()
  private collectionName: string

  constructor(name: string) {
    this.collectionName = name
  }

  async findOne(query: any) {
    const id = query._id
    return this.data.get(id) || null
  }

  async find(query: any = {}) {
    return Array.from(this.data.values())
  }

  async insert(doc: any) {
    const id = doc._id || String(Date.now() + Math.random())
    doc._id = id
    this.data.set(id, doc)
    return doc
  }

  async update(query: any, update: any) {
    const id = query._id
    const existing = this.data.get(id)
    if (existing) {
      const updated = { ...existing, ...update.$set }
      this.data.set(id, updated)
      return { modified: 1 }
    }
    return { modified: 0 }
  }

  async remove(query: any) {
    const id = query._id
    return this.data.delete(id)
  }
}

const reviews = new SimpleCollection('posts')
const orders = new SimpleCollection('orders')

const db = {
  reviews,
  orders
}

module.exports = db
