const express = require('express')
const cors = require('cors')
const path = require('path')
const pinoHttp = require('pino-http')

const logger = require('./utils/logger')('App')
const userRouter = require('./routes/user')

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(pinoHttp({
  logger,
  serializers: {
    req (req) {
      req.body = req.raw.body
      return req
    }
  }
}))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/users', userRouter)

//404
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  req.log.error(err)
  res.status(500).json({
    status: 'error',
    message: '伺服器錯誤'
  })
})

module.exports = app
