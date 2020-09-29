FROM node:14

# Create app directory
WORKDIR /usr/src/app

# copy configs to /app folder
COPY package*.json ./
COPY tsconfig.json ./
# copy source code to /app/src folder
COPY . .

# check files list
RUN ls -a

RUN npm install
RUN npm run build

EXPOSE 8000

CMD [ "node", "./dist/main.js" ]