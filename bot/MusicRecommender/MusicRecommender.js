require('json5/lib/register')
const { Events } = require('discord.js')
const ytdl = require('ytdl-core')
const contexts = require('./contexts.json5')
const {
  createAudioPlayer,
  createAudioResource,
  getVoiceConnection,
  NoSubscriberBehavior,
  AudioPlayerStatus
} = require('@discordjs/voice')

async function fetchMusic (activity, context) {
  try {
    let response = await fetch(
      `http://127.0.0.1:8000/get-new-track/${activity}/${context}/`
    )
    return response.json()
  } catch (e) {
    console.log(e)
  }
}

module.exports = class MusicRecommender {
  constructor (client, guild, textChannel, voiceChannel, preferenceManager) {
    this.client = client
    this.guild = guild
    this.textChannel = textChannel
    this.voiceChannel = voiceChannel
    this.preferenceManager = preferenceManager

    this.voiceConnection = getVoiceConnection(guild.id)
    this.contextObj = contexts

    this.askContext('Please select the current context: ')
  }

  async askContext (question) {
    let emojiOptions = Object.keys(this.contextObj)

    let choices = emojiOptions
      .map(emojiOption => `${emojiOption} ${this.contextObj[emojiOption].name}`)
      .join(' | ')

    const message = await this.textChannel.send(
      `${question}
Use the emojis under this message to interact
Choices: ${choices}`
    )

    emojiOptions.forEach(async emojiOption => await message.react(emojiOption))

    const filter = (reaction, user) =>
      emojiOptions.includes(reaction.emoji.name) && !user.bot

    const reactions = await message.awaitReactions({ filter, max: 1 })

    const emoji = reactions.keys().next().value

    message.delete()

    this.contextObj = this.contextObj[emoji]

    if (!Object.keys(this.contextObj).includes('contexts')) {
      // Check if we are done specifying the context
      this.playMusic()
      return
    }

    this.contextObj = this.contextObj.contexts // Narrow down the context further
    this.askContext('Please specify the context further: ')
  }

  async playMusic () {
    const members = Array.from(this.voiceChannel.members.values())
      .map(value => value.user)
      .filter(member => !member.bot)
    const preferences = await this.preferenceManager.getPreferences(
      members,
      this.contextObj
    )

    console.log(preferences)

    // const jsonUrl = await fetchMusic(
    //   this.contextList[0],
    //   this.contextList[1],
    //   preferences
    // )

    // const stream = ytdl(jsonUrl.url, { filter: 'audioonly' })
    // const resource = createAudioResource(stream)

    // const player = this.getPlayer()

    // player.play(resource)

    // interaction.channel.send(`Now playing  ${jsonUrl.url}!`)
  }

  async getPlayer () {
    if (this._player) return this._player
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause
      }
    })
    this.voiceConnection.subscribe(this._player)

    this._player.on(AudioPlayerStatus.Idle, () => {
      this._player.pause()
      this.playMusic()
    })

    return this._player
  }

  async disconnect () {
    const connection = getVoiceConnection(this.guild.id)
    try {
      connection.destroy()
    } catch (error) {
      console.error(`Failed to leave the voice channel: ${error}`)
      await interaction.reply(
        'Failed to leave the voice channel. Please try again later.'
      )
    }
  }
}
