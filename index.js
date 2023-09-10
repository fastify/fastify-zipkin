'use strict'

const { HttpLogger } = require('zipkin-transport-http')
const {
  Tracer,
  BatchRecorder,
  jsonEncoder: { JSON_V2 }
} = require('zipkin')
const assert = require('node:assert')
const CLSContext = require('zipkin-context-cls')
const fp = require('fastify-plugin')
const url = require('node:url')
const zipkin = require('zipkin')

const Some = zipkin.option.Some
const None = zipkin.option.None
const Instrumentation = zipkin.Instrumentation

function fastifyZipkin (fastify, opts, next) {
  assert(opts.serviceName, 'serviceName option should not be empty')
  assert(opts.httpReporterUrl, 'httpReporterUrl option should not be empty')

  const ctxImpl = new CLSContext('zipkin')

  const recorder = opts.recorder || new BatchRecorder({
    logger: new HttpLogger({
      endpoint: opts.httpReporterUrl,
      jsonEncoder: JSON_V2
    })
  })

  const tracer = opts.tracer || new Tracer({
    ctxImpl,
    recorder,
    localServiceName: opts.serviceName
  })

  const instrumentation = new Instrumentation.HttpServer({
    tracer,
    serviceName: opts.serviceName,
    port: opts.servicePort || 0
  })

  try {
    // we must register a custom error handler
    // otherwise all the 404 requests
    // will not be catched by our hooks
    fastify.setNotFoundHandler(basic404)
  } catch (err) {
    // a custom error handler is already present
  }

  fastify.addHook('onRequest', onRequest)
  fastify.addHook('onResponse', onResponse)

  function onRequest (req, res, done) {
    tracer.scoped(() => {
      const id = instrumentation.recordRequest(
        req.raw.method,
        url.format(req.raw.url),
        readHeader.bind(req.headers)
      )
      res._zipkinId = id
      done()
    })
  }

  function onResponse (req, reply, done) {
    tracer.scoped(() => {
      instrumentation.recordResponse(reply._zipkinId, reply.raw.statusCode)
    })
    done()
  }

  function readHeader (header) {
    const val = this[header.toLowerCase()]
    if (val != null) return new Some(val)
    return None
  }
  next()
}

function basic404 (req, reply) {
  reply.code(404).send(new Error('Not found'))
}

module.exports = fp(fastifyZipkin, {
  fastify: '>=3.x',
  name: '@fastify/zipkin'
})
module.exports.default = fastifyZipkin
module.exports.fastifyZipkin = fastifyZipkin
