# Sintrop OS Contracts
Sintrop OperatingSystem native applications and core contracts.

## Project introduction 
Main Sintrop's blockchain Operating System contracts. This repo acts as a smart contract development center and public database for the smart contracts.

Any project that helps to impact positevely the environment is welcome.

## Getting Started

New contributors that want to fight for Nature are very welcome and needed.
Before you start contributing, familiarize yourself with the Sintrop Core sofware and with the development of smart contracts.

## How to contribute
You can contribute:

- Testing the code
- Auditing the code
- Reviewing the code
- Optimizing the code

## Commits and Pull Requests Rules
Each Pull Request must be associated with an existing issue. Each Pull Request must change only necessary lines and in case that you want to implement a different feature, open a new issue.

To commit files, create a new branch with the issue that is being solved. 
Example:
issue75-add-new-contract

To open a PR, associate it to the properly issue and select at least 2 other developers to review the code.
Before it, make sure that all tests are passing.

## How to run locally the contracts
To run the project and start contributing please follow the tutorial:

### Pre-requisites

Docker installed

### Run with the docker

1) Build the container

```
docker-compose up -d
```

2) Run the container

```
docker exec -it SINTROP-OS-APPS bash
```

### Deploy on localhost

1) Set up local node

```
npx hardhat node
```

2) Deploy on localhost

```
npm run deploy:localhost
```

### Run test units

```
npx hardhat test
```
