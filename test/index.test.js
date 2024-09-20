'use strict'

const { test } = require('node:test')
const sinon = require('sinon')
const Fastify = require('fastify')
const zipkinPlugin = require('..')
const zipkin = require('zipkin')
const Tracer = zipkin.Tracer
const ExplicitContext = zipkin.ExplicitContext
const { setTimeout: sleep } = require('node:timers/promises')

test('Should error when initializing the plugin without serviceName argument', async t => {
  const fastify = Fastify()

  const record = sinon.spy()
  const recorder = { record }
  const ctxImpl = new ExplicitContext()
  const tracer = new Tracer({ recorder, ctxImpl })
  const httpReporterUrl = 'http://0.0.0.0:9441/api/v2/spans'

  try {
    fastify.register(zipkinPlugin, { tracer, httpReporterUrl })
  } catch (e) {
    t.assert.strictEqual(e.message, 'serviceName option should not be empty')
  }
})

test('Should error when initializing the plugin without httpReporterUrl argument', async t => {
  const fastify = Fastify()

  const record = sinon.spy()
  const recorder = { record }
  const ctxImpl = new ExplicitContext()
  const tracer = new Tracer({ recorder, ctxImpl })
  const serviceName = 'test'

  try {
    fastify.register(zipkinPlugin, { tracer, serviceName })
  } catch (e) {
    t.assert.strictEqual(e.message, 'httpReporterUrl option should not be empty')
  }
})

test('Should error when initializing the plugin without httpReporterUrl argument', async t => {
  const fastify = Fastify()

  const record = sinon.spy()
  const recorder = { record }
  const ctxImpl = new ExplicitContext()
  const tracer = new Tracer({ recorder, ctxImpl })
  const serviceName = 'test'

  try {
    fastify.register(zipkinPlugin, { tracer, serviceName })
  } catch (e) {
    t.assert.equal(e.message, 'httpReporterUrl option should not be empty')
  }
})

test('Should register the hooks and trace the request', async t => {
  const fastify = Fastify()

  const record = sinon.spy()
  const recorder = { record }
  const ctxImpl = new ExplicitContext()
  const serviceName = 'test'
  const httpReporterUrl = 'http://0.0.0.0:9441/api/v2/spans'

  const tracer = new Tracer({ recorder, ctxImpl })

  await new Promise((resolve) => {
    ctxImpl.scoped(() => {
      fastify.register(zipkinPlugin, { tracer, serviceName, httpReporterUrl })

      fastify.get('/', (req, reply) => {
        reply.code(201).send({ hello: 'world' })
      })

      fastify.inject(
        {
          url: '/',
          method: 'GET',
          headers: {
            'X-B3-TraceId': 'aaa',
            'X-B3-SpanId': 'bbb',
            'X-B3-Flags': '1'
          }
        },
        (err, res) => {
          t.assert.ifError(err)

          const annotations = record.args.map(args => args[0])
          annotations.forEach(ann => t.assert.strictEqual(ann.traceId.traceId, 'aaa'))
          annotations.forEach(ann => t.assert.strictEqual(ann.traceId.spanId, 'bbb'))
          t.assert.strictEqual(annotations[0].annotation.annotationType, 'ServiceName')
          t.assert.strictEqual(annotations[0].annotation.serviceName, serviceName)
          t.assert.strictEqual(annotations[1].annotation.annotationType, 'Rpc')
          t.assert.strictEqual(annotations[1].annotation.name, 'GET')
          t.assert.strictEqual(
            annotations[2].annotation.annotationType,
            'BinaryAnnotation'
          )
          t.assert.strictEqual(annotations[2].annotation.key, 'http.path')
          t.assert.strictEqual(annotations[2].annotation.value, '/')
          t.assert.strictEqual(annotations[3].annotation.annotationType, 'ServerRecv')
          t.assert.strictEqual(annotations[4].annotation.annotationType, 'LocalAddr')
          t.assert.strictEqual(
            annotations[5].annotation.annotationType,
            'BinaryAnnotation'
          )
          t.assert.strictEqual(annotations[5].annotation.key, 'http.status_code')
          t.assert.strictEqual(annotations[5].annotation.value, '201')
          t.assert.strictEqual(annotations[6].annotation.annotationType, 'ServerSend')
          resolve()
        }
      )
    })
  })
})

test('Should register the hooks and trace the request (404)', async t => {
  const fastify = Fastify()

  const record = sinon.spy()
  const recorder = { record }
  const ctxImpl = new ExplicitContext()
  const serviceName = 'test'
  const tracer = new Tracer({ recorder, ctxImpl })
  const httpReporterUrl = 'http://0.0.0.0:9441/api/v2/spans'

  await new Promise((resolve) => {
    ctxImpl.scoped(async () => {
      await fastify.register(zipkinPlugin, { tracer, serviceName, httpReporterUrl })

      fastify.inject(
        {
          url: '/404',
          method: 'GET'
        },
        (err, res) => {
          t.assert.ifError(err)

          const annotations = record.args.map(args => args[0])
          t.assert.strictEqual(
            annotations[5].annotation.annotationType,
            'BinaryAnnotation'
          )
          t.assert.strictEqual(annotations[5].annotation.key, 'http.status_code')
          t.assert.strictEqual(annotations[5].annotation.value, '' + res.statusCode)

          resolve()
        }
      )
    })
  })
})

test('Should record a reasonably accurate span duration', async t => {
  const fastify = Fastify()

  const record = sinon.spy()
  const recorder = { record }
  const ctxImpl = new ExplicitContext()
  const serviceName = 'test'
  const httpReporterUrl = 'http://0.0.0.0:9441/api/v2/spans'
  const tracer = new Tracer({ recorder, ctxImpl })
  const PAUSE_TIME_MILLIS = 100

  await new Promise((resolve) => {
    ctxImpl.scoped(async () => {
      await fastify.register(zipkinPlugin, { tracer, serviceName, httpReporterUrl })

      fastify.get('/', async (req, reply) => {
        await sleep(PAUSE_TIME_MILLIS)
        reply.send({ hello: 'world' })
      })

      fastify.inject(
        {
          url: '/',
          method: 'GET'
        },
        (err, res) => {
          t.assert.ifError(err)

          const annotations = record.args.map(args => args[0])
          const serverRecvTs = annotations[3].timestamp / 1000.0
          const serverSendTs = annotations[6].timestamp / 1000.0
          const durationMillis = serverSendTs - serverRecvTs
          t.assert.ok(durationMillis >= PAUSE_TIME_MILLIS)

          resolve()
        }
      )
    })
  })
})

test('Should record a reasonably accurate span duration with custom recorder', async t => {
  const fastify = Fastify()
  fastify.setNotFoundHandler(() => {})

  const record = sinon.spy()
  const recorder = { record }
  const ctxImpl = new ExplicitContext()
  const serviceName = 'test'
  const httpReporterUrl = 'http://0.0.0.0:9441/api/v2/spans'
  const PAUSE_TIME_MILLIS = 100

  await new Promise((resolve) => {
    ctxImpl.scoped(async () => {
      await fastify.register(zipkinPlugin, { recorder, serviceName, httpReporterUrl })

      fastify.get('/', async (req, reply) => {
        await sleep(PAUSE_TIME_MILLIS)
        reply.send({ hello: 'world' })
      })

      fastify.inject(
        {
          url: '/',
          method: 'GET'
        },
        (err, res) => {
          t.assert.ifError(err)

          const annotations = record.args.map(args => args[0])
          const serverRecvTs = annotations[3].timestamp / 1000.0
          const serverSendTs = annotations[6].timestamp / 1000.0
          const durationMillis = serverSendTs - serverRecvTs
          t.assert.ok(durationMillis >= PAUSE_TIME_MILLIS)

          resolve()
        }
      )
    })
  })
})
