# Use the official Node.js 20 image as the base
FROM node:20

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the container
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the Prisma schema and generate the client
COPY prisma ./prisma
RUN npx prisma generate

# Copy the application source code
COPY src ./src

# Expose the port the app runs on
EXPOSE 3000

# Define the default command to run the application
CMD ["node", "src/index.js"]