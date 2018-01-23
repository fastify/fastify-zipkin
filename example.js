'use strict'

const fastify = require('fastify')()
const { Tracer, BatchRecorder, jsonEncoder: { JSON_V2 } } = require('zipkin')
const { HttpLogger } = require('zipkin-transport-http')
const CLSContext = require('zipkin-context-cls')

const zipkinBaseUrl = 'http://localhost:9411'
const recorder = new BatchRecorder({
  logger: new HttpLogger({
    endpoint: `${zipkinBaseUrl}/api/v2/spans`,
    jsonEncoder: JSON_V2
  })
})

const ctxImpl = new CLSContext('zipkin')
const localServiceName = 'fastify'
const tracer = new Tracer({ ctxImpl, recorder, localServiceName })

fastify.register(require('./index'), { tracer })

fastify.get('/', (req, reply) => {
  reply.send({ hello: 'world' })
})

fastify.listen(3000, err => {
  if (err) throw err
  console.log('Server listenting on localhost:', fastify.server.address().port)
})
