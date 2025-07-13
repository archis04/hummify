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
        sox \
        git-lfs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# # ---------- Enable Git LFS ----------
# RUN git lfs install

# ---------- Set Working Directory ----------
WORKDIR /app

# ---------- Copy All Files ----------
COPY . .

# # ---------- Pull LFS Tracked Files (e.g., *.sf2) ----------
# RUN git lfs pull

# ---------- Install Node Dependencies ----------
RUN npm install

# ---------- Build React Frontend ----------
RUN npm run build --prefix frontend

# ---------- Install Python Dependencies ----------
RUN curl -sS https://bootstrap.pypa.io/get-pip.py | python3 && \
    pip install --no-cache-dir tensorflow-cpu==2.10.0 && \
    pip install --no-cache-dir -r backend/requirements.txt

# ---------- Set Environment ----------
ENV TF_CPP_MIN_LOG_LEVEL=3
ENV PORT=5000

# ---------- Expose Port ----------
EXPOSE 5000

# ---------- Start Backend (serving frontend too) ----------
CMD ["node", "backend/server.js"]
