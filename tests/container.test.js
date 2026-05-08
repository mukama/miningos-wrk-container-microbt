'use strict'

const { getDefaultConf, testExecutor } = require('@tetherto/miningos-tpl-wrk-container/tests/container.test')
const Container = require('../workers/lib/container')
const { promiseSleep: sleep } = require('@bitfinex/lib-js-util-promise')
const ModbusFacility = require('@tetherto/svc-facs-modbus')
const crypto = require('crypto')

let mock
const conf = getDefaultConf()
if (!conf.settings.live) {
  conf.settings.host = '127.0.0.1'
  const srv = require('../mock/server')
  mock = srv.createServer({
    host: conf.settings.host,
    port: conf.settings.port,
    type: 'Wonderint'
  })
}

const fac = new ModbusFacility({ ctx: { env: 'test', root: '.' } }, {}, { env: 'test', root: '.' })
const container = new Container({
  timeout: 100,
  getClient: fac.getClient.bind(fac),
  address: conf.settings.host,
  port: conf.settings.port,
  username: 'admin',
  password: crypto.randomBytes(4).toString('base64').replace(/[^a-z0-9]/gi, '').slice(0, 4)
})

conf.cleanup = () => {
  if (mock) {
    mock.server.close()
    mock.cleanup()
  }
  container.close()
}

async function execute () {
  await sleep(3000)
  testExecutor(container, conf)
}

execute()
