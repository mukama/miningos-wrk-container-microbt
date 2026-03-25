'use strict'

const test = require('brittle')
const modbus = require('modbus-stream')
const { createServer } = require('../../mock/server')

function whenListening (server) {
  if (server.listening) return Promise.resolve()
  return new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
}

test('mock default state handles unit 1 CDU writes and bulk register write', async (t) => {
  const mock = createServer({ host: '127.0.0.1', port: 0, type: 'Wonderint' })
  await whenListening(mock.server)
  const port = mock.server.address().port
  const extra = { extra: { unitId: 1 } }

  await new Promise((resolve, reject) => {
    modbus.tcp.connect(port, '127.0.0.1', { debug: null }, (err, connection) => {
      if (err) return reject(err)

      connection.writeSingleRegister({ address: 601, value: Buffer.from([0, 42]), ...extra }, (e1) => {
        if (e1) return reject(e1)
        connection.writeSingleRegister({ address: 606, value: Buffer.from([0, 7]), ...extra }, (e2) => {
          if (e2) return reject(e2)
          connection.writeSingleRegister({ address: 612, value: Buffer.from([1, 44]), ...extra }, (e3) => {
            if (e3) return reject(e3)
            connection.writeSingleRegister({ address: 613, value: Buffer.from([0, 99]), ...extra }, (e4) => {
              if (e4) return reject(e4)
              connection.writeSingleRegister({ address: 614, value: Buffer.from([0, 88]), ...extra }, (e5) => {
                if (e5) return reject(e5)
                const values = Array.from({ length: 16 }, () => Buffer.from([0, 1]))
                connection.writeMultipleRegisters({ address: 304, values, ...extra }, (e6) => {
                  if (e6) return reject(e6)
                  connection.close(() => resolve())
                })
              })
            })
          })
        })
      })
    })
  })

  mock.exit()
})

test('mock default state rejects invalid unit on write-single-register', async (t) => {
  const mock = createServer({ host: '127.0.0.1', port: 0, type: 'Wonderint' })
  await whenListening(mock.server)
  const port = mock.server.address().port

  await new Promise((resolve, reject) => {
    modbus.tcp.connect(port, '127.0.0.1', { debug: null }, (err, connection) => {
      if (err) return reject(err)
      connection.writeSingleRegister({
        address: 601,
        value: Buffer.from([0, 1]),
        extra: { unitId: 2 }
      }, (werr) => {
        t.ok(werr)
        connection.close(() => resolve())
      })
    })
  })

  mock.exit()
})
