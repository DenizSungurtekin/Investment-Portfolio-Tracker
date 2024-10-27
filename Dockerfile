FROM node:20-alpine

# Install Python, pip, and virtual environment tools
RUN apk add --no-cache python3 py3-pip postgresql-client

WORKDIR /app

# Create scripts directory that won't be mounted over
RUN mkdir -p /scripts

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install -g concurrently  # Install concurrently globally

# Create a backup of node_modules that will be copied to tmpfs
RUN cp -r node_modules /scripts/node_modules.bak

# Copy the rest of the application
COPY . .

# Create and activate Python virtual environment
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Install Python dependencies in virtual environment
RUN . /app/venv/bin/activate && pip install -r requirements.txt

# Modified startup script to use full path to concurrently
RUN printf '#!/bin/sh\n\
. /app/venv/bin/activate\n\
python3 ingest_fake_data.py\n\
rm -rf /app/node_modules\n\
cp -r /scripts/node_modules.bak /app/node_modules\n\
export PATH="/app/node_modules/.bin:/usr/local/bin:$PATH"\n\
cd /app && npx concurrently "npx vite --host 0.0.0.0" "node src/backend/server.js"\n' > /scripts/start.sh && \
    chmod +x /scripts/start.sh

EXPOSE 5173 5000

CMD ["/bin/sh", "/scripts/start.sh"]