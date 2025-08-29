# Vision-X: Documentação de Software

Este documento fornece uma análise técnica aprofundada, a estrutura do projeto e as instruções de instalação para todos os componentes de software do projeto Vision-X.


## Stack de Tecnologias

* **Sistema Embarcado (Firmware):**
    * **Hardware:** ESP32-CAM
    * **Linguagem:** C++ (Arduino Framework)
    * **Bibliotecas:** `WebSocketsClient`, `ArduinoJson`, `esp_camera`

* **Backend:**
    * **Runtime:** Node.js
    * **Framework:** Express.js
    * **Comunicação:** `ws` (WebSocket Library)
    * **APIs Externas:** OpenAI (GPT-4o, TTS-1)

* **Aplicativo Móvel:**
    * **Framework:** React Native (com Expo)
    * **Linguagem:** TypeScript/JavaScript
    * **Bibliotecas:** `expo-av` (para áudio), `expo-vector-icons`

* **Página Web de Stream:**
    * **Tecnologias:** HTML5, JavaScript (WebSocket API nativa)
 

![Fluxo_de_evento-Vision-x • Fluxo do Evento (Sequência) (2)](https://github.com/user-attachments/assets/b9c3c1bf-7896-42f4-b8f6-cd60777f5e7d)


## Configuração e Instalação

### Pré-requisitos

* Node.js e npm/yarn
* Arduino IDE com o Core do ESP32 instalado
* Expo Go no seu smartphone
* Uma chave de API da OpenAI

### 📦 Backend (Servidor Node.js)

1.  Navegue até a pasta `backend`:
    ```bash
    cd backend/
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
3.  Configure suas credenciais de Wi-Fi nos arquivos apropriados.
4.  Atualize o endereço do seu servidor WebSocket. Se estiver rodando localmente, use o IP da sua máquina. Se estiver em produção (como no Render, que o código sugere), use o domínio correto:
    ```cpp
    // Para produção (WSS - WebSocket Seguro)
    webSocket.beginSSL("vision-x-kdog.onrender.com", 443, "/");

    // Para teste local (WS - WebSocket não seguro)
    // webSocket.begin("IP_DA_SUA_MAQUINA", 3001, "/");
    ```
5.  Selecione a placa "AI Thinker ESP32-CAM" na Arduino IDE, conecte o dispositivo e faça o upload do firmware.

### 📱 Aplicativo Móvel (Expo)

1.  Navegue até a pasta `app`:
    ```bash
    cd app/
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
