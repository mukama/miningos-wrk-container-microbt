'use strict'

const { switchSocketExecutor } = require('@tetherto/miningos-tpl-wrk-container/tests/executors')

module.exports = (v) => {
  v.switchSocketOnBatch.stages[1].wait = 5000
  v.switchSocketOnBatch.stages[0].executor = switchSocketExecutor([['1', '1', true], ['2', '2', true]])
  v.switchSocketOffBatch.stages[1].wait = 8000
  v.switchSocketOffBatch.stages[0].executor = switchSocketExecutor([['1', '1', false], ['2', '2', false]])
}
