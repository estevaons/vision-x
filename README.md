# Vision-X: Assistente Visual Inteligente

Vision-X é um sistema de assistência para deficientes visuais que combina hardware embarcado, inteligência artificial e um aplicativo móvel. O dispositivo vestível, baseado em um ESP32-CAM, captura imagens do ambiente do usuário, que são processadas por uma IA para gerar descrições em áudio, transmitidas em tempo real para o smartphone do usuário.

## Arquitetura do Sistema

O sistema é composto por três componentes principais que se comunicam via WebSockets, garantindo uma comunicação de baixa latência e em tempo real.

Fluxo Principal (Descrição por Áudio):

1. Captura: O usuário pressiona o botão no dispositivo ESP32-CAM. O firmware captura uma imagem.

2. Transmissão: A imagem é codificada em Base64 e enviada para o servidor backend via WebSocket.

3. Processamento da IA: O servidor recebe a imagem e a encaminha para a API OpenAI Vision (GPT-4o). A IA gera uma descrição textual otimizada para deficientes visuais (concisa e focada no essencial). Essa descrição é então enviada para a API OpenAI TTS (Text-to-Speech) para convertê-la em um arquivo de áudio MP3.

4. Entrega do Áudio: O servidor codifica o áudio MP3 em Base64 e o envia para o aplicativo móvel conectado via WebSocket.

5. Reprodução: O aplicativo recebe o áudio, decodifica-o e o reproduz para o usuário.

Fluxo Secundário (Monitoramento via Web):

1. O ESP32-CAM transmite um fluxo contínuo de vídeo em baixa resolução.

2. O servidor recebe esses frames de vídeo e os retransmite para qualquer cliente web (visualizador) conectado.

3. Uma página HTML (stream.html) renderiza esses frames, permitindo o monitoramento e a depuração em tempo real.

## Tecnologias Utilizadas

* Firmware:
    * Hardware: ESP32-CAM
    * Linguagem: C++ (Arduino Framework)

* Backend:
    * Framework: Node.js (Express.js)
    * Comunicação: WebSocket Library
    * APIs Externas: OpenAI (GPT-4o, TTS-1)

* Aplicativo:
    * Framework: React Native (Expo)
    * Linguagem: TypeScript/Javascript
    * Bibliotecas: `expo-av` (para áudio), `expo-vector-icons`

 * Página Web de Stream:
    * Tecnologias: HTML5, JavaScript (WebSocket API nativa)
  
## Configuração e Instalação

### Pré-requisitos

* Node.js e npm/yarn
* Arduino IDE com o Core do ESP32 instalado
* Expo Go no seu smartphone
* Uma chave de API da OpenAI

### 📦 Backend (Servidor Node.js)

1.  Navegue até a pasta `backend`:
    ```bash
    cd server/
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Crie um arquivo `.env` na raiz da pasta `server` e adicione sua chave da OpenAI:
    ```
    OPENAI_API_KEY="sk-..."
    ```
4.  Inicie o servidor:
    ```bash
    node server.js
    ```
    O servidor estará rodando na porta 3001 (ou na porta definida por `process.env.PORT`).

### 🤖 Sistema Embarcado (ESP32-CAM)

1.  Abra o arquivo `ESP32Cam.ino` na Arduino IDE.
2.  Instale as bibliotecas necessárias através do Library Manager: `WebSocketsClient` e `ArduinoJson`.
3.  Configure suas credenciais de Wi-Fi nas linhas apropriadas:
    ```cpp
    const char *ssid = "SUA_REDE_WIFI";
    const char *password = "SUA_SENHA_WIFI";
    ```
4.  Atualize o endereço do seu servidor WebSocket. Se estiver rodando localmente, use o IP da sua máquina. Se estiver em produção (como no Render, que o código sugere), use o domínio correto:
    ```cpp
    // Para produção (WSS - WebSocket Seguro)
    webSocket.beginSSL("vision-x-kdog.onrender.com", 443, "/");

    // Para teste local (WS - WebSocket não seguro)
    // webSocket.begin("IP_DA_SUA_MAQUINA", 3001, "/");
    ```
5.  Selecione a placa "AI Thinker ESP32-CAM" na Arduino IDE, conecte o dispositivo e faça o upload do firmware.

### 📱 Aplicativo Móvel (Expo)

1.  Navegue até a pasta `mobile`:
    ```bash
    cd mobile/
    ```
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  No arquivo `App.js`, configure a variável `socketUrl` para apontar para o seu servidor:
    ```javascript
    // Para produção
    const socketUrl = 'wss://vision-x-kdog.onrender.com';

    // Para teste local (substitua pelo IP do seu computador)
    // const socketUrl = 'ws://IP_DA_SUA_MAQUINA:3001';
    ```
4.  Inicie o servidor de desenvolvimento do Expo:
    ```bash
    npx expo start
    ```
5.  Escaneie o QR Code com o aplicativo Expo Go no seu celular.
