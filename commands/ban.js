const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { sendLog } = require("../utils/logs");
const { checkTarget, deny } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban een gebruiker van de server.")
    .addUserOption(option =>
      option.setName("gebruiker")
        .setDescription("De gebruiker")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("reden")
        .setDescription("Reden van de ban")
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    const user = interaction.options.getUser("gebruiker");
    const reason = interaction.options.getString("reden") || "Geen reden opgegeven";
    const guild = interaction.guild;

    const actor = await guild.members.fetch(interaction.user.id);
    const bot = await guild.members.fetchMe();

    if (!actor.permissions.has(PermissionFlagsBits.BanMembers) ||
        !bot.permissions.has(PermissionFlagsBits.BanMembers)) {
      return deny(interaction, "Onvoldoende banrechten.");
    }

    if (user.id === guild.ownerId || user.id === interaction.user.id) {
      return deny(interaction, "Deze gebruiker kun je niet bannen.");
    }

    const member = await guild.members.fetch(user.id).catch(() => null);

    if (member) {
      if (!(await checkTarget(interaction, member, PermissionFlagsBits.BanMembers))) return;
      if (!member.bannable) return deny(interaction, "Ik kan deze gebruiker niet bannen.");
    }

    await guild.members.ban(user.id, { reason });

    await interaction.reply({
      content: `🔨 **${user.tag}** is verbannen.\n**Reden:** ${reason}`,
      flags: MessageFlags.Ephemeral,
    });

    await sendLog(guild, "🔨 Gebruiker verbannen",
      `**Gebruiker:** ${user.tag}\n**Moderator:** ${interaction.user.tag}\n**Reden:** ${reason}`, 0xed4245);
  },
};