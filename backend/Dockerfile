FROM node:20-bullseye

# Install Python and audio dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        python3 \
        python3-pip \
        fluidsynth \
        libsndfile1 \
        ffmpeg && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install Python dependencies
RUN python3 -m pip install --no-cache-dir --upgrade pip && \
    python3 -m pip install --no-cache-dir \
        tensorflow-cpu \
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
        scipy

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "npm run dev & python3 watcher.py"]