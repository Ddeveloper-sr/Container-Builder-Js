const {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
} = require('discord.js');
const config = require('./config');
const logger = require('./logger');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();
client.prefix = config.PREFIX;

const helpCmd = require('./commands/help');
const builderCmd = require('./commands/builder');

client.commands.set('help', helpCmd);
client.commands.set('h', helpCmd);
client.commands.set('cmds', helpCmd);
client.commands.set('commands', helpCmd);

client.commands.set('container', builderCmd);
client.commands.set('build', builderCmd);
client.commands.set('cb', builderCmd);

client.once('ready', () => {
  logger.banner();
  logger.success('READY', `Logged in as ${client.user.tag} (ID: ${client.user.id})`);
  logger.info('READY', `Serving ${client.guilds.cache.size} guild(s)`);
  logger.success('READY', 'Bot is online and ready!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const mentionOnly =
    message.content.trim() === `<@${client.user.id}>` ||
    message.content.trim() === `<@!${client.user.id}>`;

  if (message.mentions.has(client.user) && mentionOnly) {
    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('### Container Builder')
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `Hey there, ${message.author}\n` +
            `Use \`${config.PREFIX}container\` to build and send Components V2 containers.\n` +
            `Run \`${config.PREFIX}help\` to see all available commands.`
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '-# Need help? [Join Support](https://discord.gg/Fej6jsX8vj)'
        )
      );

    await message.reply({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
      allowedMentions: { parse: [] },
    });
    return;
  }

  if (!message.content.startsWith(config.PREFIX)) return;

  const args = message.content.slice(config.PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const command = client.commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args, client);
  } catch (error) {
    logger.error('CMD', `Unhandled error in ${commandName}: ${error.message}`, error);
    try {
      await message.reply('An error occurred while running this command.');
    } catch {
      // ignore
    }
  }
});

client.on('error', (error) => {
  logger.error('CLIENT', error.message, error);
});

process.on('unhandledRejection', (error) => {
  logger.error('PROCESS', `Unhandled rejection: ${error?.message || error}`, error);
});

async function main() {
  const token = config.TOKEN;
  if (!token || token === 'your-token-here') {
    logger.error(
      'INIT',
      'No bot token configured. Set DISCORD_TOKEN in config.js or as an environment variable.'
    );
    process.exit(1);
  }

  logger.info('INIT', 'Bot is starting up');
  logger.info('INIT', 'Loading commands');
  logger.success('INIT', 'Loaded: help, container');

  await client.login(token);
}

main();
