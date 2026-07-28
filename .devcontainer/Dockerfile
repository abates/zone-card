FROM mcr.microsoft.com/devcontainers/python:3

SHELL ["/bin/bash", "-o", "pipefail", "-c"]

RUN \
    apt-get update \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    bluez \
    ffmpeg \
    libudev-dev \
    libavformat-dev \
    libavcodec-dev \
    libavdevice-dev \
    libavutil-dev \
    libswscale-dev \
    libswresample-dev \
    libavfilter-dev \
    libpcap-dev \
    libturbojpeg0 \
    libyaml-dev \
    libxml2 \
    git \
    cmake \
    autoconf \
    \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && source /usr/local/share/nvm/nvm.sh \
    && nvm install lts/krypton \
    && pip install --upgrade wheel pip

COPY --from=ghcr.io/alexxit/go2rtc:latest /usr/local/bin/go2rtc /bin/go2rtc
RUN pip3 install uv

EXPOSE 8123

VOLUME /config

USER vscode
ENV VIRTUAL_ENV="/home/vscode/.local/ha-venv"
RUN uv venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

RUN uv pip install homeassistant
COPY --from=docker.io/thomasloven/hass-custom-devcontainer:latest /usr/bin/container /usr/bin
COPY --from=docker.io/thomasloven/hass-custom-devcontainer:latest /usr/bin/hassfest /usr/bin

CMD sudo -E container
