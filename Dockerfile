# Use Node.js as base image
FROM node:18-alpine

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    postgresql-client \
    python3-dev \
    gcc \
    musl-dev \
    libffi-dev

WORKDIR /app

# Copy package files first
COPY package*.json ./
COPY requirements.txt ./

# Install Node.js dependencies
RUN npm install

# Create and activate virtual environment, install dependencies
RUN python3 -m venv /opt/venv && \
    /opt/venv/bin/pip install --upgrade pip && \
    /opt/venv/bin/pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

EXPOSE 5173 5000

# Use the Python from virtual environment
ENV PATH="/opt/venv/bin:$PATH"

# Start both servers directly
CMD python3 ingest_fake_data.py && \
    node src/backend/server.js & \
    npm run dev:frontend