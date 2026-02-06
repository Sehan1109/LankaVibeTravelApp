# Stage 1
# 1. Build the React App
FROM node:20-alpine as build

WORKDIR /app

# 2. Copy the Dependencies
COPY package*.json ./
RUN npm install

# 3. Copy the Source Code
COPY . .
RUN npm run build


# Stage 2
# 1. Server with Nginx
FROM nginx:alpine

# 2. Copy the Build Files
COPY --from=build /app/dist /usr/share/nginx/html

# 3. Expose the Port
EXPOSE 80

# 4. Start the Nginx Server
CMD ["nginx", "-g", "daemon off;"]