const { SlashCommandBuilder } = require("discord.js");
const { closeTicket } = require("../utils/tickets");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-sluiten")
    .setDescription("Sluit het huidige ticket."),

  async execute(interaction) {
    await closeTicket(interaction);
  },
};