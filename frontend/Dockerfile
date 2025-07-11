# Base image
FROM node:20-bullseye AS builder

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Serve build using a minimal web server (like `serve`)
FROM node:20-bullseye AS runner
WORKDIR /app
RUN npm install -g serve

# Copy built files from builder stage
COPY --from=builder /app/dist /app/dist

# Expose port (must match Render's expected PORT env)
ENV PORT=10000
EXPOSE 10000

# Serve the build folder
CMD ["serve", "-s", "dist", "-l", "10000"]
