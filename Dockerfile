FROM node:8.10

COPY . .

RUN npm install

CMD ["node", "app.js"]
