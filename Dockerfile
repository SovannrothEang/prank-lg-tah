# Use Node LTS
FROM node:20-slim

# Create app directory
WORKDIR /usr/src/app

# Copy root manifests
COPY package*.json ./
COPY apps/admin-dashboard/package*.json ./apps/admin-dashboard/
COPY apps/guest-site/package*.json ./apps/guest-site/

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build Guest Site
WORKDIR /usr/src/app/apps/guest-site
RUN npm run build

# Expose Admin Port
EXPOSE 3000

# Start command
WORKDIR /usr/src/app/apps/admin-dashboard
CMD [ "npm", "start" ]
