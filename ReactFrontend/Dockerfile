# Use an official Node.js image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first (to leverage Docker cache)
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install -g vite

# Copy the rest of the application code
COPY . .

# Copy SSL certificates into the container
COPY certs /app/certs

# Expose the React development server port
EXPOSE 5173

# Start the React app
# CMD ["npm", "start"]
CMD ["vite", "--host"]