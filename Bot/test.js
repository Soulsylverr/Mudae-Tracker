require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

client.once('ready', () => {
  console.log(`Bot online als ${client.user.tag}`);
});

client.on('messageCreate', (msg) => {
  console.log(`[${msg.author.tag}]: ${msg.content}`);
  if (msg.embeds.length > 0) {
    console.log('Embed:', JSON.stringify(msg.embeds[0], null, 2));
  }
});

client.login(process.env.DISCORD_TOKEN);