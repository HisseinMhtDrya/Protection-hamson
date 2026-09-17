FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install --production
RUN rm -rf node_modules/.cache

# Copy source
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
