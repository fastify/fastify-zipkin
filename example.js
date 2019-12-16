'use strict'

const fastify = require('fastify')()

fastify.register(require('./index'), {
  serviceName: 'test',
  servicePort: '3000',
  zipkinUrl: 'http://localhost:9411'
})

fastify.get('/', (req, reply) => {
  reply.send({ hello: 'world' })
})

fastify.listen(3000, err => {
  if (err) throw err
  console.log('Server listenting on localhost:', fastify.server.address().port)
})
