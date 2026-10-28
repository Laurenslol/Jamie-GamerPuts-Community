const { SlashCommandBuilder } = require("discord.js");
const { claimTicket } = require("../utils/tickets");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-claim")
    .setDescription("Claim het huidige ticket."),

  async execute(interaction) {
    await claimTicket(interaction);
  },
};