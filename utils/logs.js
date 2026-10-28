const { EmbedBuilder } = require("discord.js");
const config = require("../config");

async function sendLog(guild, title, description, color = 0x5865f2) {
  if (!config.logChannelId) return;

  const channel = await guild.channels
    .fetch(config.logChannelId)
    .catch(() => null);

  if (!channel || !channel.isTextBased()) return;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: config.brand });

  await channel.send({ embeds: [embed] }).catch(console.error);
}

module.exports = { sendLog };