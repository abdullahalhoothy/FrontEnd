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

# Run the build command to generate the production build in the 'dist' folder
RUN npm run build

# Expose the port for Vite's preview server (default is 3000)
EXPOSE 3000

# Run Vite's preview server in production mode
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]