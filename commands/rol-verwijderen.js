const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  MessageFlags,
} = require("discord.js");

const { sendLog } = require("../utils/logs");
const { checkTarget, deny } = require("../utils/permissions");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rol-verwijderen")
    .setDescription("Verwijder een rol van een gebruiker.")
    .addUserOption(option =>
      option.setName("gebruiker")
        .setDescription("De gebruiker")
        .setRequired(true)
    )
    .addRoleOption(option =>
      option.setName("rol")
        .setDescription("De rol")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    const user = interaction.options.getUser("gebruiker");
    const role = interaction.options.getRole("rol");
    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    const actor = await interaction.guild.members.fetch(interaction.user.id);
    const bot = await interaction.guild.members.fetchMe();

    if (!member) return deny(interaction, "Gebruiker niet gevonden.");
    if (!(await checkTarget(interaction, member, PermissionFlagsBits.ManageRoles))) return;

    if (role.managed || role.id === interaction.guild.id ||
        bot.roles.highest.comparePositionTo(role) <= 0 ||
        (actor.id !== interaction.guild.ownerId &&
         actor.roles.highest.comparePositionTo(role) <= 0)) {
      return deny(interaction, "Deze rol mag niet worden beheerd.");
    }

    if (!member.roles.cache.has(role.id)) return deny(interaction, "De gebruiker heeft deze rol niet.");

    await member.roles.remove(role);

    await interaction.reply({
      content: `✅ Rol ${role} verwijderd van ${user}.`,
      flags: MessageFlags.Ephemeral,
    });

    await sendLog(interaction.guild, "➖ Rol verwijderd",
      `**Gebruiker:** ${user.tag}\n**Rol:** ${role.name}\n**Moderator:** ${interaction.user.tag}`);
  },
};