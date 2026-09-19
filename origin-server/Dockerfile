FROM node:20-alpine

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Ensure the port is exposed
EXPOSE 4000

# Start the server
CMD ["node", "index.js"]
