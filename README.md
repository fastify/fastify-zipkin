# @fastify/zipkin

[![CI](https://github.com/fastify/fastify-zipkin/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/fastify/fastify-zipkin/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/@fastify/zipkin.svg?style=flat)](https://www.npmjs.com/package/@fastify/zipkin)
[![neostandard javascript style](https://img.shields.io/badge/code_style-neostandard-brightgreen?style=flat)](https://github.com/neostandard/neostandard)

Fastify plugin for [Zipkin](https://zipkin.io/) distributed tracing system.

## Install
```
npm i @fastify/zipkin
```

### Compatibility
| Plugin version | Fastify version |
| ---------------|-----------------|
| `>=4.x`        | `^5.x`          |
| `^3.x`         | `^4.x`          |
| `^3.x`         | `^3.x`          |


Please note that if a Fastify version is out of support, then so are the corresponding versions of this plugin
in the table above.
See [Fastify's LTS policy](https://github.com/fastify/fastify/blob/main/docs/Reference/LTS.md) for more details.


## Usage
Require the plugin and register it within Fastify, then pass the following options: `{ serviceName, httpReporterUrl [, servicePort , tracer, recorder ] }`

```js
const fastify = require('fastify')()

fastify.register(require('@fastify/zipkin'), {
  serviceName: 'my-service-name',
  servicePort: 3000,
  httpReporterUrl: 'http://localhost:9411/api/v2/spans'
})

fastify.get('/', (req, reply) => {
  reply.send({ hello: 'world' })
})

fastify.listen({ port: 3000 }, err => {
  if (err) throw err
  console.log('Server listenting on localhost:', fastify.server.address().port)
})
```

## License

Licensed under [MIT](./LICENSE).
