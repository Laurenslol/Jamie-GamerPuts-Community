const { SlashCommandBuilder } = require("discord.js");
const { getTicket, load, save } = require("../utils/tickets");
const { isStaff, deny } = require("../utils/permissions");
const { sendLog } = require("../utils/logs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-verwijderen")
    .setDescription("Verwijder een gebruiker uit een ticket.")
    .addUserOption(option =>
      option.setName("gebruiker")
        .setDescription("Gebruiker om te verwijderen")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!isStaff(interaction.member)) {
      return deny(interaction, "Alleen medewerkers mogen dit.");
    }

    const ticket = getTicket(interaction.channelId);
    if (!ticket) return deny(interaction, "Dit is geen ticket.");

    const user = interaction.options.getUser("gebruiker");

    if (user.id === ticket.ownerId) {
      return deny(interaction, "Je kunt de ticketeigenaar niet verwijderen.");
    }

    if (user.id === interaction.client.user.id) {
      return deny(interaction, "Je kunt de bot niet verwijderen.");
    }

    if (ticket.participants?.includes(user.id) !== true) {
      return deny(interaction, "Deze gebruiker is niet als deelnemer toegevoegd.");
    }

    await interaction.channel.permissionOverwrites.edit(user.id, {
      ViewChannel: false,
      SendMessages: false,
    });

    const data = load();
    data.tickets[interaction.channelId].participants =
      data.tickets[interaction.channelId].participants.filter(id => id !== user.id);

    save(data);

    await interaction.reply(`✅ **${user.tag}** is verwijderd uit het ticket.`);

    await sendLog(interaction.guild, "➖ Ticketlid verwijderd",
      `**Ticket:** ${interaction.channel}\n**Gebruiker:** ${user.tag}\n**Medewerker:** ${interaction.user.tag}`);
  },
};