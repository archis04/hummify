# ---------- Base Image ----------
FROM node:20-bullseye

# ---------- Install System Dependencies ----------
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        build-essential \
        fluidsynth \
        ffmpeg \
        libsndfile1 \
        libasound2-dev \
        libportaudio2 \
        portaudio19-dev \
        rubberband-cli \
        sox && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ---------- Enable Git LFS (for .sf2) ----------
RUN git lfs install || true

# ---------- Set Working Directory ----------
WORKDIR /app

# ---------- Copy and Install Backend Dependencies ----------
COPY backend ./backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install

# ---------- Copy and Build Frontend ----------
WORKDIR /app
COPY frontend ./frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
RUN npm run build

# ---------- Copy rest of the files ----------
WORKDIR /app
COPY . .

# ---------- Install Python Dependencies ----------
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip3 install --no-cache-dir tensorflow-cpu==2.10.0
RUN pip3 install --no-cache-dir -r requirements.txt


# ---------- Set Environment ----------
ENV TF_CPP_MIN_LOG_LEVEL=3
ENV PORT=5000

# ---------- Expose Port ----------
EXPOSE 5000

# ---------- Start Backend (which serves frontend) ----------
CMD ["node", "server.js"]
