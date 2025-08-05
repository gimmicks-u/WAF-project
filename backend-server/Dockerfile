FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm i

COPY . .

EXPOSE 3000

RUN npm run build

CMD ["node", "dist/main"]
