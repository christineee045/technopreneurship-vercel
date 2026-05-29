import express from 'express'
import { createProxyMiddleware } from 'http-proxy-middleware'

const app = express()

const USER_TARGET = process.env.USER_TARGET || 'http://localhost:5173'
const ADMIN_TARGET = process.env.ADMIN_TARGET || 'http://localhost:5174'
const PORT = process.env.PORT || 3000

// Proxy /admin -> admin app (strip /admin prefix)
app.use(
  '/admin',
  createProxyMiddleware({
    target: ADMIN_TARGET,
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/admin': '' },
  })
)

// Proxy everything else to the user app
app.use(
  '/',
  createProxyMiddleware({
    target: USER_TARGET,
    changeOrigin: true,
    ws: true,
  })
)

app.listen(PORT, () => {
  console.log(`Proxy running at http://localhost:${PORT}`)
  console.log(`-> /     -> ${USER_TARGET}`)
  console.log(`-> /admin -> ${ADMIN_TARGET}`)
})
