FROM node:8.10-alpine

COPY . .

RUN npm install

CMD ["node", "app.js"]
