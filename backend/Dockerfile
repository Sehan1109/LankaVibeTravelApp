# 1. Get the Node Image
FROM node:20-alpine

# 2. Create a working directory
WORKDIR /app

# 3. Copy the Dependencies
COPY package*.json ./
RUN npm install

# 4. Copy the Source Code
COPY . .

# 5. Expose the Port
EXPOSE 5000

# 6. Start the Application
CMD ["npm", "start"]