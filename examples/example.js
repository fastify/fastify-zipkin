'use strict'

const fastify = require('fastify')()

fastify.register(require('..'), {
  serviceName: 'test',
  servicePort: '3000',
  httpReporterUrl: 'http://localhost:9411/api/v2/spans'
})

fastify.get('/', (req, reply) => {
  reply.send({ hello: 'world' })
})

fastify.listen({ port: 3000 }, err => {
  if (err) throw err
  console.log('Server listenting on localhost:', fastify.server.address().port)
})
