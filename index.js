'use strict'

const url = require('url')
const fp = require('fastify-plugin')
const zipkin = require('zipkin')
const assert = require('assert')

const Some = zipkin.option.Some
const None = zipkin.option.None
const Instrumentation = zipkin.Instrumentation

const { Tracer, BatchRecorder, jsonEncoder: { JSON_V2 } } = require('zipkin')
const { HttpLogger } = require('zipkin-transport-http')
const CLSContext = require('zipkin-context-cls')

function zipkinPlugin (fastify, opts, next) {
  assert(opts.serviceName, 'serviceName option should not be empty')

  const recorder = new BatchRecorder({
    logger: new HttpLogger({
      endpoint: `${opts.zipkinUrl}/api/v2/spans`,
      jsonEncoder: JSON_V2
    })
  })

  const ctxImpl = new CLSContext('zipkin')
  const tracer = new Tracer({ ctxImpl, recorder, localServiceName: opts.serviceName })

  const instrumentation = new Instrumentation.HttpServer({
    tracer: opts.tracer || tracer,
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
      var id = instrumentation.recordRequest(
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
      instrumentation.recordResponse(
        reply._zipkinId,
        reply.res.statusCode
      )
    })
    done()
  }

  function readHeader (header) {
    var val = this[header.toLowerCase()]
    if (val != null) return new Some(val)
    return None
  }
  next()
}

function basic404 (req, reply) {
  reply.code(404).send(new Error('Not found'))
}

module.exports = fp(zipkinPlugin, {
  fastify: '>= 2',
  name: 'fastify-zipkin'
})
