import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api', (req, res) => {
  res.json({ message: 'API funcionando' })
})

app.get('/api/test', (req, res) => {
  res.json({ msg: 'prueba de api' })
})

export default app