# Excel raporlarının LibreOffice ile yeniden hesaplanması için (yalnız test).
# Derleme: docker build -t repiom-libreoffice tools/libreoffice
FROM debian:bookworm-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends libreoffice-calc-nogui python3 fonts-dejavu-core \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /w
ENTRYPOINT ["soffice", "--headless", "--norestore", "--nolockcheck"]
