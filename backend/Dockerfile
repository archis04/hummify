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
        sox &&  \
        apt-get clean && \
        rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy Node.js dependencies
COPY package*.json ./
RUN npm install --quiet

# Upgrade pip safely
RUN curl -sS https://bootstrap.pypa.io/get-pip.py -o get-pip.py && \
    python3 get-pip.py && rm get-pip.py

# Install TensorFlow separately to avoid interruption
RUN python3 -m pip install --no-cache-dir --default-timeout=1000 tensorflow-cpu==2.10.0

# Install Cython and other Python dependencies
RUN python3 -m pip install --no-cache-dir --default-timeout=300 \
        cython \
        pretty_midi \
        librosa \
        midi2audio \
        requests \
        watchdog \
        crepe \
        numpy \
        soundfile \
        audioread \
        noisereduce \
        resampy \
        pydub \
        scipy \
        psutil \
        aubio \
        pybind11 \
        samplerate \
        numba==0.56.4 \
        llvmlite==0.39.1 \
        pyworld \
        webrtcvad \
        pyrubberband==0.3.0 \
        scikit-learn \
        torch \
        torchaudio

# 🔸 ADD: Set environment variable to suppress TensorFlow logs
ENV TF_CPP_MIN_LOG_LEVEL=3

# Clear pip cache
RUN python3 -m pip cache purge

# Copy full project
COPY . .

EXPOSE 5000

# Start the dev server and Python watcher
CMD ["sh", "-c", "npm run dev & python3 watcher.py"]
