const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js");

const config = require("../config");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-panel")
    .setDescription("Plaats het supportticketpaneel.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(config.color)
      .setTitle("🎫 JamieGamerPuts Community | Support")
      .setDescription(
        "Welkom bij het officiële supportsysteem van **JamieGamerPuts Community**!\n\n" +
        "Heb je een vraag, probleem of melding? Ons team helpt je graag verder.\n\n" +
        "**📌 Waarvoor kun je een ticket openen?**\n" +
        "• Algemene vragen\n" +
        "• Problemen binnen de community\n" +
        "• Meldingen over gebruikers\n" +
        "• Samenwerkingen\n" +
        "• Overige ondersteuning\n\n" +
        "**Klik op onderstaande knop om een privéticket te openen.**"
      )
      .setFooter({ text: "JamieGamerPuts Community • Supportteam" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_open")
        .setLabel("Ticket openen")
        .setEmoji("🎫")
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.channel.send({
      embeds: [embed],
      components: [row],
    });

    await interaction.reply({
      content: "✅ Ticketpaneel geplaatst.",
      flags: MessageFlags.Ephemeral,
    });
  },
};