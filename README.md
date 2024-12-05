# @fastify/zipkin

[![CI](https://github.com/fastify/fastify-zipkin/actions/workflows/ci.yml/badge.svg?branch=master)](https://github.com/fastify/fastify-zipkin/actions/workflows/ci.yml)
[![NPM version](https://img.shields.io/npm/v/@fastify/zipkin.svg?style=flat)](https://www.npmjs.com/package/@fastify/zipkin)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://standardjs.com/)

Fastify plugin for [Zipkin](https://zipkin.io/) distributed tracing system.

## Install
```
npm i @fastify/zipkin
```

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
