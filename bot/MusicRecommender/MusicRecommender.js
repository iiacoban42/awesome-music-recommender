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

async function fetchMusic () {
  try {
    let response = await fetch(
      `http://localhost:8000/get-yt-url/<track>/<artist>/`
    )
    return response.json()
  } catch (e) {
    console.log(e)
  }
}

async function fetchPlaylist (data) {
    try{
        let response = await fetch(
            `http://localhost:8000/get-new-playlist/`, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            }
        )
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
    this.context = contexts

    this.askContext('Please select the current context: ')
  }

  async askContext (question) {
    let emojiOptions = Object.keys(this.context)

    let choices = emojiOptions
      .map(emojiOption => `${emojiOption} ${this.context[emojiOption].name}`)
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

    this.context = this.context[emoji]

    if (!Object.keys(this.context).includes('contexts')) {
      // Check if we are done specifying the context
      this.playMusic()
      return
    }

    this.context = this.context.contexts // Narrow down the context further
    this.askContext('Please specify the context further: ')
  }

  async playMusic () {
    const members = Array.from(this.voiceChannel.members.values())
      .map(value => value.user)
      .filter(member => !member.bot)
    const preferences = await this.preferenceManager.getPreferences(
      members,
      this.context
    )

    const context_and_preferences = preferences
    context_and_preferences['context'] = this.context.name
    console.log(preferences)
    console.log(context_and_preferences)

    this.playlist = fetchPlaylist(context_and_preferences)
  }

  async playNextSong() {
    const jsonUrl = await fetchMusic()

    const stream = ytdl(jsonUrl.url, { filter: 'audioonly' })
    const resource = createAudioResource(stream)

    const player = this.getPlayer()

    player.play(resource)

    interaction.channel.send(`Now playing  ${jsonUrl.url}!`)
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
      this.playNextSong()
    })

    return this._player
  }

  async disconnect () {
    const connection = getVoiceConnection(this.guild.id)
    try {
      connection.destroy()
    } catch (error) {
      console.error(`Failed to leave the voice channel: ${error}`)
    }
  }
}
