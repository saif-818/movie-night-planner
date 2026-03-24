# Use Node.js as the base image
FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy package files first (to cache layers)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy your Prisma schema specifically so we can generate the client
# (Adjust this path if your schema is in a different folder like ./prisma/schema.prisma)
COPY prisma ./prisma/

# Generate the Prisma Client for the container's OS (Linux)
RUN npx prisma generate

# Copy the rest of your application code
COPY . .

# Expose the port Next.js runs on
EXPOSE 3000

# Start the development server
CMD ["npm", "run", "dev"]