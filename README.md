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

### Starting the server

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

| Variable      | Description                                                       |
| ------------- | ----------------------------------------------------------------- |
| PORT          | The port for the web server to listen on.                         |
| DB_URL        | The URL of the database e.g. `sqlite://database.sqlite`.          |
| CDN_DIRECTORY | The directory to store user uploads in (default `./user_content`) |
