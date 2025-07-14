# # Use Node base image with Python compatibility
# FROM node:20-bullseye

# # Install system dependencies
# RUN apt-get update -o DPkg::Lock::Timeout=60 -qq && \
#     apt-get install -y --no-install-recommends \
#         python3 \
#         python3-pip \
#         python3-dev \
#         build-essential \
#         cmake \
#         curl \
#         fluidsynth \
#         libsndfile1 \
#         ffmpeg \
#         libaubio-dev \
#         libavcodec-dev \
#         libavformat-dev \
#         libavutil-dev \
#         libsamplerate0-dev \
#         libjack-dev \
#         libasound2-dev \
#         libportaudio2 \
#         portaudio19-dev \
#         rubberband-cli \
#         sox && \
#     apt-get clean && \
#     rm -rf /var/lib/apt/lists/*

# # Set working directory
# WORKDIR /app

# # 🔹 Install Node.js dependencies early for caching
# COPY package*.json ./
# RUN npm install --quiet && npm ls --depth=0


# # 🔹 Upgrade pip safely (optional if pip already new)
# RUN curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py && \
#     python3 get-pip.py && rm get-pip.py

# # 🔹 Install Python dependencies
# COPY requirements.txt .
# RUN python3 -m pip install --default-timeout=1000 tensorflow-cpu==2.10.0 && \
#     python3 -m pip install --default-timeout=300 -r requirements.txt 

# # 🔹 Now copy the rest of the app
# COPY . .

# # Suppress TensorFlow logs
# ENV TF_CPP_MIN_LOG_LEVEL=3

# # Expose backend port
# EXPOSE 5000

# # Start both frontend and backend
# CMD ["sh", "-c", "npm run dev & python3 /app/watcher.py"]

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

# ---------- Backend Dependencies (Node) ----------
COPY backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# ---------- Frontend Dependencies ----------
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install

# ---------- Copy Backend Python Requirements Early for Caching ----------
WORKDIR /app/backend
COPY backend/requirements.txt ./requirements.txt
RUN pip3 install tensorflow-cpu==2.10.0 && \
    pip3 install -r requirements.txt

# ---------- Copy Full Codebase ----------
WORKDIR /app
COPY . .

# ---------- Build Frontend ----------
WORKDIR /app/frontend
RUN npm run build

# ---------- Environment Variables ----------
ENV TF_CPP_MIN_LOG_LEVEL=3
ENV PORT=5000

# ---------- Expose Port ----------
EXPOSE 5000

# ---------- Start Backend (serves frontend) ----------
WORKDIR /app/backend
CMD ["node", "server.js"]
