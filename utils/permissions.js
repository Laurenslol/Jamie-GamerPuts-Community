const {
  MessageFlags,
  PermissionFlagsBits,
} = require("discord.js");

const config = require("../config");

function isStaff(member) {
  return (
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    Boolean(
      config.staffRoleId &&
      member.roles.cache.has(config.staffRoleId)
    )
  );
}

async function deny(interaction, message) {
  const payload = {
    content: `❌ ${message}`,
    flags: MessageFlags.Ephemeral,
  };

  if (interaction.deferred || interaction.replied) {
    return interaction.followUp(payload);
  }

  return interaction.reply(payload);
}

async function checkTarget(interaction, member, permission) {
  const actor = await interaction.guild.members.fetch(interaction.user.id);
  const bot = await interaction.guild.members.fetchMe();

  if (!actor.permissions.has(permission)) {
    await deny(interaction, "Je hebt hiervoor geen toestemming.");
    return false;
  }

  if (!bot.permissions.has(permission)) {
    await deny(interaction, "De bot mist de benodigde permissie.");
    return false;
  }

  if (member.id === interaction.guild.ownerId) {
    await deny(interaction, "De servereigenaar kan niet worden beheerd.");
    return false;
  }

  if (
    actor.id !== interaction.guild.ownerId &&
    actor.roles.highest.comparePositionTo(member.roles.highest) <= 0
  ) {
    await deny(interaction, "Dit lid heeft een even hoge of hogere rol.");
    return false;
  }

  if (
    bot.roles.highest.comparePositionTo(member.roles.highest) <= 0
  ) {
    await deny(interaction, "Mijn botrol staat niet hoog genoeg.");
    return false;
  }

  return true;
}

module.exports = {
  isStaff,
  deny,
  checkTarget,
};