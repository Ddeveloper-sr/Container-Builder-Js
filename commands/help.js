const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');

module.exports = {
  name: 'help',
  aliases: ['h', 'cmds', 'commands'],
  async execute(message) {
    const container = new ContainerBuilder()
      .setAccentColor(0xffffff)
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('## ContainerBuilder — Help')
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '-# Build and send Components V2 containers interactively — ' +
            'live preview updates as you add and edit components.'
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '**Command**\n' +
            '`!container` — aliases: `!build`, `!cb`\n' +
            'Opens the builder. A live preview and control panel are sent together.'
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent('**Components  (max 20 per container)**')
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(false))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '- **Text Display** — a block of text with full markdown support\n' +
            '- **Separator** — a visible divider line or an invisible spacer\n' +
            '- **Section & Thumbnail** — text alongside an image on the right\n' +
            '- **Media Gallery** — up to 10 images in a grid layout\n' +
            '- **Button Row** — up to 5 link buttons in a single row'
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          '-# Only the person who ran the command can use the controls.\n' +
            '-# The builder times out after 10 minutes of inactivity.'
        )
      )
      .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
      .addActionRowComponents(
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setLabel('Support')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/Fej6jsX8vj')
        )
      );

    await message.channel.send({
      components: [container],
      flags: MessageFlags.IsComponentsV2,
    });
  },
};
