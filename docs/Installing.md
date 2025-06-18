## Installing

#### Cloning Git repository

To start, you should clone the Git repository (ensure you have [Git](https://git-scm.com/) installed) by running the following command in your terminal:

```
git clone https://github.com/PondWader/t3-chat-clone
```

Next choose how you want to run the server:

- [System Install](#plain-install)
- [Using Docker](#using-docker)

## System Install

#### Bun

To run the server you will need [Bun](https://bun.sh) installed. On Linux/MacOS this as simple as running:

```
curl -fsSL https://bun.sh/install | bash
```

and on Windows you can run:

```
powershell -c "irm bun.sh/install.ps1 | iex"
```

You can find more informatioon about installing Bun on [the official docs page](https://bun.sh/docs/installation).

#### Setup

To run the setup command enter the directory of the project and run:

```
bun run server:setup
```

You can read the [setup](Setup.md) guide to learn what to do at this step.

After you have completed the setup you can run:

```
bun run server:start
```

and open http://localhost:3000 in your browser to use the website.

## Using Docker

Enter the directory of the project and build the image:

```
docker build --pull -t t3-chat-clone .
```

To execute the setup script run:

```
docker run --entrypoint bun -it t3-chat-clone run server:setup
```

You can read the [setup](Setup.md) guide to learn what to do at this step.

To start the server run:

```
docker run -p 3000:3000 t3-chat-clone
```

You should now be able to visit http://localhost:3000 in your browser and use the website.
