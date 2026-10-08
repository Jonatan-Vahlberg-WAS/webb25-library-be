import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { prettyJSON } from 'hono/pretty-json'

import books from './routes/books.js'
import loans from './routes/loans.js'
import auth from './routes/auth.js'

const app = new Hono({ strict: false })

app.use(prettyJSON())

app.get('/', (c) => {
  return c.json({
    name: "Library"
  })
})

app.route("/books", books)
app.route("/loans", loans)
app.route("/auth", auth)

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})
