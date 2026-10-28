const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { sendLog } = require("../utils/logs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Hef een ban op.")
    .addStringOption(option =>
      option.setName("userid")
        .setDescription("Discord gebruikers-ID")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const id = interaction.options.getString("userid");

    if (!/^\d{17,20}$/.test(id)) {
      return interaction.reply({
        content: "❌ Ongeldige gebruikers-ID.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.guild.bans.remove(id);

    await interaction.reply({
      content: `✅ Ban van gebruiker \`${id}\` opgeheven.`,
      flags: MessageFlags.Ephemeral,
    });

    await sendLog(interaction.guild, "🔓 Ban opgeheven",
      `**Gebruiker:** ${id}\n**Moderator:** ${interaction.user.tag}`, 0x57f287);
  },
};