// index.js
//
// Main entry point for the tracker. It mostly wires things together; the actual
// logic lives in commands/*.js and lib/*.js.

require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { startVoteReceiverServer } = require('./lib/voteReceiver');

const { trackCommand } = require('./lib/attribution');
const { handleDailyReaction } = require('./commands/daily');
const { handleRtReaction } = require('./commands/rt');
const { handleDkMessage } = require('./commands/dk');
const { handlePMessage } = require('./commands/p');
const { handleOhMessage } = require('./commands/oh');
const { handleRollMessage, isRollCommand } = require('./commands/roll');
const { handleClaimMessage } = require('./commands/claim');
const { handleAdminCommand } = require('./commands/admin');
const { loadGuildMembers } = require('./lib/memberNames');

const MUDAE_BOT_ID = process.env.MUDAE_BOT_ID;

if (!MUDAE_BOT_ID) {
  console.error('MUDAE_BOT_ID is missing from .env. Please add it (Mudae user ID, right-click -> Copy User ID).');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildMembers,
  ],
  // Partials are needed so reactions on messages that are not in the cache still
  // arrive as messageReactionAdd events.
  partials: [Partials.Message, Partials.Reaction, Partials.Channel],
});

client.once('ready', async () => {
  console.log(`Bot online as ${client.user.tag}`);

  // Claim attribution relies on the member list for username-in-plain-text detection.
  // If you run this on multiple servers, you may want to loop through all guilds here.
  for (const guild of client.guilds.cache.values()) {
    await loadGuildMembers(guild).catch((err) =>
      console.error(`[memberNames] Could not load members for ${guild.name}:`, err)
    );
  }
});

// Keep the name map current if someone changes their username or nickname.
client.on('guildMemberUpdate', (oldMember, newMember) => {
  loadGuildMembers(newMember.guild).catch((err) =>
    console.error('[memberNames] Refresh after guildMemberUpdate failed:', err)
  );
});

// 1. Track user commands (fills the pending queue for dk/p/oh/roll)
client.on('messageCreate', (msg) => {
  if (msg.author.bot) return;

  // The admin command uses its own prefix and does not collide with Mudae commands.
  if (msg.content.trim().startsWith('%setrolls')) {
    handleAdminCommand(msg).catch((err) => console.error('[admin] Error:', err));
    return;
  }

  const content = msg.content.trim().toLowerCase();

  if (content === '$dk') {
    trackCommand(msg.channel.id, msg.author.id, 'dk');
  } else if (content === '$p') {
    trackCommand(msg.channel.id, msg.author.id, 'p');
  } else if (content === '$oh') {
    trackCommand(msg.channel.id, msg.author.id, 'oh');
  } else if (isRollCommand(msg.content)) {
    trackCommand(msg.channel.id, msg.author.id, 'roll');
  }
  // $daily and $rt do not need a pending entry; their attribution happens
  // through the reaction directly on the user's message.
});

// 2. Handle Mudae text replies and embeds (dk, p, oh, roll)
client.on('messageCreate', (msg) => {
  if (msg.author.id !== MUDAE_BOT_ID) return;

  handleDkMessage(msg).catch((err) => console.error('[dk] Error:', err));
  handlePMessage(msg).catch((err) => console.error('[p] Error:', err));
  handleOhMessage(msg).catch((err) => console.error('[oh] Error:', err));
  handleRollMessage(msg).catch((err) => console.error('[roll] Error:', err));
  handleClaimMessage(msg).catch((err) => console.error('[claim] Error:', err));
});

// 3. Handle Mudae reactions (daily, rt)
client.on('messageReactionAdd', (reaction, user) => {
  if (user.id !== MUDAE_BOT_ID) return;

  const originalContent = reaction.message.content?.trim().toLowerCase();

  if (originalContent === '$daily') {
    handleDailyReaction(reaction.message).catch((err) => console.error('[daily] Error:', err));
  } else if (originalContent === '$rt') {
    handleRtReaction(reaction.message).catch((err) => console.error('[rt] Error:', err));
  }
});

client.login(process.env.DISCORD_TOKEN);

// Optional: receives vote events from the browser extension.
startVoteReceiverServer();
