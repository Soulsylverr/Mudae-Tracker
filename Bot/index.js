// index.js
//
// Main entry point for the tracker. It mostly wires things together; the actual
// logic lives in commands/*.js and lib/*.js.

require('dotenv').config();
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const { startVoteReceiverServer } = require('./lib/voteReceiver');
const { startKeepalive } = require('./lib/keepalive');

const { trackCommand } = require('./lib/attribution');
const { handleDailyReaction } = require('./commands/daily');
const { handleRtReaction } = require('./commands/rt');
const { handleRollsReaction } = require('./commands/rolls');
const { handleDkMessage } = require('./commands/dk');
const { handlePMessage } = require('./commands/p');
const { handleOhMessage } = require('./commands/oh');
const { handleOcMessage } = require('./commands/oc');
const { handleRollMessage, isRollCommand } = require('./commands/roll');
const { handleClaimMessage } = require('./commands/claim');
const { handleSetup } = require('./commands/admin');
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
  for (const guild of client.guilds.cache.values()) {
    await loadGuildMembers(guild).catch((err) =>
      console.error(`[memberNames] Could not load members for ${guild.name}:`, err)
    );
  }
});

client.on('error', (err) => console.error('[discord] client error:', err));
client.on('warn', (info) => console.warn('[discord] warn:', info));
client.on('shardDisconnect', (event, id) =>
  console.warn(`[discord] shard ${id} disconnected (${event})`)
);
client.on('shardReconnecting', (id) => console.log(`[discord] shard ${id} reconnecting`));
client.on('shardResume', (id, replayed) =>
  console.log(`[discord] shard ${id} resumed (${replayed} events)`)
);

// Keep the name map current if someone changes their username or nickname.
client.on('guildMemberUpdate', (oldMember, newMember) => {
  loadGuildMembers(newMember.guild).catch((err) =>
    console.error('[memberNames] Refresh after guildMemberUpdate failed:', err)
  );
});

// 1. Track user commands (fills the pending queue for dk/p/oh/oc/roll)
client.on('messageCreate', (msg) => {
  if (msg.author.bot) return;

  // The admin command uses its own prefix and does not collide with Mudae commands.
  if (msg.content.trim().toLowerCase().startsWith('%setup')) {
    handleSetup(msg).catch((err) => console.error('[setup] Error:', err));
    return;
  }

  const content = msg.content.trim().toLowerCase();

  if (content === '$dk' || content === '$dky') {
    trackCommand(msg.channel.id, msg.author.id, 'dk');
  } else if (content === '$p') {
    trackCommand(msg.channel.id, msg.author.id, 'p');
  } else if (content === '$oh') {
    trackCommand(msg.channel.id, msg.author.id, 'oh');
  } else if (content === '$oc') {
    trackCommand(msg.channel.id, msg.author.id, 'oc');
  } else if (isRollCommand(msg.content)) {
    trackCommand(msg.channel.id, msg.author.id, 'roll');
  }
  // $daily and $rt do not need a pending entry; their attribution happens
  // through the reaction directly on the user's message.
});

// 2. Handle Mudae text replies and embeds (dk, p, oh, oc, roll, claim)
client.on('messageCreate', (msg) => {
  if (msg.author.id !== MUDAE_BOT_ID) return;

  handleDkMessage(msg).catch((err) => console.error('[dk] Error:', err));
  handlePMessage(msg).catch((err) => console.error('[p] Error:', err));
  handleOhMessage(msg).catch((err) => console.error('[oh] Error:', err));
  handleOcMessage(msg).catch((err) => console.error('[oc] Error:', err));
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
  } else if (originalContent === '$rolls') {
    handleRollsReaction(reaction.message).catch((err) => console.error('[rolls] Error:', err));
  }
});

process.on('uncaughtException', (err) => console.error('[process] uncaughtException:', err));
process.on('unhandledRejection', (reason) => console.error('[process] unhandledRejection:', reason));

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error('[discord] login failed:', err);
  process.exit(1);
});

startVoteReceiverServer();
startKeepalive();
