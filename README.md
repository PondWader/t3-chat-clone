## T3 Chat Clone (actual name coming soon hopefully)

An open source AI chat app built for the t3.chat cloneathon. Built for a snappy, smooth experience. Features client side caching, device syncing, chat sharing, chat branching and more.

### Features

##### Listed:

✔ Lightweight syntax highlighting  
✔ Authentication & sync  
✔ Image uploads  
✔ Syntax highlighting  
✔ Chat branching  
✔ Web Search  
✔ Chat sharing  
✔ Resumable streams  
✔ Bring your own key

##### Extra:

✔ Sync between devices without an account by scanning QR code/entering link.  
✔ Short response mode
✔ Writer mode

## Documentation

Comprehensive documentation is available in the `docs` directory:

### Getting Started

- [Installing](./docs/Installing.md) - Installation and setup instructions
- [Setup Guide](./docs/Setup.md) - Configuration walkthrough

### Features & Usage

- [AI Models & Providers](./docs/AI-Models.md) - Supported models and API configuration
- [Data Syncing](./docs/Syncing.md) - User accounts and device sync
- [Writer Mode](./docs/Writer.md) - Guide to writer mode
- [Title Model](./docs/Title-Model.md) - Guide to writer mode

## Quick start

First install the project dependencies:

```
bun i
```

Then run

```
bun run server:setup
```

Finally start the server by running

```
bun run server:start
```

By default this will listen on port 3000 and use a SQLite database in your current directory called `database.sqlite`.

#### Environment Variables

| Variable      | Description                                                                     |
| ------------- | ------------------------------------------------------------------------------- |
| PORT          | The port for the web server to listen on.                                       |
| DB_URL        | The URL of the database e.g. `sqlite://database.sqlite`.                        |
| CDN_DIRECTORY | The directory to store user uploads in (default `./user_content`)               |
| TITLE_MODEL   | The AI model to use for generating chat titles (default `llama-3.1-8b-instant`) |

#### Developing

To enable development mode for the web app set the `NODE_ENV` environment variable to `development`.

The app is made up of 4 packages found in the `./packages` directory:

| Package | Description                                                                                                                                                                                                                                                                                               |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| app     | The Preact web app.                                                                                                                                                                                                                                                                                       |
| db      | The sync engine that stores data and syncs data with the client. This package is split into two parts. The `./server` directory contains the logic for receiving client connections and handling database data updates. The `./client` directory contains the WebSocket client and IndexedDB sync engine. |
| server  | The entrypoint for the application. Launches the web server and provides authentication, CDN upload handling etc.                                                                                                                                                                                         |
| stores  | Provides the sync engine stores used by the both client and server.                                                                                                                                                                                                                                       |
