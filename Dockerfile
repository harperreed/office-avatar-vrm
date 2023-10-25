# Use Node.js LTS version
FROM node:lts

# Create and change to the app directory
WORKDIR /usr/src/app

# Copy package*.json for installing dependencies
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the local source files to the container
COPY . .

# Expose the port the app will run on
EXPOSE 8765

# Run the application
CMD [ "npm", "start" ]
