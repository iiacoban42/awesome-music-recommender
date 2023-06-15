const { Client, GatewayIntentBits } = require('discord.js')
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice')
const MusicRecommender = require('./MusicRecommender/MusicRecommender.js')
const PreferenceManager = require('./MusicRecommender/PreferenceManager.js')

const recommenders = {}
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
const preferenceManager = new PreferenceManager(client)

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`)
})

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return

  switch (interaction.commandName) {
    case 'join':
      await join(interaction)
      break
    case 'leave':
      await leave(interaction)
      break
    default:
      await interaction.reply('Unknown command')
      break
  }
})

async function join (interaction) {
  if (!interaction.member.voice.channel) {
    await interaction.reply(
      'You must be in a voice channel for me to join you!'
    )
    return
  }

  const textChannel = interaction.channel
  const voiceChannel = interaction.member.voice.channel
  // const voiceChannel = interaction.guild.channels.cache.get("1110578413414129736");
  const guild = voiceChannel.guild

  const recommender = recommenders[guild.id]

  if (recommender) {
    recommender.disconnect()
  }

  try {
    const connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator
    })
    await interaction.reply("Let's recommend some music!")
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

async function leave (interaction) {
  const textChannel = interaction.channel
  const voiceChannel = interaction.member.voice.channel
  const guild = voiceChannel.guild

  const recommender = recommenders[guild.id]

  if (recommender) {
    recommender.disconnect()
  }

  await interaction.reply('Hate to see you leave but love to watch you go!')
}

client.login(process.env.TOKEN)
