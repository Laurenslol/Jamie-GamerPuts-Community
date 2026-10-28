const {
  Client,
  Collection,
  GatewayIntentBits,
  Events,
  MessageFlags,
} = require("discord.js");

const fs = require("fs");
const path = require("path");
const config = require("./config");
const tickets = require("./utils/tickets");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith(".js")) continue;

  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`✅ ${readyClient.user.tag} is online!`);
  console.log(`🏠 ${config.brand}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) return;

      await command.execute(interaction);
      return;
    }

    if (interaction.isButton()) {
      await tickets.handleButton(interaction);
      return;
    }
  } catch (error) {
    console.error("Interaction error:", error);

    const response = {
      content: "❌ Er is een fout opgetreden.",
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(response).catch(console.error);
    } else {
      await interaction.reply(response).catch(console.error);
    }
  }
});

client.login(config.token);