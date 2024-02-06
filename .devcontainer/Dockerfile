# alpine
FROM node:18-alpine
RUN apk update

# for deasync
RUN apk add make g++

# git
RUN apk add git
RUN git config --global --add safe.directory "*"

# ssh
RUN apk add openssh

USER node
