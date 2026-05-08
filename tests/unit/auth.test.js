'use strict'

const test = require('brittle')
const crypto = require('crypto')
const { getAuthData } = require('../../workers/lib/utils/auth')
const password = crypto.randomBytes(5).toString('base64').replace(/[^a-z0-9]/gi, '').slice(0, 5)

test('getAuthData - basic functionality', (t) => {
  const username = 'testuser'
  const random = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08])

  const result = getAuthData(username, password, random)

  // Verify it returns a Buffer
  t.ok(Buffer.isBuffer(result))
  t.is(result.length, 32) // SHA256 produces 32 bytes

  // Verify it's deterministic for same inputs
  const result2 = getAuthData(username, password, random)
  t.alike(result, result2)
})

test('getAuthData - different inputs produce different results', (t) => {
  const random = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08])

  const result1 = getAuthData('user1', 'pass1', random)
  const result2 = getAuthData('user2', 'pass2', random)
  const result3 = getAuthData('user1', 'pass2', random)

  t.unlike(result1, result2)
  t.unlike(result1, result3)
  t.unlike(result2, result3)
})

test('getAuthData - different random values produce different results', (t) => {
  const username = 'testuser'
  const random1 = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08])
  const random2 = Buffer.from([0x08, 0x07, 0x06, 0x05, 0x04, 0x03, 0x02, 0x01])

  const result1 = getAuthData(username, password, random1)
  const result2 = getAuthData(username, password, random2)

  t.unlike(result1, result2)
})

test('getAuthData - empty strings', (t) => {
  const random = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08])

  const result = getAuthData('', '', random)

  t.ok(Buffer.isBuffer(result))
  t.is(result.length, 32)
})

test('getAuthData - special characters in username/password', (t) => {
  const random = Buffer.from([0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08])

  const result = getAuthData('user@domain.com', 'pass!@#$%', random)

  t.ok(Buffer.isBuffer(result))
  t.is(result.length, 32)
})
