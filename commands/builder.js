
const {
  MessageFlags,
  ContainerBuilder,
  TextDisplayBuilder,
  SeparatorBuilder,
  SeparatorSpacingSize,
  SectionBuilder,
  ThumbnailBuilder,
  MediaGalleryBuilder,
  MediaGalleryItemBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ChannelSelectMenuBuilder,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ComponentType,
} = require('discord.js');

// ── Color palette ─────────────────────────────────────────────────────────────

const COLORS = {
  none: null,
  blurple: 0x5865f2,
  red: 0xed4245,
  green: 0x57f287,
  blue: 0x3498db,
  orange: 0xe67e22,
  dark_grey: 0x2c2f33,
  white: 0xffffff,
};

const COLOR_NAMES = {
  none: 'None',
  blurple: 'Blurple',
  red: 'Red',
  green: 'Green',
  blue: 'Blue',
  orange: 'Orange',
  dark_grey: 'Dark Grey',
  white: 'White',
};

const MAX_COMPONENTS = 20;
const TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

// ── Helpers ───────────────────────────────────────────────────────────────────

function compLabel(comp, i) {
  const t = comp.type;
  if (t === 'text') {
    const p = comp.content.slice(0, 45).replace(/\n/g, ' ');
    return `${i + 1}. Text — ${p}`;
  }
  if (t === 'separator') {
    const kind = comp.divider !== false ? 'line' : 'spacer';
    return `${i + 1}. Separator (${comp.spacing || 'small'}, ${kind})`;
  }
  if (t === 'section') {
    const p = comp.content.slice(0, 40).replace(/\n/g, ' ');
    return `${i + 1}. Section — ${p}`;
  }
  if (t === 'media_gallery') {
    const n = comp.urls.length;
    return `${i + 1}. Gallery (${n} image${n !== 1 ? 's' : ''})`;
  }
  if (t === 'button_row') {
    const labels = comp.buttons
      .slice(0, 3)
      .map((b) => b.label)
      .join(', ');
    const suffix = comp.buttons.length > 3 ? '...' : '';
    return `${i + 1}. Buttons — ${labels}${suffix}`;
  }
  return `${i + 1}. Unknown`;
}

function renderInto(container, comp) {
  const t = comp.type;
  if (t === 'text') {
    container.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(comp.content)
    );
  } else if (t === 'separator') {
    const sp =
      comp.spacing === 'large'
        ? SeparatorSpacingSize.Large
        : SeparatorSpacingSize.Small;
    container.addSeparatorComponents(
      new SeparatorBuilder()
        .setDivider(comp.divider !== false)
        .setSpacing(sp)
    );
  } else if (t === 'section') {
    const url = comp.thumbnail_url;
    if (url) {
      const section = new SectionBuilder()
        .addTextDisplayComponents(
          new TextDisplayBuilder().setContent(comp.content)
        )
        .setThumbnailAccessory(new ThumbnailBuilder().setURL(url));
      container.addSectionComponents(section);
    } else {
      container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(comp.content)
      );
    }
  } else if (t === 'media_gallery') {
    if (comp.urls && comp.urls.length) {
      const gallery = new MediaGalleryBuilder();
      for (const u of comp.urls) {
        gallery.addItems(new MediaGalleryItemBuilder().setURL(u));
      }
      container.addMediaGalleryComponents(gallery);
    }
  } else if (t === 'button_row') {
    if (comp.buttons && comp.buttons.length) {
      const row = new ActionRowBuilder().addComponents(
        ...comp.buttons.slice(0, 5).map((b) =>
          new ButtonBuilder()
            .setLabel(b.label)
            .setStyle(ButtonStyle.Link)
            .setURL(b.url)
        )
      );
      container.addActionRowComponents(row);
    }
  }
}

// ── State store (messageId → state) ───────────────────────────────────────────

const sessions = new Map();

function getSession(messageId) {
  return sessions.get(messageId);
}

function setSession(messageId, state) {
  sessions.set(messageId, state);
}

function deleteSession(messageId) {
  sessions.delete(messageId);
}

// ── Build UI components ───────────────────────────────────────────────────────

function buildPreview(state) {
  const c = new ContainerBuilder();
  if (state.colorKey !== 'none' && COLORS[state.colorKey] != null) {
    c.setAccentColor(COLORS[state.colorKey]);
  }
  if (!state.data.length) {
    c.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '-# Your container is empty. Use the controls below to add components.'
      )
    );
  } else {
    for (const comp of state.data) {
      renderInto(c, comp);
    }
  }
  return c;
}

function buildCtrlNormal(state) {
  const c = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Container Builder**')
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# Color: **${COLOR_NAMES[state.colorKey]}**  |  Components: **${state.data.length} / ${MAX_COMPONENTS}**`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(false));

  const atMax = state.data.length >= MAX_COMPONENTS;
  const addSelect = new StringSelectMenuBuilder()
    .setCustomId('ctrl_add')
    .setPlaceholder(
      atMax
        ? `Maximum ${MAX_COMPONENTS} components reached`
        : 'Add a component...'
    )
    .setDisabled(atMax)
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('Text Display')
        .setValue('text')
        .setDescription('A block of markdown text'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Separator')
        .setValue('separator')
        .setDescription('A divider line or invisible spacer'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Section & Thumbnail')
        .setValue('section')
        .setDescription('Text with a thumbnail image on the right'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Media Gallery')
        .setValue('media_gallery')
        .setDescription('One or more images in a grid'),
      new StringSelectMenuOptionBuilder()
        .setLabel('Button Row')
        .setValue('button_row')
        .setDescription('Up to 5 redirect (link) buttons in a row')
    );

  c.addActionRowComponents(new ActionRowBuilder().addComponents(addSelect));

  const has = state.data.length > 0;
  const canReorder = state.data.length >= 2;

  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ctrl_edit')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!has),
      new ButtonBuilder()
        .setCustomId('ctrl_remove')
        .setLabel('Remove')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(!has),
      new ButtonBuilder()
        .setCustomId('ctrl_color')
        .setLabel('Color')
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId('ctrl_reorder')
        .setLabel('Reorder')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!canReorder),
      new ButtonBuilder()
        .setCustomId('ctrl_send')
        .setLabel('Send')
        .setStyle(ButtonStyle.Primary)
    )
  );

  return c;
}

function buildCtrlColor(state) {
  const c = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Select Accent Color**')
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '-# Choose the color bar shown on the left side of the container.'
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(false));

  const opts = Object.entries(COLOR_NAMES).map(([key, name]) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(name)
      .setValue(key)
      .setDefault(key === state.colorKey)
  );

  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ctrl_color_sel')
        .setPlaceholder('Choose a color...')
        .addOptions(opts)
    )
  );

  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ctrl_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    )
  );

  return c;
}

function buildCompOptions(state, forReorder = false) {
  return state.data.map((comp, i) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(compLabel(comp, i).slice(0, 100))
      .setValue(String(i))
      .setDefault(forReorder && i === state.reorderIndex)
  );
}

function buildCtrlEdit(state) {
  const c = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Edit a Component**')
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '-# Select the component you want to edit.'
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(false));

  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ctrl_edit_sel')
        .setPlaceholder('Select a component to edit...')
        .addOptions(buildCompOptions(state))
    )
  );

  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ctrl_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    )
  );

  return c;
}

function buildCtrlRemove(state) {
  const c = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Remove a Component**')
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '-# Select the component you want to remove.'
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(false));

  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ctrl_remove_sel')
        .setPlaceholder('Select a component to remove...')
        .addOptions(buildCompOptions(state))
    )
  );

  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ctrl_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    )
  );

  return c;
}

function buildCtrlReorder(state) {
  const c = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Reorder Components**')
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true));

  if (state.reorderIndex != null) {
    const label = compLabel(state.data[state.reorderIndex], state.reorderIndex);
    c.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `-# Selected: **${label.slice(0, 80)}**`
      )
    );
  } else {
    c.addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '-# Select a component below, then use Move Up / Move Down.'
      )
    );
  }

  c.addSeparatorComponents(new SeparatorBuilder().setDivider(false));

  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('ctrl_reorder_sel')
        .setPlaceholder('Select a component to move...')
        .addOptions(buildCompOptions(state, true))
    )
  );

  const canUp = state.reorderIndex != null && state.reorderIndex > 0;
  const canDown =
    state.reorderIndex != null &&
    state.reorderIndex < state.data.length - 1;

  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ctrl_move_up')
        .setLabel('Move Up')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!canUp),
      new ButtonBuilder()
        .setCustomId('ctrl_move_down')
        .setLabel('Move Down')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!canDown),
      new ButtonBuilder()
        .setCustomId('ctrl_reorder_done')
        .setLabel('Done')
        .setStyle(ButtonStyle.Primary)
    )
  );

  return c;
}

function buildCtrlSend() {
  const c = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Send Container**')
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        '-# Select the channel to send your container to.'
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(false));

  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ChannelSelectMenuBuilder()
        .setCustomId('ctrl_channel_sel')
        .setPlaceholder('Select a channel...')
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    )
  );

  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ctrl_cancel')
        .setLabel('Cancel')
        .setStyle(ButtonStyle.Secondary)
    )
  );

  return c;
}

function buildCtrlSent(channelMention) {
  const c = new ContainerBuilder()
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent('**Container Sent**')
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(true))
    .addTextDisplayComponents(
      new TextDisplayBuilder().setContent(
        `Your container was sent to ${channelMention}.`
      )
    )
    .addSeparatorComponents(new SeparatorBuilder().setDivider(false));

  c.addActionRowComponents(
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('ctrl_reset')
        .setLabel('Build Another')
        .setStyle(ButtonStyle.Secondary)
    )
  );

  return c;
}

function rebuildComponents(state, sentMention = null) {
  const components = [buildPreview(state)];

  switch (state.mode) {
    case 'normal':
      components.push(buildCtrlNormal(state));
      break;
    case 'color':
      components.push(buildCtrlColor(state));
      break;
    case 'edit':
      components.push(buildCtrlEdit(state));
      break;
    case 'remove':
      components.push(buildCtrlRemove(state));
      break;
    case 'reorder':
      components.push(buildCtrlReorder(state));
      break;
    case 'send':
      components.push(buildCtrlSend());
      break;
    case 'sent':
      components.push(buildCtrlSent(sentMention || 'the selected channel'));
      break;
  }

  return components;
}

// ── Modal builders ────────────────────────────────────────────────────────────

function makeTextModal(index = null) {
  const modal = new ModalBuilder()
    .setCustomId(index != null ? `modal_text_${index}` : 'modal_text_new')
    .setTitle(index != null ? 'Edit Text Display' : 'Add Text Display');

  const field = new TextInputBuilder()
    .setCustomId('content')
    .setLabel('Content')
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(
      'Supports full markdown: **bold**, ### heading, > blockquote...'
    )
    .setRequired(true)
    .setMaxLength(2000);

  modal.addComponents(new ActionRowBuilder().addComponents(field));
  return modal;
}

function makeSeparatorModal(index = null) {
  const modal = new ModalBuilder()
    .setCustomId(
      index != null ? `modal_separator_${index}` : 'modal_separator_new'
    )
    .setTitle(index != null ? 'Edit Separator' : 'Add Separator');

  const divider = new TextInputBuilder()
    .setCustomId('divider')
    .setLabel('Show divider line? (yes / no)')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(3)
    .setRequired(true)
    .setValue('yes');

  const spacing = new TextInputBuilder()
    .setCustomId('spacing')
    .setLabel('Spacing (small / large)')
    .setStyle(TextInputStyle.Short)
    .setMaxLength(5)
    .setRequired(true)
    .setValue('small');

  modal.addComponents(
    new ActionRowBuilder().addComponents(divider),
    new ActionRowBuilder().addComponents(spacing)
  );
  return modal;
}

function makeSectionModal(index = null) {
  const modal = new ModalBuilder()
    .setCustomId(index != null ? `modal_section_${index}` : 'modal_section_new')
    .setTitle(index != null ? 'Edit Section' : 'Add Section & Thumbnail');

  const text = new TextInputBuilder()
    .setCustomId('content')
    .setLabel('Text Content')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMaxLength(1000);

  const url = new TextInputBuilder()
    .setCustomId('thumbnail_url')
    .setLabel('Thumbnail URL (optional — leave blank to skip)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setPlaceholder('https://example.com/image.png')
    .setMaxLength(500);

  modal.addComponents(
    new ActionRowBuilder().addComponents(text),
    new ActionRowBuilder().addComponents(url)
  );
  return modal;
}

function makeGalleryModal(index = null) {
  const modal = new ModalBuilder()
    .setCustomId(index != null ? `modal_gallery_${index}` : 'modal_gallery_new')
    .setTitle(index != null ? 'Edit Media Gallery' : 'Add Media Gallery');

  const urls = new TextInputBuilder()
    .setCustomId('urls')
    .setLabel('Image URLs — one per line, max 10')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder(
      'https://example.com/image1.png\nhttps://example.com/image2.png'
    )
    .setMaxLength(4000);

  modal.addComponents(new ActionRowBuilder().addComponents(urls));
  return modal;
}

function makeButtonRowModal(index = null) {
  const modal = new ModalBuilder()
    .setCustomId(
      index != null ? `modal_button_row_${index}` : 'modal_button_row_new'
    )
    .setTitle(index != null ? 'Edit Button Row' : 'Add Button Row');

  const input = new TextInputBuilder()
    .setCustomId('buttons')
    .setLabel('Buttons — one per line: Label :: https://url')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setPlaceholder(
      'Discord :: https://discord.com\nGitHub :: https://github.com'
    )
    .setMaxLength(1000);

  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return modal;
}

// Pre-fill modals when editing
function prefillModal(modal, existing) {
  if (!existing) return modal;
  const type = existing.type;
  // We rebuild with defaults already; for edit we set values via setValue on inputs
  // Since ModalBuilder components are already built, we recreate with values.
  if (type === 'text') {
    const m = makeTextModal(
      existing.__index != null ? existing.__index : null
    );
    // re-add with default
    const field = new TextInputBuilder()
      .setCustomId('content')
      .setLabel('Content')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder(
        'Supports full markdown: **bold**, ### heading, > blockquote...'
      )
      .setRequired(true)
      .setMaxLength(2000)
      .setValue(existing.content || '');
    m.setComponents(new ActionRowBuilder().addComponents(field));
    return m;
  }
  if (type === 'separator') {
    const m = makeSeparatorModal(
      existing.__index != null ? existing.__index : null
    );
    const divider = new TextInputBuilder()
      .setCustomId('divider')
      .setLabel('Show divider line? (yes / no)')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(3)
      .setRequired(true)
      .setValue(existing.divider !== false ? 'yes' : 'no');
    const spacing = new TextInputBuilder()
      .setCustomId('spacing')
      .setLabel('Spacing (small / large)')
      .setStyle(TextInputStyle.Short)
      .setMaxLength(5)
      .setRequired(true)
      .setValue(existing.spacing || 'small');
    m.setComponents(
      new ActionRowBuilder().addComponents(divider),
      new ActionRowBuilder().addComponents(spacing)
    );
    return m;
  }
  if (type === 'section') {
    const m = makeSectionModal(
      existing.__index != null ? existing.__index : null
    );
    const text = new TextInputBuilder()
      .setCustomId('content')
      .setLabel('Text Content')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(1000)
      .setValue(existing.content || '');
    const url = new TextInputBuilder()
      .setCustomId('thumbnail_url')
      .setLabel('Thumbnail URL (optional — leave blank to skip)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setPlaceholder('https://example.com/image.png')
      .setMaxLength(500)
      .setValue(existing.thumbnail_url || '');
    m.setComponents(
      new ActionRowBuilder().addComponents(text),
      new ActionRowBuilder().addComponents(url)
    );
    return m;
  }
  if (type === 'media_gallery') {
    const m = makeGalleryModal(
      existing.__index != null ? existing.__index : null
    );
    const urls = new TextInputBuilder()
      .setCustomId('urls')
      .setLabel('Image URLs — one per line, max 10')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder(
        'https://example.com/image1.png\nhttps://example.com/image2.png'
      )
      .setMaxLength(4000)
      .setValue((existing.urls || []).join('\n'));
    m.setComponents(new ActionRowBuilder().addComponents(urls));
    return m;
  }
  if (type === 'button_row') {
    const m = makeButtonRowModal(
      existing.__index != null ? existing.__index : null
    );
    const existingText = (existing.buttons || [])
      .map((b) => `${b.label} :: ${b.url}`)
      .join('\n');
    const input = new TextInputBuilder()
      .setCustomId('buttons')
      .setLabel('Buttons — one per line: Label :: https://url')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setPlaceholder(
        'Discord :: https://discord.com\nGitHub :: https://github.com'
      )
      .setMaxLength(1000)
      .setValue(existingText);
    m.setComponents(new ActionRowBuilder().addComponents(input));
    return m;
  }
  return modal;
}

// ── Interaction handler (registered once on the client) ───────────────────────

let handlerAttached = false;

function attachInteractionHandler(client) {
  if (handlerAttached) return;
  handlerAttached = true;

  client.on('interactionCreate', async (interaction) => {
    // Only handle interactions that belong to a builder session
    if (
      !interaction.isButton() &&
      !interaction.isStringSelectMenu() &&
      !interaction.isChannelSelectMenu() &&
      !interaction.isModalSubmit()
    ) {
      return;
    }

    const messageId = interaction.message?.id;
    let state = messageId ? getSession(messageId) : null;

    // Modal submits don't have message in the same way for customId parsing
    if (interaction.isModalSubmit()) {
      const cid = interaction.customId;
      if (!cid.startsWith('modal_')) return;

      // Find state by looking through sessions for matching author
      // Modals are tied to the interaction that opened them; we store authorId
      // and use the message that was being edited.
      // The original message is available via interaction.message when editing.
      if (!interaction.message) return;
      state = getSession(interaction.message.id);
      if (!state) return;
      if (interaction.user.id !== state.authorId) {
        await interaction.reply({
          content:
            'Only the person who ran this command can use these controls.',
          ephemeral: true,
        });
        return;
      }

      await handleModalSubmit(interaction, state);
      return;
    }

    if (!state) return;
    if (interaction.user.id !== state.authorId) {
      await interaction.reply({
        content:
          'Only the person who ran this command can use these controls.',
        ephemeral: true,
      });
      return;
    }

    // Reset timeout
    clearTimeout(state.timeout);
    state.timeout = setTimeout(() => {
      deleteSession(messageId);
    }, TIMEOUT_MS);

    try {
      await handleControl(interaction, state);
    } catch (err) {
      console.error('Builder interaction error:', err);
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: 'Something went wrong. Please try again.',
            ephemeral: true,
          });
        }
      } catch {
        // ignore
      }
    }
  });
}

async function updateView(interaction, state, sentMention = null) {
  const components = rebuildComponents(state, sentMention);
  await interaction.update({
    components,
    flags: MessageFlags.IsComponentsV2,
  });
}

async function handleControl(interaction, state) {
  const id = interaction.customId;

  if (id === 'ctrl_add' && interaction.isStringSelectMenu()) {
    const value = interaction.values[0];
    let modal;
    if (value === 'text') modal = makeTextModal();
    else if (value === 'separator') modal = makeSeparatorModal();
    else if (value === 'section') modal = makeSectionModal();
    else if (value === 'media_gallery') modal = makeGalleryModal();
    else if (value === 'button_row') modal = makeButtonRowModal();
    else return;
    await interaction.showModal(modal);
    return;
  }

  if (id === 'ctrl_edit') {
    state.mode = 'edit';
    await updateView(interaction, state);
    return;
  }

  if (id === 'ctrl_remove') {
    state.mode = 'remove';
    await updateView(interaction, state);
    return;
  }

  if (id === 'ctrl_color') {
    state.mode = 'color';
    await updateView(interaction, state);
    return;
  }

  if (id === 'ctrl_reorder') {
    state.mode = 'reorder';
    state.reorderIndex = null;
    await updateView(interaction, state);
    return;
  }

  if (id === 'ctrl_send') {
    state.mode = 'send';
    await updateView(interaction, state);
    return;
  }

  if (id === 'ctrl_cancel' || id === 'ctrl_reorder_done') {
    state.mode = 'normal';
    state.reorderIndex = null;
    await updateView(interaction, state);
    return;
  }

  if (id === 'ctrl_color_sel' && interaction.isStringSelectMenu()) {
    state.colorKey = interaction.values[0];
    state.mode = 'normal';
    await updateView(interaction, state);
    return;
  }

  if (id === 'ctrl_edit_sel' && interaction.isStringSelectMenu()) {
    const index = parseInt(interaction.values[0], 10);
    const comp = state.data[index];
    if (!comp) return;

    const existing = { ...comp, __index: index };
    let modal;
    if (comp.type === 'text') modal = prefillModal(null, existing);
    else if (comp.type === 'separator') modal = prefillModal(null, existing);
    else if (comp.type === 'section') modal = prefillModal(null, existing);
    else if (comp.type === 'media_gallery')
      modal = prefillModal(null, existing);
    else if (comp.type === 'button_row') modal = prefillModal(null, existing);
    else return;

    await interaction.showModal(modal);
    return;
  }

  if (id === 'ctrl_remove_sel' && interaction.isStringSelectMenu()) {
    const index = parseInt(interaction.values[0], 10);
    state.data.splice(index, 1);
    if (
      state.reorderIndex != null &&
      state.reorderIndex >= state.data.length
    ) {
      state.reorderIndex =
        state.data.length > 0 ? Math.max(0, state.data.length - 1) : null;
    }
    state.mode = 'normal';
    await updateView(interaction, state);
    return;
  }

  if (id === 'ctrl_reorder_sel' && interaction.isStringSelectMenu()) {
    state.reorderIndex = parseInt(interaction.values[0], 10);
    await updateView(interaction, state);
    return;
  }

  if (id === 'ctrl_move_up') {
    const i = state.reorderIndex;
    if (i != null && i > 0) {
      [state.data[i], state.data[i - 1]] = [state.data[i - 1], state.data[i]];
      state.reorderIndex = i - 1;
    }
    await updateView(interaction, state);
    return;
  }

  if (id === 'ctrl_move_down') {
    const i = state.reorderIndex;
    if (i != null && i < state.data.length - 1) {
      [state.data[i], state.data[i + 1]] = [state.data[i + 1], state.data[i]];
      state.reorderIndex = i + 1;
    }
    await updateView(interaction, state);
    return;
  }

  if (id === 'ctrl_channel_sel' && interaction.isChannelSelectMenu()) {
    const channelId = interaction.values[0];
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel) {
      await interaction.reply({
        content: 'Could not find that channel.',
        ephemeral: true,
      });
      return;
    }

    const outContainer = new ContainerBuilder();
    if (state.colorKey !== 'none' && COLORS[state.colorKey] != null) {
      outContainer.setAccentColor(COLORS[state.colorKey]);
    }
    if (!state.data.length) {
      outContainer.addTextDisplayComponents(
        new TextDisplayBuilder().setContent('*(empty container)*')
      );
    } else {
      for (const comp of state.data) {
        renderInto(outContainer, comp);
      }
    }

    try {
      await channel.send({
        components: [outContainer],
        flags: MessageFlags.IsComponentsV2,
      });
    } catch (err) {
      if (err.code === 50013 || err.status === 403) {
        await interaction.reply({
          content: `I don't have permission to send messages in ${channel}.`,
          ephemeral: true,
        });
        return;
      }
      await interaction.reply({
        content: `Failed to send: ${err.message}`,
        ephemeral: true,
      });
      return;
    }

    state.mode = 'sent';
    await updateView(interaction, state, channel.toString());
    return;
  }

  if (id === 'ctrl_reset') {
    state.colorKey = 'none';
    state.data = [];
    state.mode = 'normal';
    state.reorderIndex = null;
    await updateView(interaction, state);
    return;
  }
}

async function handleModalSubmit(interaction, state) {
  const cid = interaction.customId;
  // modal_text_new | modal_text_0 | modal_separator_new | modal_button_row_new | ...
  const indexPart = cid.split('_').pop();
  const isNew = indexPart === 'new';
  const index = isNew ? null : parseInt(indexPart, 10);

  let data;

  if (cid.startsWith('modal_text_')) {
    const content = interaction.fields.getTextInputValue('content');
    data = { type: 'text', content };
  } else if (cid.startsWith('modal_separator_')) {
    const divVal = interaction.fields
      .getTextInputValue('divider')
      .trim()
      .toLowerCase();
    const divider = !['no', 'n', 'false', '0'].includes(divVal);
    const spacing =
      interaction.fields.getTextInputValue('spacing').trim().toLowerCase() ===
      'large'
        ? 'large'
        : 'small';
    data = { type: 'separator', divider, spacing };
  } else if (cid.startsWith('modal_section_')) {
    const content = interaction.fields.getTextInputValue('content');
    const url =
      interaction.fields.getTextInputValue('thumbnail_url').trim() || null;
    data = { type: 'section', content, thumbnail_url: url };
  } else if (cid.startsWith('modal_gallery_')) {
    const raw = interaction.fields.getTextInputValue('urls');
    const lines = raw
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(0, 10);
    data = { type: 'media_gallery', urls: lines };
  } else if (cid.startsWith('modal_button_row_')) {
    const raw = interaction.fields.getTextInputValue('buttons');
    const buttons = [];
    for (const line of raw.split('\n')) {
      if (!line.includes('::')) continue;
      const [labelPart, ...urlParts] = line.split('::');
      const label = labelPart.trim().slice(0, 80);
      const url = urlParts.join('::').trim();
      if (
        label &&
        (url.startsWith('http://') || url.startsWith('https://'))
      ) {
        buttons.push({ label, url });
      }
    }
    if (!buttons.length) {
      await interaction.reply({
        content:
          'No valid buttons found. Use the format: `Label :: https://url.com`',
        ephemeral: true,
      });
      return;
    }
    data = { type: 'button_row', buttons: buttons.slice(0, 5) };
  } else {
    return;
  }

  if (isNew) {
    state.data.push(data);
  } else {
    state.data[index] = data;
  }
  state.mode = 'normal';

  const components = rebuildComponents(state);
  await interaction.update({
    components,
    flags: MessageFlags.IsComponentsV2,
  });
}

// ── Command export ────────────────────────────────────────────────────────────

module.exports = {
  name: 'container',
  aliases: ['build', 'cb'],
  async execute(message, args, client) {
    if (!message.guild) {
      await message.reply('This command can only be used in a server.');
      return;
    }

    attachInteractionHandler(client);

    const state = {
      authorId: message.author.id,
      colorKey: 'none',
      data: [],
      mode: 'normal',
      reorderIndex: null,
      timeout: null,
    };

    const components = rebuildComponents(state);

    const msg = await message.channel.send({
      components,
      flags: MessageFlags.IsComponentsV2,
    });

    state.timeout = setTimeout(() => {
      deleteSession(msg.id);
    }, TIMEOUT_MS);

    setSession(msg.id, state);
  },
};
