# HonoMart API

This project is built for the articles related to monitoring and observability.

### Prerequisites

You need to get the dependant services up and running with docker compose:

```sh
docker compose up -d
```

To install dependencies:

```sh
bun install
```

To run:

```sh
bun run dev
```

To generate some logs, you can use the tests. For example:

```sh
LOG_LEVEL=debug bun run test products.test
```
