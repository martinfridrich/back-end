FROM node:10 AS development
workdir /src
RUN usermod -u 1000 --shell /bin/bash node \
   && groupmod -g 1000 node
RUN mkdir -p /home/node && chown -R node: /home/node
RUN npm i -g mocha
CMD ["/bin/bash"]

FROM node:10 as node-modules
WORKDIR /node_modules
ADD ./package.json /package.json
RUN cd /node_modules && npm i

FROM node:10-alpine AS deploy
WORKDIR /src
ADD . /src
COPY --from=node-modules /node_modules /src/node_modules
CMD ["npm", "start"]
