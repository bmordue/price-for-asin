FROM node:8

COPY . .

RUN npm install

CMD ["node", "app.js"]
