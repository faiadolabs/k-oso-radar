# k-oso radar for Star Citizen

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker Image Version](https://img.shields.io/docker/v/faiadolabs/k-oso-radar-app?sort=semver)](https://hub.docker.com/r/USUARIO/k-oso-radar-app) [![Deploy to GitHub Pages](https://github.com/faiadolabs/k-oso-radar/actions/workflows/deploy.yml/badge.svg)](https://github.com/faiadolabs/k-oso-radar/actions/workflows/deploy.yml) [![Issues](https://img.shields.io/github/issues/faiadolabs/k-oso-radar)](https://github.com/faiadolabs/k-oso-radar/issues) [![Open Pull Requests](https://img.shields.io/github/issues-pr/faiadolabs/k-oso-radar)](https://github.com/faiadolabs/k-oso-radar/pulls)

## Overview

k-oso radar is a utility specifically designed for Star Citizen with the purpose of locating positions on planetary surfaces.

The idea is to place points of interest around a central reference point using a distance and heading vector relative to that center.

It is currently in the concept phase. You can access its [*online demo*](https://faiadolabs.github.io/k-oso-radar/). Its interface is as follows:

![Screemshot App](/doc/img/k-oso-radar.gif)

## Quick Start ()

```bash
docker run -p 8080:80 faiadolabs/k-oso-radar-app
```

Then you can hit [`http://localhost:8080`](http://localhost:8080) or `http://host-ip:8080` in your browser.

## Develop mode Quick Start

```bash
docker compose up
```

It will start:

1. `k-oso-radar-app` (frontend) responding on `http://localhost:8080`
2. `k-oso-radar-backend` responding on `http://localhost:3000`
3. `caddy` (reverse-proxy) responding:
   1. for the frontend at `https://localhost:3443`
   2. for the backend  at `https://localhost:3444`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project.
1. Create a branch: `git checkout -b feature/new-feature`.
1. Make your changes and commit: `git commit -am 'Add new feature'`.
1. Push the branch: `git push origin feature/new-feature`.
1. Open a Pull Request.
