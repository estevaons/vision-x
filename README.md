# Vision-X: Assistente Visual Inteligente

Vision-X é um sistema de assistência para deficientes visuais que combina hardware embarcado, inteligência artificial e um aplicativo móvel. O dispositivo vestível, baseado em um ESP32-CAM, captura imagens do ambiente do usuário, que são processadas por uma IA para gerar descrições em áudio, transmitidas em tempo real para o smartphone do usuário.

## Fluxo de Funcionamento

1.  **Captura:** O usuário pressiona o botão no dispositivo vestível. O ESP32-CAM captura uma imagem do que está à sua frente.
2.  **Transmissão e Processamento:** A imagem é enviada para um servidor na nuvem. O servidor utiliza a IA da OpenAI (GPT-4o) para analisar a imagem e gerar uma descrição textual concisa. Em seguida, transforma esse texto em um áudio com voz natural.
3.  **Reprodução:** O servidor envia o arquivo de áudio para o aplicativo no celular do usuário, que o reproduz imediatamente.

## Funcionalidades Principais

* **Descrição sob Demanda:** Obtenha descrições de cenas e objetos com um único toque de botão.
* **Comunicação em Tempo Real:** Respostas rápidas graças ao uso de WebSockets.
* **Inteligência Artificial Avançada:** Utiliza o GPT-4o para descrições de imagem de alta qualidade e contextuais.
* **Feedback Audível e Intuitivo:** Respostas em áudio com voz natural e uma interface de aplicativo minimalista.
* **Monitoramento Remoto (para Depuração):** Uma página web permite a visualização do feed de vídeo da câmera para fins de desenvolvimento e testes.



![Fluxo_de_evento-Vision-x • Arquitetura (Blocos)](https://github.com/user-attachments/assets/23cb5791-8074-49a3-853b-81a52bd223e8)
