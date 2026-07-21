FROM postgres:18-bookworm

USER root

# Install the official pg_cron package
RUN apt-get update \
    && apt-get install -y --no-install-recommends postgresql-18-cron \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

USER postgres