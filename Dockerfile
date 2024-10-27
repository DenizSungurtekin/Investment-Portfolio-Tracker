FROM node:20-alpine

# Install Python, pip, and virtual environment tools
RUN apk add --no-cache python3 py3-pip postgresql-client

WORKDIR /app

# Create scripts directory that won't be mounted over
RUN mkdir -p /scripts

# Copy only package.json first (removed package-lock.json reference)
COPY package.json ./

# Install dependencies with specific flags for Vite
RUN npm install -g npm@latest
RUN npm install -g vite concurrently
RUN npm install --legacy-peer-deps

# Create a backup of node_modules in a different location
RUN mv node_modules /scripts/node_modules.bak

# Copy the rest of the application
COPY . .

# Create and activate Python virtual environment
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Install Python dependencies in virtual environment
RUN . /app/venv/bin/activate && pip install -r requirements.txt

# Modified startup script to handle node_modules better
RUN printf '#!/bin/sh\n\
set -x\n\
. /app/venv/bin/activate\n\
python3 ingest_fake_data.py\n\
# Create node_modules if it doesn\'t exist\n\
mkdir -p /app/node_modules\n\
# Copy the backup directly into the tmpfs mount\n\
cp -rf /scripts/node_modules.bak/* /app/node_modules/\n\
cd /app\n\
echo "Current directory:"\n\
pwd\n\
echo "Listing files:"\n\
ls -la\n\
echo "Node version:"\n\
node --version\n\
echo "NPM version:"\n\
npm --version\n\
export PATH="/app/node_modules/.bin:/usr/local/bin:$PATH"\n\
exec concurrently "vite --host 0.0.0.0 --config /app/vite.config.js" "node src/backend/server.js"\n' > /scripts/start.sh && \
    chmod +x /scripts/start.sh

EXPOSE 5173 5000

CMD ["/bin/sh", "/scripts/start.sh"]