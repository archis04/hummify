FROM node:20-bullseye

# Install Python 3, Pip, and FluidSynth
RUN apt-get update && \
    apt-get install -y python3 python3-pip fluidsynth && \
    apt-get clean

# Set working directory
WORKDIR /app

# Copy the entire project (including code and SoundFont)
COPY . .

# Install Node.js dependencies
COPY package*.json ./
RUN npm install

# Install Python dependencies in one command
RUN python3 -m pip install pretty_midi librosa midi2audio requests

# Expose backend port
EXPOSE 5000

# Run the app in development mode
CMD ["npm", "run", "dev"]