import express from 'express'
import cors from 'cors'
import AppDataSource from './database.js'

const app = express()
app.use(cors())
app.use(express.json())
// TODO : Crear los endpoints para la tabla de Usuario
app.get('/api', async (req, res) => {
  
  await AppDataSource.initialize();
  console.log("📦 Base de datos inicializada");
  
  res.json({ message: 'API funcionando' })
})

app.get('/api/test', (req, res) => {
  res.json({ msg: 'prueba de api' })
})


export default app