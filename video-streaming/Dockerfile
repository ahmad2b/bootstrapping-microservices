FROM node:18.17.1

WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY ./src ./src
COPY ./tsconfig.json ./tsconfig.json
COPY ./videos ./videos

RUN npm run build

CMD npm start