const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { sendLog } = require("../utils/logs");
const { checkTarget, deny } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Geef een gebruiker een time-out.")
    .addUserOption(option =>
      option.setName("gebruiker")
        .setDescription("De gebruiker")
        .setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("minuten")
        .setDescription("Duur in minuten (maximaal 40320)")
        .setMinValue(1)
        .setMaxValue(40320)
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reden")
        .setDescription("Reden van de time-out")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    const user = interaction.options.getUser("gebruiker");
    const minutes = interaction.options.getInteger("minuten");
    const reason = interaction.options.getString("reden") || "Geen reden opgegeven";
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);

    if (!member) return deny(interaction, "Gebruiker niet gevonden.");
    if (!(await checkTarget(interaction, member, PermissionFlagsBits.ModerateMembers))) return;
    if (!member.moderatable) return deny(interaction, "Deze gebruiker kan geen time-out krijgen.");

    await member.timeout(minutes * 60 * 1000, reason);

    await interaction.reply({
      content: `⏳ **${user.tag}** heeft een time-out van **${minutes} minuten** gekregen.\n**Reden:** ${reason}`,
      flags: MessageFlags.Ephemeral,
    });

    await sendLog(interaction.guild, "⏳ Time-out gegeven",
      `**Gebruiker:** ${user.tag}\n**Moderator:** ${interaction.user.tag}\n**Duur:** ${minutes} minuten\n**Reden:** ${reason}`, 0xfee75c);
  },
};