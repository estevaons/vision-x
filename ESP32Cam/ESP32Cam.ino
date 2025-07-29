#include "WiFi.h"
#include "esp_camera.h"

#include "base64.h"
#include <ArduinoJson.h>
#include <WebSocketsClient.h>

#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27

#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

const int buttonReaderPin = 12;
const int buttonReferencePin = 2;
int lastButtonState = HIGH;

const char *hostname = "ESP32CAM";
const char *ssid = "CLARO110";
const char *password = "123789Cfm@";

WebSocketsClient webSocket;

void videoStreamTask(void *pvParameters) {
    Serial.println("Task de stream de vídeo iniciada.");
    for (;;) {

        if (webSocket.isConnected()) {
            camera_fb_t *fb = esp_camera_fb_get();
            if (fb) {
                StaticJsonDocument<256> doc;
                doc["type"] = "video_frame";

                String imageBase64 = base64::encode(fb->buf, fb->len);
                doc["data"] = imageBase64;

                String jsonString;
                serializeJson(doc, jsonString);
                webSocket.sendTXT(jsonString);

                esp_camera_fb_return(fb);
            }
        }
        // Pausa a task por 100ms para controlar o FPS (~10 frames por segundo)
        vTaskDelay(50 / portTICK_PERIOD_MS);
    }
}

void webSocketEvent(WStype_t type, uint8_t *payload, size_t length) {
    switch (type) {
    case WStype_DISCONNECTED:
        Serial.printf("[WSc] Disconnected!\n");
        break;
    case WStype_CONNECTED: {
        Serial.printf("[WSc] Connected to url: %s\n", payload);
        StaticJsonDocument<256> doc;
        doc["type"] = "register";
        doc["role"] = "esp32";
        String output;
        serializeJson(doc, output);
        webSocket.sendTXT(output);
        break;
    }
    case WStype_TEXT:
        Serial.printf("[WSc] get text: %s\n", payload);
        break;
    }
}

void setupCamera() {
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 23000000;
    config.pixel_format = PIXFORMAT_JPEG;
    config.frame_size = FRAMESIZE_HVGA;
    config.jpeg_quality = 12;
    config.fb_count = 2;

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("Camera init failed with error 0x%x", err);
        return;
    }
}

void setup() {
    Serial.begin(115200);
    delay(1000);

    WiFi.begin(ssid, password);
    while (WiFi.status() != WL_CONNECTED) {
        delay(1000);
        Serial.println("Connecting to WiFi..");
    }
    Serial.println(WiFi.localIP());

    setupCamera();

    webSocket.beginSSL("vision-x-kdog.onrender.com", 443, "/");
    // webSocket.begin("192.168.0.17", 3001,"/"); 
    webSocket.onEvent(webSocketEvent);
    webSocket.setReconnectInterval(5000);

    pinMode(buttonReferencePin, OUTPUT);
    digitalWrite(buttonReferencePin, LOW);
    pinMode(buttonReaderPin, INPUT_PULLUP);

    xTaskCreatePinnedToCore(videoStreamTask,   // Função da Task
                            "VideoStreamTask", // Nome da Task
                            10000,             // Tamanho da pilha (stack size)
                            NULL,              // Parâmetros da Task
                            1,                 // Prioridade
                            NULL,              // Handle da Task
                            0                  // Core a ser usado (0 ou 1)
    );
}

void sendAnalysisImage() {
    Serial.println("Enviando imagem para análise.");
    if (WiFi.status() == WL_CONNECTED) {
        camera_fb_t *fb = NULL;
        fb = esp_camera_fb_get();
        if (!fb) {
            Serial.println("Camera capture failed");
            return;
        }

        String imageBase64 = base64::encode(fb->buf, fb->len);

        DynamicJsonDocument doc(50000);

        doc["type"] = "image";
        doc["data"] = imageBase64;

        String jsonString;
        serializeJson(doc, jsonString);
        webSocket.sendTXT(jsonString);
        esp_camera_fb_return(fb);
    }
}

void loop() {
    webSocket.loop();

    int currentButtonState = digitalRead(buttonReaderPin);

    if (currentButtonState == LOW && lastButtonState == HIGH) {
        sendAnalysisImage();
        delay(50);
    }

    lastButtonState = currentButtonState;
    delay(10);
}