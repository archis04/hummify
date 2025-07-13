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
        git \
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

# ---------- Enable Git LFS (for .sf2) ----------
RUN curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.deb.sh | bash && \
    apt-get install -y git-lfs && \
    git lfs install || true

# ---------- Set Working Directory ----------
WORKDIR /app

# ---------- Copy & Install Backend Node Dependencies ----------
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# ---------- Copy & Build Frontend ----------
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend ./
RUN npm run build

# ---------- Copy App Code ----------
WORKDIR /app
COPY . .

# ---------- Install Python Dependencies ----------
WORKDIR /app/backend
COPY backend/requirements.txt ./requirements.txt
RUN pip3 install --no-cache-dir tensorflow-cpu==2.10.0 && \
    pip3 install --no-cache-dir -r requirements.txt

# ---------- Set Environment Variables ----------
ENV TF_CPP_MIN_LOG_LEVEL=3
ENV PORT=5000

# ---------- Expose Port ----------
EXPOSE 5000

# ---------- Start Backend (serves built frontend) ----------
CMD ["node", "backend/server.js"]
