# ---------- Base Image ----------
FROM node:20-bullseye

# ---------- Install System Dependencies ----------
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        python3-dev \
        build-essential \
        git \
        git-lfs \
        fluidsynth \
        ffmpeg \
        libsndfile1 \
        libasound2-dev \
        libportaudio2 \
        portaudio19-dev \
        rubberband-cli \
        sox && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ---------- Enable Git LFS ----------
RUN git lfs install || true

# ---------- Set Working Directory ----------
WORKDIR /app

# ---------- Copy and Install Backend Dependencies ----------
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# ---------- Install Python Dependencies ----------
COPY backend/requirements.txt ./
RUN pip3 install --no-cache-dir tensorflow-cpu==2.10.0
RUN pip3 install --no-cache-dir -r requirements.txt

# ---------- Copy Backend Code (including .sf2 files) ----------
COPY backend . 

# ---------- Copy and Build Frontend ----------
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend .  
RUN npm run build

# ---------- Serve React Build from Backend ----------
WORKDIR /app/backend

# ---------- Set Environment ----------
ENV TF_CPP_MIN_LOG_LEVEL=3
ENV PORT=5000

# ---------- Expose Port ----------
EXPOSE 5000

# ---------- Start Server ----------
CMD ["node", "server.js"]
