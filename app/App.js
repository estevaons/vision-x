import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, StatusBar, Animated, Easing } from 'react-native'
import { Audio } from 'expo-av'
import { MaterialCommunityIcons } from '@expo/vector-icons'

// Altere para o seu domínio/porta se necessário
// const socketUrl = 'wss://vision-x-kdog.onrender.com' // use wss:// se for HTTPS
const socketUrl = 'ws://172.21.28.223:3001'


export default function App() {
  const [isPlaying, setIsPlaying] = useState(false)
  const pulseAnim = useRef(new Animated.Value(1)).current
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    const ws = new WebSocket(socketUrl)

    socketRef.current = ws

    ws.onopen = () => {
      console.log('Conectado ao servidor WebSocket')
      ws.send(JSON.stringify({ type: 'register', role: 'mobile' }))
    }

    ws.onmessage = async (message) => {
      try {
        const data = JSON.parse(message.data)

        if (data.type === 'audio') {
          const base64Audio = data.data
          const audioUri = `data:audio/mp3;base64,${base64Audio}`

          const sound = new Audio.Sound()
          await sound.loadAsync({ uri: audioUri })
          setIsPlaying(true)
          animatePulse()

          await sound.playAsync()
          sound.setOnPlaybackStatusUpdate((status) => {
            if (status.didJustFinish) {
              setIsPlaying(false)
              pulseAnim.setValue(1)
              sound.unloadAsync()
            }
          })
        }
      } catch (error) {
        console.error('Erro ao processar mensagem:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('Erro no WebSocket:', error)
    }

    ws.onclose = () => {
      console.log('Conexão WebSocket encerrada')
    }

    return () => {
      ws.close()
    }
  }, [])

  const animatePulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start()
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      <Animated.View style={{ transform: [{ scale: pulseAnim }], marginTop: 40 }}>
        <MaterialCommunityIcons
          name={isPlaying ? 'ear-hearing' : 'ear-hearing-off'}
          size={100}
          color={isPlaying ? '#00BFFF' : '#888'}
        />
      </Animated.View>

      <Text style={styles.text}>
        {isPlaying ? 'Reproduzindo áudio...' : 'Aguardando áudio'}
      </Text>

      <Text style={styles.appTitle}>Vision X</Text>
      <Text style={styles.appDescription}>
        Auxílio para deficientes visuais: transcrição em áudio de imagens capturadas por câmera.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  appTitle: {
    marginTop: 24,
    fontSize: 32,
    color: '#00BFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
})
