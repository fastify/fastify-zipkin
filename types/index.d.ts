import { FastifyPluginCallback } from 'fastify';
import { Recorder, Tracer } from 'zipkin';

type FastifyZipkin = FastifyPluginCallback<fastifyZipkin.FastifyZipkinOptions>;

declare namespace fastifyZipkin {
  export interface FastifyZipkinOptions {
    serviceName: string;
    httpReporterUrl: string;
    servicePort?: number;
    recorder?: Recorder;
    tracer?: Tracer;
  }

  export const fastifyZipkin: FastifyZipkin
  export { fastifyZipkin as default }

}

declare function fastifyZipkin(...params: Parameters<FastifyZipkin>): ReturnType<FastifyZipkin>
export = fastifyZipkin
