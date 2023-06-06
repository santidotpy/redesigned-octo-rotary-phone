FROM node:18.16

# Create app directory
WORKDIR /redesigned-octo-rotary-phone

# Bundle app source
COPY src ./src

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bind port
EXPOSE 6000

CMD [ "node", "src/index.js" ]

