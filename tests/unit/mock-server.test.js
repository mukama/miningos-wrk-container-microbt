'use strict'

const test = require('brittle')
const { createServer } = require('../../mock/server')

function whenListening (server) {
  if (server.listening) return Promise.resolve()
  return new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
}

test('createServer throws ERR_UNSUPPORTED for unknown container type', (t) => {
  t.exception(() => {
    createServer({ host: '127.0.0.1', port: 24100, type: 'unknown' })
  }, /ERR_UNSUPPORTED/)
})

test('createServer exposes lifecycle helpers for Wonderint', async (t) => {
  const mock = createServer({ host: '127.0.0.1', port: 0, type: 'Wonderint' })
  await whenListening(mock.server)

  t.ok(mock.server)
  t.ok(typeof mock.exit === 'function')
  t.ok(typeof mock.start === 'function')
  t.ok(typeof mock.stop === 'function')
  t.ok(typeof mock.reset === 'function')

  mock.start()
  mock.stop()
  mock.start()
  await whenListening(mock.server)
  mock.reset()
  mock.exit()
})

test('createServer works for Kehua type', async (t) => {
  const mock = createServer({ host: '127.0.0.1', port: 0, type: 'Kehua' })
  await whenListening(mock.server)
  mock.exit()
})
