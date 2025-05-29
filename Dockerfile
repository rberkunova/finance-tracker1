ARG NODE_VERSION="24.1.0"
ARG ALPINE_VERSION="3.21"

# Alias for new microservice project
#   --skip-git                Don't initialize a Git repo
#   --package-manager pnpm    Use PNPM
#   --language ts             Ensure TypeScript explicitly
#   --strict                  Enables stricter TypeScript settings
ARG ALIAS_NEST_NEW_MS="alias nest-new-ms='nest new --skip-git --package-manager pnpm --language ts --strict'"
ARG USER_HOME="/home/node"

FROM node:${NODE_VERSION}-alpine${ALPINE_VERSION}

# Re-declare args
ARG ALIAS_NEST_NEW_MS
ARG USER_HOME

# Install tools globally
RUN npm install -g        \
    @nestjs/cli           \
    typescript            \
    pnpm                  \
    vite                  \
    @vitejs/plugin-react

# Install postgres
RUN apk add --no-cache postgresql-client sudo bash

# Source `.shrc` on login
RUN echo "[ -f '${USER_HOME}/.shrc' ] && . '${USER_HOME}/.shrc'" >> "${USER_HOME}/.profile"

# Customise terminal prompt
#   - `\w` shows the current working directory
#   - `\$` shows `$` for normal user or `#` for root
RUN echo "export PS1='\\w\\$ '" >> "${USER_HOME}/.shrc"

# Create alias
RUN echo ${ALIAS_NEST_NEW_MS} >> "${USER_HOME}/.shrc"

# App root dir
WORKDIR /usr/src/app

# # Add `wait-for-it.sh` script
COPY "./wait-for-it.sh" "/usr/local/bin/"
RUN chmod +x "/usr/local/bin/wait-for-it.sh"

# Use non-root user
USER node

# All `CMD` will be ignored, since `"overrideCommand"` set to `true` in `devcontainer.json`
