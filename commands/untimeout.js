const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { sendLog } = require("../utils/logs");
const { checkTarget, deny } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Verwijder een time-out.")
    .addUserOption(option =>
      option.setName("gebruiker")
        .setDescription("De gebruiker")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser("gebruiker");
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return deny(interaction, "Gebruiker niet gevonden.");
    if (!(await checkTarget(interaction, member, PermissionFlagsBits.ModerateMembers))) return;
    if (!member.moderatable) return deny(interaction, "Deze gebruiker kan ik niet aanpassen.");

    await member.timeout(null);

    await interaction.reply({
      content: `✅ Time-out van **${user.tag}** verwijderd.`,
      flags: MessageFlags.Ephemeral,
    });

    await sendLog(interaction.guild, "✅ Time-out verwijderd",
      `**Gebruiker:** ${user.tag}\n**Moderator:** ${interaction.user.tag}`, 0x57f287);
  },
};