FROM node:20-bullseye

# Install system dependencies
RUN apt-get update -o DPkg::Lock::Timeout=60 -qq && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        python3-dev \
        build-essential \
        cmake \
        curl \
        fluidsynth \
        libsndfile1 \
        ffmpeg \
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
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy and install Node.js dependencies
COPY package*.json ./
RUN npm install --quiet

# Upgrade pip safely
RUN curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py && \
    python3 get-pip.py && rm get-pip.py

# 🔹 COPY Python dependencies first
COPY requirements.txt ./requirements.txt

# Install Python dependencies
RUN python3 -m pip install --default-timeout=1000 tensorflow-cpu==2.10.0 && \
    python3 -m pip install --default-timeout=300 -r requirements.txt && \
    python3 -m pip cache purge


COPY . .

# TensorFlow logging silence
ENV TF_CPP_MIN_LOG_LEVEL=3

EXPOSE 5000

# Start both servers
# Correct path for watcher.py
CMD ["sh", "-c", "npm run dev & python3 /app/watcher.py"]