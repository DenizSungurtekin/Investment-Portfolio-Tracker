FROM node:20-alpine

# Install Python, pip, and virtual environment tools
RUN apk add --no-cache python3 py3-pip postgresql-client

WORKDIR /app

# Create scripts directory that won't be mounted over
RUN mkdir -p /scripts

# Copy package files first
COPY package*.json ./

# Install Node.js dependencies
RUN npm install
RUN npm install @radix-ui/react-select --save

# Copy the rest of the application
COPY . .

# Create and activate Python virtual environment
RUN python3 -m venv /app/venv
ENV PATH="/app/venv/bin:$PATH"

# Install Python dependencies in virtual environment
RUN . /app/venv/bin/activate && pip install -r requirements.txt

# Create startup script in /scripts instead of /app
RUN printf '#!/bin/sh\n\
. /app/venv/bin/activate\n\
python3 ingest_fake_data.py\n\
cp -r /app/node_modules.bak/* /app/node_modules/\n\
npm run dev\n' > /scripts/start.sh && \
    chmod +x /scripts/start.sh

# Create a backup of node_modules that will be copied to tmpfs
RUN cp -r /app/node_modules /app/node_modules.bak

# Expose ports
EXPOSE 5173 5000

# Start the application using shell to execute the script
CMD ["/bin/sh", "/scripts/start.sh"]