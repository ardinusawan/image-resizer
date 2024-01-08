# Use Node.js LTS 20 as the base image
FROM node:alpine3.19

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install dependencies
RUN npm install -g pm2 && npm install

# Copy the rest of the application code
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the application using PM2
CMD ["pm2-runtime", "start", "pm2.config.js"]
