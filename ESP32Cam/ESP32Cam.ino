#include "WiFi.h"
#include "esp_camera.h"

#include "base64.h"
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

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
const char *ssid = "ssid";
const char *password = "password";

const char *server_url = "vision-x-kdog.onrender.com/upload";

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
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;

    config.frame_size =
        FRAMESIZE_QVGA; // FRAMESIZE_ + QVGA|CIF|VGA|SVGA|XGA|SXGA|UXGA
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

    pinMode(buttonReferencePin, OUTPUT);
    digitalWrite(buttonReferencePin, LOW);
    pinMode(buttonReaderPin, INPUT_PULLUP);
}

void loop() {

    int currentButtonState = digitalRead(buttonReaderPin);

    if (currentButtonState == LOW && lastButtonState == HIGH) {
        sendImage();
        delay(50);
    }

    lastButtonState = currentButtonState;
    delay(10);
}

void sendImage() {
    Serial.println("Enviando imagem.");
    if (WiFi.status() == WL_CONNECTED) {

        camera_fb_t *fb = NULL;

        // Take Picture with Camera
        fb = esp_camera_fb_get();
        if (!fb) {
            Serial.println("Camera capture failed");
            return;
        }

        WiFiClientSecure client;
        HTTPClient http;

        client.setInsecure();

        if (http.begin(client, server_url)) {
            Serial.printf("Conectando a: %s\n", server_url);

            http.setTimeout(2000000);
            http.addHeader("Content-Type", "application/octet-stream");

            int httpResponseCode = http.POST(fb->buf, fb->len);

            if (httpResponseCode > 0) {
                Serial.printf("Código de resposta HTTP: %d\n",httpResponseCode);
                String payload = http.getString();
                Serial.println("Resposta do servidor:");
                Serial.println(payload);
            } else {
                Serial.printf("Erro ao enviar POST. Código de erro: %s\n", http.errorToString(httpResponseCode).c_str());
            }


            http.end();
        } else {
            Serial.printf("Não foi possível conectar a: %s\n", server_url);
        }

        esp_camera_fb_return(fb);
    }
}
