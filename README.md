# Image resizer

## Capability
- Resize, crop image
- Remove background
- Format image to fit instagram grid format

## Techstack
- HTML + Tailwind + vanilla js
- Nodejs
- Redis
- PM2
  - For spawn nodejs for every core of CPU of the host machine

## How to run

### Local
1. Install [bun](https://bun.sh/docs/installation)
1. bun install
1. bun start

### Prod
- Install [docker](https://docs.docker.com/engine/install/) and [docker-compose](https://docs.docker.com/compose/install/)
- In terminal `docker compose up -d`
- Access via port 53798

## Demo
https://resize.dewaloker.xyz
![image](https://github.com/ardinusawan/image-resizer/assets/7924043/4a725a1d-0d46-4474-b653-397cc86e93ed)
