require("dotenv").config();

const fs = require("fs");
const path = require("path");

const {
  REST,
  Routes,
} = require("discord.js");

const config = require("./config");

const commands = [];

const commandsPath = path.join(__dirname, "commands");

for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith(".js")) continue;

  const command = require(path.join(commandsPath, file));
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: "10" }).setToken(config.token);

(async () => {
  try {
    console.log("⏳ Slashcommands registreren...");

    await rest.put(
      Routes.applicationGuildCommands(
        config.clientId,
        config.guildId
      ),
      { body: commands }
    );

    console.log(`✅ ${commands.length} commands geregistreerd!`);
  } catch (error) {
    console.error(error);
  }
})();