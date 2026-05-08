'use strict'

const WrkRack = require('@tetherto/miningos-tpl-wrk-container/workers/rack.container.wrk')
const Container = require('./container.js')
const async = require('async')

class WrkContainerRack extends WrkRack {
  init () {
    super.init()

    this.setInitFacs([
      ['fac', '@tetherto/svc-facs-modbus', '0', '0', {}, 0]
    ])
  }

  _start (cb) {
    async.series([
      next => { super._start(next) },
      (next) => {
        this.miningosThgWriteCalls_0.whitelistActions([
          ['setCoolingFanThreshold', 1]
        ])
        next()
      }
    ], cb)
  }

  getThingType () {
    return super.getThingType() + '-mbt'
  }

  getThingTags () {
    return ['microbt']
  }

  getSpecTags () {
    return ['container']
  }

  async collectThingSnap (thg) {
    return thg.ctrl.getSnap()
  }

  selectThingInfo (thg) {
    return {
      address: thg.opts?.address,
      port: thg.opts?.port
    }
  }

  async _connectThing (thg, type) {
    if (!thg.opts.address || !thg.opts.port || !thg.opts.username || !thg.opts.password) {
      return 0
    }

    const container = new Container({
      ...thg.opts,
      getClient: this.modbus_0.getClient.bind(this.modbus_0),
      type,
      conf: this.conf.thing.container || {}
    })

    container.init()

    container.on('error', e => {
      this.debugThingError(thg, e)
    })

    thg.ctrl = container

    return 1
  }
}

module.exports = WrkContainerRack
