FROM node:20-bullseye

# Install Python and audio dependencies
RUN apt-get update && \
    apt-get install -y python3 python3-pip fluidsynth libsndfile1 ffmpeg && \
    apt-get clean

WORKDIR /app

COPY package*.json ./
RUN npm install

# Install Python dependencies with specific versions
RUN python3 -m pip install --upgrade pip && \
    python3 -m pip install \
    tensorflow-cpu \ 
    pretty_midi \
    librosa==0.10.1 \
    midi2audio \
    requests \
    watchdog \
    crepe \
    numpy \
    soundfile \
    audioread

COPY . .

EXPOSE 5000

CMD ["sh", "-c", "npm run dev & python3 watcher.py"]