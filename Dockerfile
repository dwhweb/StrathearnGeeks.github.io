FROM debian:bullseye-slim

# Install necessary packages including curl, tar, git, and golang
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    git \
    golang-go \
    && rm -rf /var/lib/apt/lists/*

# Set Hugo version
ENV HUGO_VERSION=0.111.3

# Download and install Hugo extended binary
RUN curl -L -o /tmp/hugo.tar.gz "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_Linux-64bit.tar.gz" \
    && tar -xzf /tmp/hugo.tar.gz -C /usr/local/bin hugo \
    && rm /tmp/hugo.tar.gz

WORKDIR /src

ENTRYPOINT ["hugo"]
CMD ["--help"]

