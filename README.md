# ContainerBuilder Bot

A Discord bot built with **discord.js** that lets users interactively build and send **Components V2** containers directly from Discord — no code required. Uses select menus, buttons, and modals for a fully in-Discord editing experience.

**Developer:** Ddeveloper  
**Support Server:** [discord.gg/Fej6jsX8vj](https://discord.gg/Fej6jsX8vj)

---

## Features

- Interactive container builder with live preview that updates as you build
- 5 component types: Text Display, Separator, Section & Thumbnail, Media Gallery, Button Row
- Add, edit, remove, and reorder components at any time
- 8 accent color options for the container
- Send the finished container to any text channel
- Author-only interaction guard — only the command runner can use the controls
- Fully Components V2 — no legacy embeds
- 10-minute inactivity timeout

---

## Requirements

- Node.js 18 or higher
- `discord.js` ^14.19.0 (Components V2 support)

```bash
npm install
```

---

## Setup

### 1. Install dependencies

```bash
cd Container-Builder-JS
npm install
```

### 2. Configure the bot

Set the `DISCORD_TOKEN` environment variable to your bot token:

```bash
export DISCORD_TOKEN=your-token-here
```

Or set it directly in `config.js`:

```js
module.exports = {
  TOKEN: 'your-token-here',
  PREFIX: '!',
};
```

### 3. Enable required Privileged Intents

In the [Discord Developer Portal](https://discord.com/developers/applications), navigate to your bot and enable:

- **Server Members Intent**
- **Message Content Intent**

### 4. Run the bot

```bash
npm start
# or
node index.js
```

---

## Commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `!container` | `!build`, `!cb` | Open the interactive container builder |
| `!help` | `!h`, `!cmds`, `!commands` | Show help information |

---

## Components

| Type | Description |
|------|-------------|
| **Text Display** | A block of text with full markdown support |
| **Separator** | A visible divider line or invisible spacer |
| **Section & Thumbnail** | Text alongside a thumbnail image on the right |
| **Media Gallery** | Up to 10 images in a grid layout |
| **Button Row** | Up to 5 link (redirect) buttons in a row |

---

## File Structure

```
Container-Builder-JS/
├── index.js          # Bot entry point
├── config.js         # Token and prefix configuration
├── logger.js         # Coloured console + file logger
├── package.json      # Node dependencies
│
└── commands/
    ├── builder.js    # Interactive container builder (all logic)
    └── help.js       # Help command
```

---

## Permissions

| Permission | Reason |
|-----------|--------|
| Read Messages / View Channels | Read and respond to commands |
| Send Messages | Send containers and responses |
| Read Message History | Required for some channel operations |

---

## Support

Join the support server for help, bug reports, and updates:  
[discord.gg/Fej6jsX8vj](https://discord.gg/Fej6jsX8vj)
