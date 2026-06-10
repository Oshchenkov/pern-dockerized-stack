<a name="readme-top"></a>




<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->
<!-- [![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url] -->



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h2>PERN Dockerized Stack</h2>
  <br />

[![PostgreSQL][PostgreSQL]][PostgreSQL-url]
[![Express][Express]][Express-url]
[![React][React.js]][React-url]
[![Nodejs][Node.js]][Node-url]
[![Docker][Docker]][Docker-url]


  <p>
    <br />
    <a href="https://github.com/Oshchenkov/pern-dockerized-stack/issues">Report Bug</a>
    ·
    <a href="https://github.com/Oshchenkov/pern-dockerized-stack/issues">Request Feature</a>
  </p>
</div>




<!-- ABOUT THE PROJECT -->
## About The Project

This project implements containerized applications of PERN stack




<!-- GETTING STARTED -->
## Getting Started

### Prerequisites

You must have following software installed in your System:
- `docker`




### Installation

1. Clone the repo:

    ```sh
    git clone https://github.com/Oshchenkov/pern-dockerized-stack.git
    ```
2. Open folder iv Visual Studio Code and run devcontainer("Dev Containers" extension) :

    ```sh
    cd pern-dockerized-stack && code .
    ```
3. Creating .env from default example

    ```sh
    cp .env.example .env
    ```
4. Build development containers

    ```sh
    make build
    ```
    or
    ```sh
    docker compose -f docker-compose.yaml -f docker-compose.dev.yaml build
    ```
5. Start containers

    ```sh
    make up
    ```
    or
    ```sh
    docker compose -f docker-compose.yaml -f docker-compose.dev.yaml up -d
    ```
    Frontend will be served at [localhost:3000](localhost:3000) (by default from .env variables)



## Development default link (.env)

- Next (client)

    ```sh
    localhost:3000
    ```
- Express (api)

    ```sh
    localhost:4000
    ```
- [pgAdmin (db)](https://www.pgadmin.org/)

    ```sh
    localhost:5050
    ```
- DB (port)

    ```sh
    localhost:5432
    ```



<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE.md` for more information.



<!-- CONTACT -->
## Contact

 [https://github.com/Oshchenkov](https://github.com/Oshchenkov)




<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->


[React.js]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[React-url]: https://reactjs.org/

[Node.js]: https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white
[Node-url]: https://nodejs.org/

[PostgreSQL]: https://img.shields.io/badge/postgresql-336690.svg?style=for-the-badge&logo=postgresql&logoColor=white
[PostgreSQL-url]: https://www.postgresql.org/

[Docker]: https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white
[Docker-url]: https://www.docker.com/

[Express]: https://img.shields.io/badge/express-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB
[Express-url]: https://expressjs.com/

[Express]: https://img.shields.io/badge/express-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB
[Express-url]: https://expressjs.com/

