const express = require('express')
const http = require('http')
const WebSocket = require('ws')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const { OpenAI } = require('openai')
require('dotenv').config()

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const app = express()
const server = http.createServer(app)
const wss = new WebSocket.Server({ server })

app.use(express.static(path.join(__dirname, 'public')))

let mobileSocket = null
let esp32Socket = null;
let viewerSockets = new Set();

wss.on('connection', (ws) => {
  console.log('Novo cliente WebSocket conectado')

  ws.on('message', async (message) => {
    try {
      const parsed = JSON.parse(message)

      if (parsed.type === 'register') {
        if (parsed.role === 'mobile') {
          mobileSocket = ws
          console.log('Celular registrado')
        } else if (parsed.role === 'esp32') {
            esp32Socket = ws;
          console.log('ESP32 registrado')
        }  else if (parsed.role === 'viewer') {
          viewerSockets.add(ws);
          console.log('Novo visualizador de stream registrado.');
        }
      }

      if (parsed.type === 'image') {
        console.log('Imagem recebida do ESP32')

        const imageBuffer = Buffer.from(parsed.data, 'base64')
        const description = await getDescriptionFromOpenAI(imageBuffer)
        const audioBuffer = await generateAudio(description)

        if (mobileSocket && mobileSocket.readyState === WebSocket.OPEN) {
          mobileSocket.send(JSON.stringify({
            type: 'audio',
            data: audioBuffer.toString('base64')
          }))
          console.log('Áudio enviado ao celular')
        }
      }

      if (parsed.type === 'video_frame') {
        const imageBuffer = Buffer.from(parsed.data, 'base64');
        viewerSockets.forEach(socket => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.send(imageBuffer);
            }
        });

      }

    } catch (err) {
      console.error('Erro ao processar mensagem:', err)
    }
  })

  ws.on('close', () => {
    if (ws === mobileSocket) {
      mobileSocket = null
      console.log('Celular desconectado')
    } else if (ws === esp32Socket) {
        esp32Socket = null;
        console.log('ESP32 desconectado.');
    } else if (viewerSockets.has(ws)) {
        viewerSockets.delete(ws);
        console.log('Visualizador de stream desconectado.');
    }
  })
})

// função OpenAI Vision
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
              text: 'Você é um assistente visual para pessoas com deficiência visual. Sua tarefa é descrever a imagem fornecida de forma clara e concisa. Concentre-se nos elementos essenciais e na ação principal da imagem. Ignore cores e detalhes minuciosos, a menos que sejam absolutamente necessários para o entendimento da cena. Não descreva o fundo ou elementos decorativos que não contribuam para a compreensão geral do que está acontecendo. Sua resposta deve ser direta e objetiva, fornecendo apenas as informações mais importantes.'
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

// função TTS
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
