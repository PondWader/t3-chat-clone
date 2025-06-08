### Sync Database

#### Terminology

- **Store** - Represents a schema for storing a specific data model.
- **Object** - Data that matches a schema for a specific store.

#### Stores

This package manages the storing and syncing of data.

There are two types of stores:

- **event stores:** These stores can have multiple instances per user.
- **singular stores:** These stores have a single instance per user.

Stores are automatically assigned to users.

When creating stores, rules can be created for what the client can and cannot do. These rules will be checked on the client and the server.

```ts
export const chatMessage = createStore({
  // The name of the store
  name: "chat_message",
  // event/singular
  type: "event",
  // The schema for objects that this store represents
  schema: {
    role: z.string(),
    content: z.string(),
  },
  // A function that will be run to check a store update is valid
  validateUpdate(action, object) {
    if (action === "create" && object.role !== "user") {
      throw new Error("Only user messages can be created!");
    }
    if (action !== "create" && action !== "delete") {
      throw new Error("Only create and delete actions can be performed.");
    }
  },
});
```

In this example, if the role is not a user, the update will be rejected. The server could then also trigger a job such as creating a response.

#### Client communication

Clients connect to the server via a WebSocket. The first message sent is the client hello:

```json
{
  "type": "client_hello",
  "data": {
    "syncStatus": {
      "chatMessage": "01974f63-6abc-7000-8107-66e6c9a45dda",
      "account": "01974f63-a721-7000-8d48-967521c55dd6"
    }
  }
}
```

This sends the sync status of the client, the last received ID of each store.

Event store instances will be streamed from newest to oldest in missed events. If the store is singular the old data will be overwritten and if it's an event store the received data will be appended.

This data is synced as follows:

```json
{
  "type": "update",
  "data": {
    "store": "chatMessage",
    "object": {
      "role": "assistant",
      "message": "Hello, how may I assist you?",
      "$createdAt": 1749383382805
    },
    "id": "01974f63-6abc-7000-8107-66e6c9a45dda"
  }
}
```

There are also partial, which may look like the following:

```json
{
  "type": "partial",
  "data": {
    "store": "chatMessage",
    "object": {
      "role": "assistant",
      "message": "Hello, how ",
      "$createdAt": 1749383382805
    },
    "id": "01974f64-f739-7000-bd20-3b5fb4ea793c"
  }
}
{
  "type": "update",
  "data": {
    "store": "chatMessage",
    "object": {
      "role": "assistant",
      "message": "Hello, how are you?",
      "$createdAt": 1749383382805
    },
    "id": "01974f64-f739-7000-bd20-3b5fb4ea793c"
  }
}
```

Partials are stored in memory until completed.

Deletes are stored and pushed as their own events, when an object is deleted, the original object is removed from storage and a new event is added to storage to represent the deletion.

```json
{
  "type": "remove",
  "data": {
    "id": "01974f64-f739-7000-bd20-3b5fb4ea793c"
  }
}
```

The client can also push updates to the server. When the client makes an update, it will apply the update locally (if the store is singular, in-memory only or if an event store, stored as an unsynced object) and then send the update to the server. If the client does not receive the object as an event within 10 seconds, the client should display an error to the user with the option to retry.

The client cannot create IDs so instead it will send a client ID:

```json
{
  "type": "update",
  "data": {
    "store": "chatMessage",
    "object": {
      "role": "user",
      "message": "hi",
      "$createdAt": 1749383382805
    },
    "clientId": "fed649ad-f26f-4fcb-ad05-d1b70049fa1f"
  }
}
```

And the server will include the client ID when publishing the event.

#### Server

The server creates a database like so:

```ts
const db = createDatabase({
  dbUrl: "sqlite://database.sqlite",
  stores: [chatMessage, account],
});

db.subscribe(chatMessage, async (event, ctx) => {
  if (event.action === "create") {
    await db.push(ctx, chatMessage, {
      role: "assistant",
      message: "Hello, how can I help you?",
    });
  }
});
```

This basic example will respond to every message with "Hello, how can I help you?".
