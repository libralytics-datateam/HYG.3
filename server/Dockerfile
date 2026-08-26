# Use a slim Node.js image as the base
FROM node:20-slim

# Install Python, pip, and necessary build tools
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy server package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy all server source code
COPY . .

# Generate Prisma Client now that the schema is present (npm install ran
# before COPY, so its postinstall prisma generate had no schema to use)
RUN npx prisma generate

# Set up Python virtual environment and install Scikit-learn + Pandas
# We run the python script using the venv python
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"
RUN pip install --no-cache-dir scikit-learn pandas

# Expose the Express port
EXPOSE 3000

# Compile TypeScript and Start Server
RUN npm install -g typescript tsx
CMD ["npx", "tsx", "index.ts"]
