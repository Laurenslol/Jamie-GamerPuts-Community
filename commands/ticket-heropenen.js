const { SlashCommandBuilder } = require("discord.js");
const { reopenTicket } = require("../utils/tickets");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ticket-heropenen")
    .setDescription("Heropen het huidige ticket."),

  async execute(interaction) {
    await reopenTicket(interaction);
  },
};