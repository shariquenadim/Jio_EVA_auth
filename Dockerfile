FROM node:14-alpine

WORKDIR /backend

COPY . .

RUN npm install

EXPOSE 3000

CMD ["node", "index.js"]

