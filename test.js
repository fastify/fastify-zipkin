'use strict'

const test = require('tap').test
const sinon = require('sinon')
const Fastify = require('fastify')
const zipkinPlugin = require('./index')
const zipkin = require('zipkin')
const Tracer = zipkin.Tracer
const ExplicitContext = zipkin.ExplicitContext

test('Should register the hooks and trace the request', t => {
  const fastify = Fastify()

  const record = sinon.spy()
  const recorder = { record }
  const ctxImpl = new ExplicitContext()
  const serviceName = 'test'
  const tracer = new Tracer({ recorder, ctxImpl })

  ctxImpl.scoped(() => {
    fastify.register(zipkinPlugin, { tracer, serviceName })

    fastify.get('/', (req, reply) => {
      reply.code(201).send({ hello: 'world' })
    })

    fastify.inject({
      url: '/',
      method: 'GET',
      headers: {
        'X-B3-TraceId': 'aaa',
        'X-B3-SpanId': 'bbb',
        'X-B3-Flags': '1'
      }
    }, (err, res) => {
      t.error(err)

      const annotations = record.args.map((args) => args[0])
      annotations.forEach((ann) => t.strictEqual(ann.traceId.traceId, 'aaa'))
      annotations.forEach((ann) => t.strictEqual(ann.traceId.spanId, 'bbb'))
      t.strictEqual(annotations[0].annotation.annotationType, 'ServiceName')
      t.strictEqual(annotations[0].annotation.serviceName, serviceName)
      t.strictEqual(annotations[1].annotation.annotationType, 'Rpc')
      t.strictEqual(annotations[1].annotation.name, 'GET')
      t.strictEqual(annotations[2].annotation.annotationType, 'BinaryAnnotation')
      t.strictEqual(annotations[2].annotation.key, 'http.url')
      t.strictEqual(annotations[2].annotation.value, '/')
      t.strictEqual(annotations[3].annotation.annotationType, 'ServerRecv')
      t.strictEqual(annotations[4].annotation.annotationType, 'LocalAddr')
      t.strictEqual(annotations[5].annotation.annotationType, 'BinaryAnnotation')
      t.strictEqual(annotations[5].annotation.key, 'X-B3-Flags')
      t.strictEqual(annotations[5].annotation.value, '1')
      t.strictEqual(annotations[6].annotation.annotationType, 'BinaryAnnotation')
      t.strictEqual(annotations[6].annotation.key, 'http.status_code')
      t.strictEqual(annotations[6].annotation.value, '' + res.statusCode)
      t.strictEqual(annotations[7].annotation.annotationType, 'ServerSend')

      t.end()
    })
  })
})

test('Should register the hooks and trace the request (404)', t => {
  const fastify = Fastify()

  const record = sinon.spy()
  const recorder = { record }
  const ctxImpl = new ExplicitContext()
  const serviceName = 'test'
  const tracer = new Tracer({ recorder, ctxImpl })

  ctxImpl.scoped(() => {
    fastify.register(zipkinPlugin, { tracer, serviceName })

    fastify.inject({
      url: '/404',
      method: 'GET'
    }, (err, res) => {
      t.error(err)

      const annotations = record.args.map((args) => args[0])
      t.strictEqual(annotations[5].annotation.annotationType, 'BinaryAnnotation')
      t.strictEqual(annotations[5].annotation.key, 'http.status_code')
      t.strictEqual(annotations[5].annotation.value, '' + res.statusCode)

      t.end()
    })
  })
})

test('Should handle querystrings', t => {
  const fastify = Fastify()

  const record = sinon.spy()
  const recorder = { record }
  const ctxImpl = new ExplicitContext()
  const serviceName = 'test'
  const tracer = new Tracer({ recorder, ctxImpl })

  ctxImpl.scoped(() => {
    fastify.register(zipkinPlugin, { tracer, serviceName })

    fastify.get('/', (req, reply) => {
      reply.send({ hello: 'world' })
    })

    fastify.inject({
      url: '/?foo=bar',
      method: 'GET'
    }, (err, res) => {
      t.error(err)

      const annotations = record.args.map((args) => args[0])
      t.strictEqual(annotations[2].annotation.annotationType, 'BinaryAnnotation')
      t.strictEqual(annotations[2].annotation.key, 'http.url')
      t.strictEqual(annotations[2].annotation.value, '/?foo=bar')

      t.end()
    })
  })
})

test('Should record a reasonably accurate span duration', t => {
  const fastify = Fastify()

  const record = sinon.spy()
  const recorder = { record }
  const ctxImpl = new ExplicitContext()
  const serviceName = 'test'
  const tracer = new Tracer({ recorder, ctxImpl })
  const PAUSE_TIME_MILLIS = 100

  ctxImpl.scoped(() => {
    fastify.register(zipkinPlugin, { tracer, serviceName })

    fastify.get('/', (req, reply) => {
      setTimeout(() => {
        reply.send({ hello: 'world' })
      }, PAUSE_TIME_MILLIS)
    })

    fastify.inject({
      url: '/',
      method: 'GET'
    }, (err, res) => {
      t.error(err)

      const annotations = record.args.map((args) => args[0])
      const serverRecvTs = annotations[3].timestamp / 1000.0
      const serverSendTs = annotations[6].timestamp / 1000.0
      const durationMillis = (serverSendTs - serverRecvTs)
      t.ok(durationMillis >= PAUSE_TIME_MILLIS)

      t.end()
    })
  })
})
