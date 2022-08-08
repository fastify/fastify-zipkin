import { FastifyPluginCallback } from 'fastify'
import { Recorder, Tracer } from 'zipkin'

interface FastifyZipkinOptions {
  serviceName: string;
  httpReporterUrl: string;
  servicePort?: number;
  recorder?: Recorder;
  tracer?: Tracer;
}

declare const fastifyZipkin: FastifyPluginCallback<FastifyZipkinOptions>
export default fastifyZipkin
