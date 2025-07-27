const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const axios = require('axios')
const fs = require('fs')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const { OpenAI } = require('openai')

require('dotenv').config()



const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: '*'
  }
})

app.use(express.static(path.join(__dirname, 'public')))

let mobileSocket = null

io.on('connection', (socket) => {
  console.log('Novo cliente conectado:', socket.id)

  // Identifica se é o celular ou o ESP32
  socket.on('register', (data) => {
    if (data === 'mobile') {
      mobileSocket = socket
      console.log('Celular conectado')
    } else if (data === 'esp32') {
      console.log('ESP32 conectado')
    }
  })

  // Recebe imagem do ESP32
  socket.on('image', async (imageBase64) => {
    try {
      console.log('Imagem recebida do ESP32')

      const imageBuffer = Buffer.from(imageBase64, 'base64')

      // 1. Enviar para API da OpenAI (ex: GPT-4 Vision)
      const description = await getDescriptionFromOpenAI(imageBuffer)

      // 2. Gerar áudio com API de TTS (exemplo fictício)
      const audioBuffer = await generateAudio(description)

      // 3. Enviar para celular
      if (mobileSocket) {
        mobileSocket.emit('audio', audioBuffer.toString('base64'))
        console.log('Áudio enviado para celular')
      }

    } catch (error) {
      console.error('Erro no processamento da imagem:', error)
    }
  })

  socket.on('disconnect', () => {
    if (socket === mobileSocket) {
      console.log('Celular desconectado')
      mobileSocket = null
    } else {
      console.log('Cliente desconectado:', socket.id)
    }
  })
})

// integração com API da OpenAI
async function getDescriptionFromOpenAI(imageBuffer) {
  try {
    const base64Image = imageBuffer.toString('base64')

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Descreva a imagem de forma clara e objetiva, como se estivesse explicando para uma pessoa com deficiência visual.'
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 100
    })

    const description = response.choices[0].message.content
    console.log('Descrição gerada:', description)
    return description
  } catch (error) {
    console.error('Erro na descrição da imagem:', error)
    return 'Não foi possível descrever a imagem.'
  }
}

// geração de áudio (TTS)
async function generateAudio(text) {
  try {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: text
    })

    const audioBuffer = Buffer.from(await response.arrayBuffer())
    return audioBuffer
  } catch (error) {
    console.error('Erro ao gerar áudio:', error)
    return fs.readFileSync('./audio-exemplo.mp3')
  }
}


const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`Servidor ouvindo na porta ${PORT}`)
})
