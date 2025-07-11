# Use Node base image with Python compatibility
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

# Set working directory
WORKDIR /app

# 🔹 Install Node.js dependencies early for caching
COPY package*.json ./
RUN npm install --quiet && npm ls --depth=0


# 🔹 Upgrade pip safely (optional if pip already new)
RUN curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py && \
    python3 get-pip.py && rm get-pip.py

# 🔹 Install Python dependencies
COPY requirements.txt .
RUN python3 -m pip install --default-timeout=1000 tensorflow-cpu==2.10.0 && \
    python3 -m pip install --default-timeout=300 -r requirements.txt 

# 🔹 Now copy the rest of the app
COPY . .

# Suppress TensorFlow logs
ENV TF_CPP_MIN_LOG_LEVEL=3

# Expose backend port
EXPOSE 5000

# Start both frontend and backend
CMD ["sh", "-c", "npm run dev & python3 /app/watcher.py"]
