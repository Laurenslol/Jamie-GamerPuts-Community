const {
  SlashCommandBuilder,
  MessageFlags,
} = require("discord.js");

const { getTicket, load, save } = require("../utils/tickets");
const { isStaff, deny } = require("../utils/permissions");
const { sendLog } = require("../utils/logs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-toevoegen")
    .setDescription("Voeg een gebruiker toe aan een ticket.")
    .addUserOption(option =>
      option.setName("gebruiker")
        .setDescription("Gebruiker om toe te voegen")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return deny(interaction, "Alleen medewerkers mogen dit.");
    }

    const ticket = getTicket(interaction.channelId);

    if (!ticket || ticket.closed) {
      return deny(interaction, "Dit is geen open ticket.");
    }

    const user = interaction.options.getUser("gebruiker");

    const member = await interaction.guild.members
      .fetch(user.id)
      .catch(() => null);

    if (!member) return deny(interaction, "Gebruiker niet gevonden op de server.");

    await interaction.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true,
    });

    const data = load();
    const participants = data.tickets[interaction.channelId].participants || [];

    if (!participants.includes(user.id)) participants.push(user.id);

    data.tickets[interaction.channelId].participants = participants;
    save(data);

    await interaction.reply({
      content: `✅ ${user} is toegevoegd aan dit ticket.`,
      allowedMentions: { users: [user.id] },
    });

    await sendLog(interaction.guild, "➕ Ticketlid toegevoegd",
      `**Ticket:** ${interaction.channel}\n**Gebruiker:** ${user.tag}\n**Medewerker:** ${interaction.user.tag}`);
  },
};