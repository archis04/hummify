# ---------- Base Image ----------
FROM node:20-bullseye

# ---------- Install System Dependencies ----------
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        python3-dev \
        build-essential \
        cmake \
        curl \
        fluidsynth \
        ffmpeg \
        libsndfile1 \
        libaubio-dev \
        libavcodec-dev \
        libavformat-dev \
        libavutil-dev \
        libsamplerate0-dev \
        libjack-dev \
        libasound2-dev \
        libportaudio2 \
        portaudio19-dev \
        rubberband-cli \
        sox && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ---------- Enable Git LFS ----------
RUN curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash && \
    apt-get install -y git-lfs && \
    git lfs install || true

# ---------- Set Working Directory ----------
WORKDIR /app

# ---------- Copy and Install Node Dependencies ----------
COPY package*.json ./
RUN npm install --quiet

# ---------- Upgrade pip & Install Python Dependencies ----------
COPY requirements.txt ./
RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3 && \
    pip install --no-cache-dir tensorflow-cpu==2.10.0 && \
    pip install --no-cache-dir -r requirements.txt

# ---------- Copy App Code ----------
COPY . .

# ---------- Build Frontend ----------
WORKDIR /app/frontend
RUN npm install && npm run build

# ---------- Back to root/backend ----------
WORKDIR /app

# ---------- Set Environment ----------
ENV TF_CPP_MIN_LOG_LEVEL=3
ENV PORT=5000

# ---------- Expose Port ----------
EXPOSE 5000

# ---------- Start Backend (which serves built frontend) ----------
CMD ["node", "backend/server.js"]
