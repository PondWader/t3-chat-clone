## Setup Guide

This guide walks you through the initial configuration process for the chat web app using the `bun run server:setup` command.

## Prerequisites

Before running the setup, ensure you have:

- Completed the installation process (see [Installing.md](Installing.md))
- A Discord application for OAuth2 authentication
- API keys from AI providers (optional)

## Running Setup

After installing dependencies with `bun i`, run the setup command:

```bash
bun run server:setup
```

You will be prompted to enter the application configuration. The setup process features two main configuration sections:

## 1. Discord OAuth2 Configuration

The setup will first prompt you to configure Discord OAuth2 authentication:

### Creating a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Navigate to the "OAuth2" section in the left sidebar
4. Note down your **Client ID** and **Client Secret**
5. In the "Redirects" section, add your redirect URL (e.g. `https://example.com/login` or `http://localhost:3000/login` for local development)

### Setup Prompts

```
◉ Discord OAuth2 Config
Please enter the client ID: [YOUR_DISCORD_CLIENT_ID]
Please enter the client secret: [YOUR_DISCORD_CLIENT_SECRET]
Please enter the redirect URL (should be <site URL>/login): [YOUR_REDIRECT_URL]
```

**What each field does:**

- **Client ID**: Public identifier for your Discord application
- **Client Secret**: Private key used to authenticate your application with Discord
- **Redirect URL**: Where Discord will redirect users after successful authentication

## 2. AI Provider API Keys

Next, you'll configure API keys for AI inference providers:

```
◉ Inference API Key Config
Leave an option empty to require the user to bring their own key.
Please enter your Groq key: [YOUR_GROQ_API_KEY_OR_EMPTY]
Please enter your OpenRouter key: [YOUR_OPENROUTER_API_KEY_OR_EMPTY]
```

### Key Behavior

**If you provide a server-side key:**

- All users can access models from that provider without needing their own API key
- Users will NOT see that provider in their "Bring Your Own Key" settings
- The server will handle all API calls for that provider

**If you leave a key empty:**

- Users must provide their own API key for that provider
- Users will see that provider as an option in their settings under "AI Provider API Keys"
- Each user's API key is used only for their requests

### Supported Providers

- **Groq**: Provides fast inference for Llama and Qwen models. Users can generate a free Groq key.

  - Models: Llama 3.1 8B Instant, Llama 3.3 70B Versatile, Qwen QwQ 32B
  - Get your key at: [https://console.groq.com/keys](https://console.groq.com/keys)

- **OpenRouter**: Provides access to various premium models.
  - Models: GPT-4o, Claude Sonnet 4, Gemini 2.5, DeepSeek R1, and more
  - Get your key at: [https://openrouter.ai/keys](https://openrouter.ai/keys)

## After Setup

Once setup is complete, you can start the server:

```bash
bun run server:start
```

Your app instance will be available at `http://localhost:3000` (or your configured port).

## Reconfiguring

To change your configuration later, simply run the setup command again:

```bash
bun run server:setup
```

This will overwrite your existing configuration with new values.
