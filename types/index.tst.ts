import Fastify from 'fastify'
import { expect } from 'tstyche'
import { ConsoleRecorder, ExplicitContext, Tracer } from 'zipkin'
import zipkinPlugin from '..'

const fastify = Fastify()

expect(fastify.register).type.not.toBeCallableWith(zipkinPlugin, {
  httpReporterUrl: 'a'
})
expect(fastify.register).type.not.toBeCallableWith(zipkinPlugin, { serviceName: 'a' })
expect(fastify.register).type.not.toBeCallableWith(zipkinPlugin, {
  serviceName: 1,
  httpReporterUrl: ''
})

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
