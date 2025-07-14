# Use official Python base
FROM python:3.9-slim

# Prevent prompts during package installation
ENV DEBIAN_FRONTEND=noninteractive

# Install system packages needed for audio and ML
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ffmpeg \
    libsndfile1 \
    libasound2-dev \
    libjack-dev \
    libportaudio2 \
    portaudio19-dev \
    fluidsynth \
    sox \
    rubberband-cli \
    curl \
    git \
    cmake \
    libavcodec-dev \
    libavformat-dev \
    libavutil-dev \
    libsamplerate0-dev \
    libaubio-dev \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy only requirements and install
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy your actual codebase
COPY . .

# Default command (runs nothing by default)
CMD ["bash"]
