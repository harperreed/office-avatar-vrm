# Use an official Node runtime as base image
FROM node:16-alpine

# Set the working directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./
RUN npm install

# Bundle app source
COPY . .

# Set entry point
CMD [ "node", "app.js" ]
