'use strict'

const url = require('url')
const fp = require('fastify-plugin')
const zipkin = require('zipkin')

const Some = zipkin.option.Some
const None = zipkin.option.None
const Instrumentation = zipkin.Instrumentation

function zipkinPlugin (fastify, opts, next) {
  const tracer = opts.tracer
  if (tracer == null) return next(new Error('No tracer specified'))

  const instrumentation = new Instrumentation.HttpServer({
    tracer: tracer,
    serviceName: opts.serviceName,
    port: opts.port || 0
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

  function onRequest (req, res, next) {
    tracer.scoped(() => {
      var id = instrumentation.recordRequest(
        req.method,
        url.format(req.url),
        readHeader.bind(req.headers)
      )
      res._zipkinId = id
      next()
    })
  }

  function onResponse (res, next) {
    tracer.scoped(() => {
      instrumentation.recordResponse(
        res._zipkinId,
        res.statusCode
      )
    })
    next()
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
  fastify: '>=0.40.0',
  name: 'fastify-zipkin'
})
