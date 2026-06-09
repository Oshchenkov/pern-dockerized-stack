# Use the official Node.js dev container image Node.24, zsh and with TypeScript support.
# https://hub.docker.com/r/microsoft/devcontainers-typescript-node
FROM mcr.microsoft.com/devcontainers/typescript-node:4-24-trixie

RUN corepack enable
RUN corepack use pnpm@11.5.2


# Switch to the non-root 'node' user for Zsh installation
USER node

# RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
# Alreade installed ohmyzsh in the base image, so we can skip that step and just add plugins and update the .zshrc
# Add popular Zsh plugins
RUN git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions && \
    git clone https://github.com/zsh-users/zsh-syntax-highlighting ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

#  Update .zshrc: Set theme to "avit" and add plugins
RUN sed -i 's/^ZSH_THEME=.*/ZSH_THEME="avit"/' ~/.zshrc && \
    sed -i 's/plugins=(git)/plugins=(git npm zsh-autosuggestions zsh-syntax-highlighting)/' ~/.zshrc

# Switch back to root for any subsequent Dockerfile commands
USER root