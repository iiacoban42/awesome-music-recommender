// The main discord client interface, creates voice connections and spawns 'MusicRecommender's
const { Client, GatewayIntentBits } = require('discord.js')
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice')
const MusicRecommender = require('./MusicRecommender/MusicRecommender.js')
const PreferenceManager = require('./MusicRecommender/PreferenceManager.js')

// Stores all recommenders based on the guild id they're in
const recommenders = {}

// Specify the intents that we need to have access too, discord recommends to keep these as few as possible
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageReactions
  ]
})

// Manager for fetching the preferences from users
const preferenceManager = new PreferenceManager(client)

// Let the admin know we're ready
client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

// Respond to interactions
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return

  switch (interaction.commandName) {
    case 'join':
      await join(interaction)
      break
    case 'leave':
      await leave(interaction)
      break
    case 'skip':
      await skip(interaction)
      break
    default:
      await interaction.reply('Unknown command')
      break
  }
})

// Join a voice channel and create a recommender with the necessary resources to interact with the user.
async function join (interaction) {
  // Get the users voice channel, text channel and guild
  if (!interaction.member.voice.channel) {
    await interaction.reply(
      'You must be in a voice channel for me to join you!'
    )
    return
  }
  const textChannel = interaction.channel
  const voiceChannel = interaction.member.voice.channel
  const guild = voiceChannel.guild

  // Check if there is a recommender in the guild already and disconnect if needed
  const recommender = recommenders[guild.id]
  if (recommender) {
    recommender.disconnect()
  }

  try {
    // Join the voice channel
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator
    })
    // Notify the user
    await interaction.reply("Let's recommend some music!")
    // Register a recommender
    recommenders[guild.id] = new MusicRecommender(
      client,
      guild,
      textChannel,
      voiceChannel,
      preferenceManager
    )
  } catch (error) {
    console.error(`Failed to join the voice channel: ${error}`)
    await interaction.reply(
      'Failed to join the voice channel. Please try again later.'
    )
  }
}

// Leave a voice channel and destroy the recommender
async function leave (interaction) {
  // Get the guild and its recommender
  const guild = interaction.channel.guild
  const recommender = recommenders[guild.id]

  // Disconnect if needed
  if (recommender) {
    recommender.disconnect()
  }

  // Delete the recommender
  delete recommenders[guild.id]

  // Notify user
  await interaction.reply('Hate to see you leave but love to watch you go!')
}

// Skip the current song
async function skip (interaction) {
  // Get the guild and its recommender
  const guild = interaction.channel.guild
  const recommender = recommenders[guild.id]

  // Play the next song if possible
  if (recommender) {
    recommender.playNextSong()
  }

  // Notify the user
  await interaction.reply('That song was way too long anyway!')
}

// Create the bot client
client.login(process.env.TOKEN)
