const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { sendLog } = require("../utils/logs");
const { checkTarget, deny } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Verwijder een gebruiker uit de server.")
    .addUserOption(option =>
      option.setName("gebruiker")
        .setDescription("De gebruiker")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reden")
        .setDescription("Reden van de kick")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    const user = interaction.options.getUser("gebruiker");
    const reason = interaction.options.getString("reden") || "Geen reden opgegeven";
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return deny(interaction, "Gebruiker niet gevonden.");
    if (!(await checkTarget(interaction, member, PermissionFlagsBits.KickMembers))) return;
    if (!member.kickable) return deny(interaction, "Ik kan deze gebruiker niet kicken.");

    await member.kick(reason);

    await interaction.reply({
      content: `👢 **${user.tag}** is gekickt.\n**Reden:** ${reason}`,
      flags: MessageFlags.Ephemeral,
    });

    await sendLog(interaction.guild, "👢 Gebruiker gekickt",
      `**Gebruiker:** ${user.tag}\n**Moderator:** ${interaction.user.tag}\n**Reden:** ${reason}`, 0xfee75c);
  },
};