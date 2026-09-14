# Changelog

## [1.2.0](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/compare/v1.1.0...v1.2.0) (2026-09-14)


### Features

* add stable history notification identifiers ([81ab962](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/81ab962c7fb315a3aa0d40bdf13a3d4eb3c0a938))
* add stable notification IDs ([50f72ce](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/50f72ce1df815892b23f5ed5f93e5ca98ff05629))
* **database:** Model migration ajusted ([d6c870e](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/d6c870e6916f634e767d15ba011504be33b54bb1))
* define Kafka notification contracts ([b34d0fb](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/b34d0fbd9fe9c6195285df73d8970cba3db3b810))
* define Kafka notification contracts ([d716174](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/d716174ca8d87d8ea86d3449ed1691b4d82ce90f))
* migrate consumers to a single id ([0faf143](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/0faf1430393d647b80a985d1f9078ed0c108c364))
* migrate consumers to a single id ([f98b805](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/f98b8055fec17521c570737b1eced23d603ada3c))
* notify signed-in users ([f9bf564](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/f9bf56433a980ae7971b15145df225cce264ef5a))
* restore annual birthday notification eligibility ([70b4004](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/70b4004e73eec72072386c34c73399ecb4e9905a))
* restore annual birthday notification eligibility ([3c3ebfc](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/3c3ebfcc98d7f6043dd7ef5014bb48ce20cc7fc9))
* route welcome outbox notifications ([8687177](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/8687177c1c1328de07fdda8d4608605da99068a2))
* route welcome outbox notifications ([01ddeb1](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/01ddeb19034c75020f91f68ce9e4e99dbaa9e5d7))
* schedule retryable notification recovery ([133b2a3](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/133b2a3f53b6bd7b3e5fb46ce014c66af4fff65a))
* schedule retryable notification recovery ([bcf929f](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/bcf929f18d5f201bf5a3686406435597efc86bc1))


### Bug Fixes

* handle invalid sign-in outbox entries ([bdb0ece](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/bdb0eceea6176934a6f36b3d9dcfe0edf7ea6942))
* recover notification processing failures ([ef74794](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/ef74794c5fad8ea7810169d252668691a44301ce))
* recover notification processing failures ([accf364](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/accf36443f8fcacd4760f8bf892427c9e879311d))
* route invalid sign-in outbox entries ([7fe28a8](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/7fe28a89e204112b97a0994c2d3d53fce3c4113a))

## [1.1.0](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/compare/v1.0.0...v1.1.0) (2026-09-03)


### Features

* **application,infrastructure:** Se ajustan repositorios y se agrega caso de uso faltante ([4cfe3fd](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/4cfe3fd220a2872b7fead360b2d11d6bd0a5814c))
* **application:** Se impletan 4 casos de uso ([f9ce001](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/f9ce0016d5c8fcae15f8136c325973b923287228))
* **app:** Se finaliza implementacion de logica ([e65306a](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/e65306ab920f6b16d166fb9f9b63d2aa0ccdb9c8))
* **docker, ci:** docker-compose added & ci prima generate added ([71db7e7](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/71db7e7663783e559b28c34c67d756787befae23))
* **domain, infrastructure-prisma:** Implementacion base de dominio e infrastructure con prisma ([1215de0](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/1215de004a950187efcf4d13b1073267ec6b1e45))
* **infrastructure:** Se agrega implementacion base para kafka ([95e2259](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/95e22598e39f7a700937d1614f8d060cbd5b2d05))
* **infrastructure:** Se ajustan modelos y repositorios ([cca998b](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/cca998b8ae99db9239440111c543963674070c08))
* **infrastructure:** Se implementa consumers y cronjobs para casos de uso ([1b587fb](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/1b587fba8a2778eea8248ac2b10f832ae96bb67e))
* **modules:** Implementacion base de modulos ([4049c52](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/4049c52e32809871176d6b42b7e8203297d241dd))
* **readme:** Readme updated ([d3bf98e](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/d3bf98e836052416d6546092f9a8c9f8cedaa617))
* **release-please:** configs for release-please and PR protections ([9007fa2](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/9007fa2606987c4472b73d2170bb2386feecf18a))
* **release-please:** configs for release-please and PR protections ([f9c510a](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/f9c510a261b8d58b1dd4c3c6ad347784d26c770d))
* **unit test, integration test:** Se agregan unit test e integration test ([8d01e95](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/8d01e950c18676a1ace85b08961a7875169554ff))
* **unit test:** Se inicia implementacion de unit test ([307cb9b](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/307cb9b388b12c8ecefc10abac063b6656a8ac46))


### Bug Fixes

* **ci:** ci.yml deleted ([a6f399a](https://github.com/CarlosSV923/VaultHistory.Microservice.Jobs/commit/a6f399a42174f0ec4a522f63263823a356d6bc61))

## Changelog

All notable changes to this project will be documented in this file.

This project uses Release Please to generate release notes from Conventional Commits.
