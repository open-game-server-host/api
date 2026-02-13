FROM node:25-alpine

ARG WORK_DIR="/ogsh"
ARG UID=1337
ARG USERNAME=ogsh

RUN apk -U update && apk upgrade

WORKDIR "$WORK_DIR"
RUN adduser --uid $UID --disabled-password --gecos "" $USERNAME && chown -R $UID $WORK_DIR
USER $USERNAME

ADD build build
ADD node_modules node_modules

ENTRYPOINT ["node", "build/api.js"]