FROM node:20-alpine

COPY . .

RUN npm install

CMD ["node", "app.js"]
