# Use an official Node.js image as the base image
FROM node:16

# Set the working directory to /app
WORKDIR /app

# Copy the package.json file
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port
EXPOSE 3000

# Run the command to start the development server
CMD ["npm", "start"]