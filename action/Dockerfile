FROM node:20-slim

# Install dependencies for Playwright + curl/jq for entrypoint
RUN apt-get update && apt-get install -y \
    curl \
    jq \
    wget \
    gnupg \
    ca-certificates \
    fonts-liberation \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxshmfence1 \
    xdg-utils \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /allylab

# Copy package files
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/
COPY packages/cli/package*.json ./packages/cli/

# Install dependencies
RUN npm ci --workspace=@allylab/api --workspace=@allylab/cli

# Copy source code
COPY packages/api ./packages/api
COPY packages/cli ./packages/cli
COPY tsconfig.base.json ./

# Build packages
RUN npm run build --workspace=@allylab/api && \
    npm run build --workspace=@allylab/cli

# Install Playwright browsers
RUN npx playwright install chromium

# Copy entrypoint
COPY action/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

ENTRYPOINT ["/entrypoint.sh"]