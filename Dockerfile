# ---------- Base Image ----------
FROM node:20-bullseye

# ---------- Install System Dependencies ----------
RUN apt-get update -qq && \
    apt-get install -y --no-install-recommends \
        python3.9 \
        python3.9-dev \
        python3-pip \
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
        sox \
        curl \
        cmake && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# ---------- Enable Git LFS (for .sf2 SoundFonts) ----------
RUN git lfs install || true

# ---------- Set Python 3.9 as Default ----------
RUN ln -sf /usr/bin/python3.9 /usr/bin/python

# ---------- Set Working Directory ----------
WORKDIR /app

# ---------- Copy Backend First & Install Node Dependencies ----------
COPY backend ./backend
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install

# ---------- Copy Frontend & Build ----------
WORKDIR /app/frontend
COPY frontend ./frontend
COPY frontend/package*.json ./
RUN npm install
RUN npm run build

# ---------- Copy the Rest ----------
WORKDIR /app
COPY . .

# ---------- Pull LFS files (e.g., *.sf2) ----------
RUN git lfs pull || echo "Skipping git lfs pull (not a git repo)"

# ---------- Install Python Dependencies ----------
WORKDIR /app/backend
COPY backend/requirements.txt .
RUN pip3 install --no-cache-dir tensorflow-cpu==2.10.0
RUN pip3 install --no-cache-dir -r requirements.txt

# ---------- Environment Vars ----------
ENV TF_CPP_MIN_LOG_LEVEL=3
ENV PORT=5000

# ---------- Expose Port ----------
EXPOSE 5000

# ---------- Start Backend (which serves frontend too) ----------
CMD ["node", "server.js"]
