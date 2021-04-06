# fastify-zipkin

[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](http://standardjs.com/)

Fastify plugin for Zipkin distributed tracing system.

## Install
```
npm i fastify-zipkin --save
```

## Usage
Require the plugin and register it within Fastify, the pass the following options: `{ tracer, serviceName [, servicePort] }`

```js
const fastify = require('fastify')()

fastify.register(require('fastify-zipkin'), {
  serviceName: 'my-service-name',
  servicePort: 3000,
  httpReporterUrl: 'http://localhost:9411/api/v2/spans'
})

fastify.get('/', (req, reply) => {
  reply.send({ hello: 'world' })
})

fastify.listen(3000, err => {
  if (err) throw err
  console.log('Server listenting on localhost:', fastify.server.address().port)
})
```

## License

Licensed under [MIT](./LICENSE).
