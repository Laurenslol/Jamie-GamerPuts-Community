const fs = require("fs");
const path = require("path");

const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  AttachmentBuilder,
  MessageFlags,
} = require("discord.js");

const config = require("../config");
const { sendLog } = require("./logs");
const { isStaff, deny } = require("./permissions");

const file = path.join(__dirname, "../data/tickets.json");

fs.mkdirSync(path.dirname(file), { recursive: true });

function load() {
  if (!fs.existsSync(file)) return { counter: 0, tickets: {} };

  const data = JSON.parse(fs.readFileSync(file, "utf8"));
  return {
    counter: data.counter || 0,
    tickets: data.tickets || {},
  };
}

function save(data) {
  const temp = `${file}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(data, null, 2));
  fs.renameSync(temp, file);
}

function getTicket(channelId) {
  return load().tickets[channelId] || null;
}

function ticketButtons(closed = false) {
  const row = new ActionRowBuilder();

  if (closed) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_reopen")
        .setLabel("Heropenen")
        .setEmoji("🔓")
        .setStyle(ButtonStyle.Success)
    );
  } else {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_claim")
        .setLabel("Claimen")
        .setEmoji("🙋")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("ticket_close")
        .setLabel("Sluiten")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger)
    );
  }

  return row;
}

async function openTicket(interaction) {
  const guild = interaction.guild;
  const data = load();

  const existing = Object.entries(data.tickets).find(
    ([, ticket]) =>
      ticket.guildId === guild.id &&
      ticket.ownerId === interaction.user.id &&
      !ticket.closed
  );

  if (existing) {
    const channel = await guild.channels.fetch(existing[0]).catch(() => null);

    if (channel) {
      return deny(interaction, `Je hebt al een open ticket: ${channel}`);
    }
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const number = data.counter + 1;

  const overwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: interaction.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
      ],
    },
    {
      id: interaction.client.user.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.ManageChannels,
        PermissionFlagsBits.AttachFiles,
      ],
    },
  ];

  if (config.staffRoleId) {
    overwrites.push({
      id: config.staffRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
    });
  }

  const options = {
    name: `ticket-${String(number).padStart(4, "0")}`,
    type: ChannelType.GuildText,
    permissionOverwrites: overwrites,
    topic: `Ticket #${number} | Eigenaar: ${interaction.user.id}`,
  };

  if (config.ticketCategoryId) {
    options.parent = config.ticketCategoryId;
  }

  const channel = await guild.channels.create(options);

  data.counter = number;
  data.tickets[channel.id] = {
    guildId: guild.id,
    ownerId: interaction.user.id,
    number,
    claimedBy: null,
    closed: false,
    participants: [],
    createdAt: new Date().toISOString(),
  };

  save(data);

  const embed = new EmbedBuilder()
    .setColor(config.color)
    .setTitle(`🎫 Supportticket #${number}`)
    .setDescription(
      `Welkom ${interaction.user}!\n\n` +
      "Bedankt voor het openen van een ticket bij **JamieGamerPuts Community**.\n\n" +
      "Beschrijf je vraag of probleem zo duidelijk mogelijk. " +
      "Een medewerker zal je zo snel mogelijk helpen."
    )
    .addFields(
      { name: "Status", value: "🟢 Open", inline: true },
      { name: "Behandelaar", value: "Nog niet geclaimd", inline: true }
    )
    .setFooter({ text: config.brand })
    .setTimestamp();

  await channel.send({
    content: `${interaction.user}${config.staffRoleId ? ` <@&${config.staffRoleId}>` : ""}`,
    embeds: [embed],
    components: [ticketButtons()],
    allowedMentions: {
      users: [interaction.user.id],
      roles: config.staffRoleId ? [config.staffRoleId] : [],
    },
  });

  await interaction.editReply({
    content: `✅ Je ticket is aangemaakt: ${channel}`,
  });

  await sendLog(guild, "🎫 Ticket geopend",
    `**Ticket:** ${channel}\n**Gebruiker:** ${interaction.user.tag}\n**Nummer:** #${number}`);
}

async function claimTicket(interaction) {
  if (!isStaff(interaction.member)) {
    return deny(interaction, "Alleen medewerkers mogen tickets claimen.");
  }

  const data = load();
  const ticket = data.tickets[interaction.channelId];

  if (!ticket || ticket.closed) {
    return deny(interaction, "Dit is geen open ticket.");
  }

  if (ticket.claimedBy) {
    return deny(interaction, `Dit ticket is al geclaimd door <@${ticket.claimedBy}>.`);
  }

  ticket.claimedBy = interaction.user.id;
  save(data);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`🙋 Dit ticket wordt behandeld door ${interaction.user}.`)
        .setTimestamp(),
    ],
  });

  await sendLog(interaction.guild, "🙋 Ticket geclaimd",
    `**Ticket:** ${interaction.channel}\n**Medewerker:** ${interaction.user.tag}`);
}

async function createTranscript(channel) {
  const messages = [];
  let before;

  for (let page = 0; page < 100; page++) {
    const batch = await channel.messages.fetch({
      limit: 100,
      ...(before ? { before } : {}),
    });

    if (!batch.size) break;

    messages.push(...batch.values());
    before = batch.last().id;

    if (batch.size < 100) break;
  }

  messages.reverse();

  const lines = messages.map(message => {
    const date = new Date(message.createdTimestamp).toISOString();
    const content = message.content || "[Geen tekst]";
    const attachments = [...message.attachments.values()]
      .map(a => a.url)
      .join(", ");

    return `[${date}] ${message.author.tag}: ${content}` +
      (attachments ? `\nBijlagen: ${attachments}` : "");
  });

  const text = [
    `JamieGamerPuts Community - Transcript`,
    `Kanaal: ${channel.name}`,
    `Aangemaakt: ${new Date().toISOString()}`,
    "",
    ...lines,
  ].join("\n");

  return new AttachmentBuilder(Buffer.from(text, "utf8"), {
    name: `transcript-${channel.name}.txt`,
  });
}

async function closeTicket(interaction) {
  const data = load();
  const ticket = data.tickets[interaction.channelId];

  if (!ticket) return deny(interaction, "Dit is geen ticket.");

  if (!isStaff(interaction.member) &&
      interaction.user.id !== ticket.ownerId) {
    return deny(interaction, "Je mag dit ticket niet sluiten.");
  }

  if (ticket.closed) return deny(interaction, "Dit ticket is al gesloten.");

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const transcript = await createTranscript(interaction.channel);

  const logChannel = await interaction.guild.channels
    .fetch(config.logChannelId)
    .catch(() => null);

  if (logChannel && logChannel.isTextBased()) {
    await logChannel.send({
      content: `📄 Transcript van ${interaction.channel.name}\nGesloten door ${interaction.user.tag}`,
      files: [transcript],
    });
  }

  await interaction.channel.permissionOverwrites.edit(ticket.ownerId, {
    ViewChannel: false,
    SendMessages: false,
  });

  for (const id of ticket.participants || []) {
    await interaction.channel.permissionOverwrites.edit(id, {
      ViewChannel: false,
      SendMessages: false,
    }).catch(console.error);
  }

  ticket.closed = true;
  ticket.closedAt = new Date().toISOString();
  save(data);

  await interaction.channel.setName(`gesloten-${ticket.number}`);

  await interaction.channel.send({
    embeds: [
      new EmbedBuilder()
        .setColor(0xed4245)
        .setTitle("🔒 Ticket gesloten")
        .setDescription(`Gesloten door ${interaction.user}.\nEen medewerker kan dit ticket heropenen.`)
        .setTimestamp(),
    ],
    components: [ticketButtons(true)],
  });

  await interaction.editReply({ content: "✅ Ticket gesloten." });

  await sendLog(interaction.guild, "🔒 Ticket gesloten",
    `**Ticket:** ${interaction.channel}\n**Gesloten door:** ${interaction.user.tag}`);
}

async function reopenTicket(interaction) {
  if (!isStaff(interaction.member)) {
    return deny(interaction, "Alleen medewerkers mogen tickets heropenen.");
  }

  const data = load();
  const ticket = data.tickets[interaction.channelId];

  if (!ticket || !ticket.closed) {
    return deny(interaction, "Dit ticket is niet gesloten.");
  }

  await interaction.channel.permissionOverwrites.edit(ticket.ownerId, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
  });

  for (const id of ticket.participants || []) {
    await interaction.channel.permissionOverwrites.edit(id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    }).catch(console.error);
  }

  ticket.closed = false;
  delete ticket.closedAt;
  save(data);

  await interaction.channel.setName(`ticket-${String(ticket.number).padStart(4, "0")}`);

  await interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`🔓 Ticket heropend door ${interaction.user}.`),
    ],
    components: [ticketButtons()],
  });

  await sendLog(interaction.guild, "🔓 Ticket heropend",
    `**Ticket:** ${interaction.channel}\n**Medewerker:** ${interaction.user.tag}`);
}

async function handleButton(interaction) {
  switch (interaction.customId) {
    case "ticket_open":
      return openTicket(interaction);
    case "ticket_claim":
      return claimTicket(interaction);
    case "ticket_close":
      return closeTicket(interaction);
    case "ticket_reopen":
      return reopenTicket(interaction);
    default:
      return;
  }
}

module.exports = {
  getTicket,
  load,
  save,
  openTicket,
  claimTicket,
  closeTicket,
  reopenTicket,
  handleButton,
};