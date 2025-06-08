### Starting the server

First install the project dependencies:

```
bun i
```

Then run

```
bun run server:start
```

By default this will listen on port 3000 and use a SQLite database in your current directory called `database.sqlite`.

#### Environment Variables

| Variable | Description                                              |
| -------- | -------------------------------------------------------- |
| PORT     | The port for the web server to listen on.                |
| DB_URL   | The URL of the database e.g. `sqlite://database.sqlite`. |
