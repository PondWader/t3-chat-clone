# Title Model

The title model is the model that is used to generate chat titles. By default this is `llama-3.1-8b-instant` but this can be configured by setting the `TITLE_MODEL` environment variable.

This must be a valid model ID from [models.ts](/packages/server/models.ts) (a key from a provider's object).

It is recommended that the title model has a server key configured from the [setup](./Setup.md) process otherwise if the user has not provided a key titles will not be generated.
