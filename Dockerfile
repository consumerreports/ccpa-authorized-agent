FROM node:14-alpine3.10

ADD ./src/webapp/package.json /opt/webapp/package.json
ADD ./src/webapp/package-lock.json /opt/webapp/package-lock.json
WORKDIR /opt/webapp
RUN npm install --production

ADD ./src/webapp /opt/webapp
CMD node ./wait-for-db.js && ./node_modules/.bin/sequelize db:migrate && node .
