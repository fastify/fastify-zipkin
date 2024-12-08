import Fastify from 'fastify'
import { expectError } from 'tsd'
import { ConsoleRecorder, ExplicitContext, Tracer } from 'zipkin'
import zipkinPlugin from '..'

const fastify = Fastify()

expectError(fastify.register(zipkinPlugin, { httpReporterUrl: 'a' }))
expectError(fastify.register(zipkinPlugin, { serviceName: 'a' }))
expectError(fastify.register(zipkinPlugin, { serviceName: 1, httpReporterUrl: '' }))

fastify.register(zipkinPlugin, { serviceName: 'test', httpReporterUrl: 'http://' })
fastify.register(zipkinPlugin, { serviceName: 'test', httpReporterUrl: 'http://', servicePort: 0 })
fastify.register(zipkinPlugin, { serviceName: 'test', httpReporterUrl: 'http://', recorder: new ConsoleRecorder() })
fastify.register(zipkinPlugin, {
  serviceName: 'test',
  httpReporterUrl: 'http://',
  tracer: new Tracer({
    ctxImpl: new ExplicitContext(),
    recorder: new ConsoleRecorder()
  })
})
