# Flex Marketplace Backend Mono Repo

This repository contains the backend code for the Flex Marketplace project. It is organized as a monorepo using Yarn workspaces, with separate packages for different services and shared code.

## Packages

The repository is structured as follows:

- `shared`: Contains shared code used by multiple services.
- `marketplace-servie`: Manages user-related, marketplace-related functionality.
- `coin-price-service`: Provides coin price services.
- `onchain-worker`: Listen event on blockchain, automatically executes some events.
- `offchain-worker`: Handles refresh metadata.

## Installation

To install all dependencies, run the following command:

```shell
yarn install
```

## Installing libraries for a specific Package

```shell
yarn workspace <package name> add <library>
```

Replace `<package name>` with the name of the package you want to install library. For example, to install starknet the `onchain-worker` package, run:

```shell
yarn workspace onchain-worker add starknet@next
```

## Starting a Package

To start a specific package, use the following command:

```shell
yarn workspace <package name> start
```

Replace `<package name>` with the name of the package you want to start. For example, to start the `onchain-worker` package, run:

```shell
yarn workspace onchain-worker start
```

## Shared Package

The `shared` package contains shared code and configuration for the project.

### Configuration

The shared configuration for the project can be found in the `shared/configuration.ts` file. Modify this file to adjust the configuration settings according to your needs.

### `dtos`

The `dtos` directory is where you can find the DTO (Data Transfer Object) definitions. DTOs are used to define the structure of data transferred between different parts of the application. Each file in this directory represents a specific DTO.

### `models`

The `models` directory contains the schema definitions for models used in the application. These models define the structure and behavior of the data entities in the system. Each file in this directory represents a specific model.

## Contributing

As this is a private repository, contributions are not accepted at this time.

## License

Apache License Version 2.0, January 2004
