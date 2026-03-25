'use strict'

const test = require('brittle')
const MicroBTContainer = require('../../workers/lib/container')
const { CONTAINER_TYPES } = require('../../workers/lib/constants')
const crypto = require('crypto')
const password = crypto.randomBytes(5).toString('base64').replace(/[^a-z0-9]/gi, '').slice(0, 5)

// Mock dependencies
const mockClient = {
  unitId: 1,
  end: () => {},
  read: () => Promise.resolve(Buffer.from([0x01, 0x02])),
  write: () => Promise.resolve(Buffer.from([0x01, 0x02]))
}

const mockGetClient = () => mockClient

const getRandomIP = () => [...crypto.randomBytes(4)].join('.')

test('MicroBTContainer - constructor with valid options', (t) => {
  const container = new MicroBTContainer({
    getClient: mockGetClient,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  t.ok(container)
  t.is(container.type, CONTAINER_TYPES.WONDERINT)
  t.ok(container.units)
  t.ok(container.client)
})

test('MicroBTContainer - constructor with custom type', (t) => {
  const container = new MicroBTContainer({
    getClient: mockGetClient,
    type: CONTAINER_TYPES.KEHUA,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  t.is(container.type, CONTAINER_TYPES.KEHUA)
})

test('MicroBTContainer - has expected units', (t) => {
  const container = new MicroBTContainer({
    getClient: mockGetClient,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  const expectedUnits = [
    'fcdu', 'gtemp', 'henv', 'powermeter01', 'powermeter02', 'powermeter03', 'powermeter04',
    'diag', 'pdu01', 'pdu02', 'pdu03', 'pdu04', 'pdu05', 'pdu06', 'pdu07', 'pdu08',
    'pdu09', 'pdu10', 'pdu11', 'pdu12'
  ]

  for (const unit of expectedUnits) {
    t.ok(container.units[unit], `Unit ${unit} not found`)
    t.ok(typeof container.units[unit] === 'number', `Unit ${unit} is not a number`)
  }
})

test('MicroBTContainer - close method calls client.end', (t) => {
  let endCalled = false
  const mockClientWithEnd = {
    ...mockClient,
    end: () => { endCalled = true }
  }

  const mockGetClientWithEnd = () => mockClientWithEnd

  const container = new MicroBTContainer({
    getClient: mockGetClientWithEnd,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  container.close()
  t.ok(endCalled)
})

test('MicroBTContainer - _readHoldingRegisters sets unitId', async (t) => {
  let capturedUnitId = null
  const mockClientWithCapture = {
    ...mockClient,
    get unitId () { return this._unitId },
    set unitId (value) {
      this._unitId = value
      capturedUnitId = value
    }
  }

  const mockGetClientWithCapture = () => mockClientWithCapture

  const container = new MicroBTContainer({
    getClient: mockGetClientWithCapture,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  await container._readHoldingRegisters('fcdu', 100, 5)

  t.is(capturedUnitId, 1) // fcdu unit ID
})

test('MicroBTContainer - _writeSingleRegister sets unitId', async (t) => {
  let capturedUnitId = null
  const mockClientWithCapture = {
    ...mockClient,
    get unitId () { return this._unitId },
    set unitId (value) {
      this._unitId = value
      capturedUnitId = value
    }
  }

  const mockGetClientWithCapture = () => mockClientWithCapture

  const container = new MicroBTContainer({
    getClient: mockGetClientWithCapture,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  await container._writeSingleRegister('pdu01', 100, 1)

  t.is(capturedUnitId, 9) // pdu01 unit ID
})

test('MicroBTContainer - _writeMultipleRegisters sets unitId', async (t) => {
  let capturedUnitId = null
  const mockClientWithCapture = {
    ...mockClient,
    get unitId () { return this._unitId },
    set unitId (value) {
      this._unitId = value
      capturedUnitId = value
    }
  }

  const mockGetClientWithCapture = () => mockClientWithCapture

  const container = new MicroBTContainer({
    getClient: mockGetClientWithCapture,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  await container._writeMultipleRegisters('powermeter01', 100, [1, 2, 3])

  t.is(capturedUnitId, 4) // powermeter01 unit ID
})

test('MicroBTContainer - _socketControl with invalid enabled type throws error', async (t) => {
  const container = new MicroBTContainer({
    getClient: mockGetClient,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  await t.exception(async () => {
    await container._socketControl('1', '1', 'invalid')
  }, /ERR_INVALID_ARG_TYPE/)
})

test('MicroBTContainer - _socketControl with all PDUs and sockets', async (t) => {
  const writeCalls = []
  const mockClientWithCapture = {
    ...mockClient,
    write: (code, address, value) => {
      writeCalls.push({ code, address, value })
      return Promise.resolve(Buffer.from([0x01, 0x02]))
    }
  }

  const mockGetClientWithCapture = () => mockClientWithCapture

  const container = new MicroBTContainer({
    getClient: mockGetClientWithCapture,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  const result = await container._socketControl('-1', '-1', true)

  t.ok(result.success)
  t.ok(writeCalls.length > 0)
})

test('MicroBTContainer - _socketControl with specific PDU', async (t) => {
  const writeCalls = []
  const mockClientWithCapture = {
    ...mockClient,
    write: (code, address, value) => {
      writeCalls.push({ code, address, value })
      return Promise.resolve(Buffer.from([0x01, 0x02]))
    }
  }

  const mockGetClientWithCapture = () => mockClientWithCapture

  const container = new MicroBTContainer({
    getClient: mockGetClientWithCapture,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  const result = await container._socketControl('01', '-1', false)

  t.ok(result.success)
  t.ok(writeCalls.length > 0)
})

test('MicroBTContainer - _socketControl with specific socket', async (t) => {
  const writeCalls = []
  const mockClientWithCapture = {
    ...mockClient,
    write: (code, address, value) => {
      writeCalls.push({ code, address, value })
      return Promise.resolve(Buffer.from([0x01, 0x02]))
    }
  }

  const mockGetClientWithCapture = () => mockClientWithCapture

  const container = new MicroBTContainer({
    getClient: mockGetClientWithCapture,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  const result = await container._socketControl('01', '5', true)

  t.ok(result.success)
  t.is(writeCalls.length, 1)
  t.is(writeCalls[0].address, 304) // 309 - 5
  t.is(writeCalls[0].value, 1) // enabled = true
})

test('MicroBTContainer - switchSocket calls _socketControl for each operation', async (t) => {
  const socketControlCalls = []
  const container = new MicroBTContainer({
    getClient: mockGetClient,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  // Mock _socketControl to track calls
  container._socketControl = async (...args) => {
    socketControlCalls.push(args)
    return { success: true }
  }

  const operations = [
    ['01', '5', true],
    ['02', '10', false]
  ]

  const result = await container.switchSocket(operations)

  t.ok(result.success)
  t.is(socketControlCalls.length, 2)
  t.alike(socketControlCalls[0], ['01', '5', true])
  t.alike(socketControlCalls[1], ['02', '10', false])
})

test('MicroBTContainer - switchContainer calls _writeSingleRegister', async (t) => {
  const writeCalls = []
  const mockClientWithCapture = {
    ...mockClient,
    write: (code, address, value) => {
      writeCalls.push({ code, address, value })
      return Promise.resolve(Buffer.from([0x01, 0x02]))
    }
  }

  const mockGetClientWithCapture = () => mockClientWithCapture

  const container = new MicroBTContainer({
    getClient: mockGetClientWithCapture,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  const result = await container.switchContainer(true)

  t.ok(result.success)
  t.is(writeCalls.length, 1)
  t.is(writeCalls[0].address, 601)
  t.is(writeCalls[0].value, 1)
})

test('MicroBTContainer - switchCoolingSystem delegates to switchContainer', async (t) => {
  let switchContainerCalled = false
  const container = new MicroBTContainer({
    getClient: mockGetClient,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  // Mock switchContainer to track calls
  container.switchContainer = async (enabled) => {
    switchContainerCalled = enabled
    return { success: true }
  }

  const result = await container.switchCoolingSystem(false)

  t.ok(result.success)
  t.is(switchContainerCalled, false)
})

test('MicroBTContainer - setCoolingFanThreshold with all parameters', async (t) => {
  const writeCalls = []
  const mockClientWithCapture = {
    ...mockClient,
    write: (code, address, value) => {
      writeCalls.push({ code, address, value })
      return Promise.resolve(Buffer.from([0x01, 0x02]))
    }
  }

  const mockGetClientWithCapture = () => mockClientWithCapture

  const container = new MicroBTContainer({
    getClient: mockGetClientWithCapture,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  const thresholds = {
    runningSpeed: 50,
    startTemp: 25.5,
    stopTemp: 20.0
  }

  const result = await container.setCoolingFanThreshold(thresholds)

  t.ok(result.success)
  t.is(writeCalls.length, 3)

  // Check running speed (613)
  const runningSpeedCall = writeCalls.find(call => call.address === 613)
  t.ok(runningSpeedCall)
  t.is(runningSpeedCall.value, 5000) // 50 * 100

  // Check start temp (614)
  const startTempCall = writeCalls.find(call => call.address === 614)
  t.ok(startTempCall)
  t.is(startTempCall.value, 2550) // 25.5 * 100

  // Check stop temp (615)
  const stopTempCall = writeCalls.find(call => call.address === 615)
  t.ok(stopTempCall)
  t.is(stopTempCall.value, 2000) // 20.0 * 100
})

test('MicroBTContainer - setCoolingFanThreshold with partial parameters', async (t) => {
  const writeCalls = []
  const mockClientWithCapture = {
    ...mockClient,
    write: (code, address, value) => {
      writeCalls.push({ code, address, value })
      return Promise.resolve(Buffer.from([0x01, 0x02]))
    }
  }

  const mockGetClientWithCapture = () => mockClientWithCapture

  const container = new MicroBTContainer({
    getClient: mockGetClientWithCapture,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  const thresholds = {
    startTemp: 30.0
    // Only startTemp provided
  }

  const result = await container.setCoolingFanThreshold(thresholds)

  t.ok(result.success)
  t.is(writeCalls.length, 1)
  t.is(writeCalls[0].address, 614)
  t.is(writeCalls[0].value, 3000) // 30.0 * 100
})

test('MicroBTContainer - setCoolingFanThreshold with empty thresholds', async (t) => {
  const container = new MicroBTContainer({
    getClient: mockGetClient,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  const result = await container.setCoolingFanThreshold({})

  t.ok(result.success)
})

test('MicroBTContainer - getSystemErrorInformation maps active bits to error names', async (t) => {
  const sysErrBuf = Buffer.alloc(20)
  sysErrBuf[0] = 0xc0 // bits 0 and 1 set
  const client = {
    ...mockClient,
    read: () => Promise.resolve(sysErrBuf)
  }

  const container = new MicroBTContainer({
    getClient: () => client,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  const errors = await container.getSystemErrorInformation()
  t.is(errors.length, 2)
  t.ok(errors.some((e) => e.name === 'low_inlet_pressure_circ_pump'))
  t.ok(errors.some((e) => e.name === 'low_outlet_pressure_circ_pump'))
})

test('MicroBTContainer - getSystemErrorInformation returns empty when no bits set', async (t) => {
  const client = {
    ...mockClient,
    read: () => Promise.resolve(Buffer.alloc(20))
  }

  const container = new MicroBTContainer({
    getClient: () => client,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  const errors = await container.getSystemErrorInformation()
  t.is(errors.length, 0)
})

test('MicroBTContainer - getGeneralErrorInformation maps active bits to error names', async (t) => {
  const genBuf = Buffer.alloc(10)
  genBuf[0] = 0xe0 // bits 0, 1, 2 set
  const client = {
    ...mockClient,
    read: () => Promise.resolve(genBuf)
  }

  const container = new MicroBTContainer({
    getClient: () => client,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  const errors = await container.getGeneralErrorInformation()
  t.is(errors.length, 3)
  t.ok(errors.some((e) => e.name === 'outdoor_ambient_temp_sensor_fault'))
  t.ok(errors.some((e) => e.name === 'indoor_temp_humidity_sensor_fault'))
  t.ok(errors.some((e) => e.name === 'makeup_water_pump_fault'))
})

test('MicroBTContainer - getGeneralErrorInformation returns empty when no bits set', async (t) => {
  const client = {
    ...mockClient,
    read: () => Promise.resolve(Buffer.alloc(10))
  }

  const container = new MicroBTContainer({
    getClient: () => client,
    address: getRandomIP(),
    port: 502,
    username: 'admin',
    password
  })

  const errors = await container.getGeneralErrorInformation()
  t.is(errors.length, 0)
})
