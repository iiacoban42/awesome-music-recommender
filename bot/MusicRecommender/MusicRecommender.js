// Plays recommended music based on user specified data, fetches a playlist with the data and plays this song-by-song
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

// Fetch the youtube url using track and artist, replace slashes in their values with spaces so we don't confuse the backend
async function fetchMusic (track, artist) {
  try {
    let response = await fetch(
      `http://127.0.0.1:8000/get-yt-url/${track.replace(
        '/',
        ' '
      )}/${artist.replace('/', ' ')}/`
    )
    return response.json()
  } catch (e) {
    console.error(e)
  }
}

// Fetch the playlist based on user specified data
async function fetchPlaylist (data) {
  try {
    let response = await fetch(`http://127.0.0.1:8000/get-new-playlist/`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data),
      credentials: 'include'
    })
    return response.json()
  } catch (e) {
    console.error(e)
  }
}

// Plays recommended music based on user specified data, fetches a playlist with the data and plays this song-by-song
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

  // Specify context based on question and current location in context tree obtained from `contexts.json5`
  async askContext (question) {
    // Get the options
    let emojiOptions = Object.keys(this.context)

    // Convert options to a string listing all the choices
    let choices = emojiOptions
      .map(emojiOption => `${emojiOption} ${this.context[emojiOption].name}`)
      .join(' | ')

    // Send the question and offer the emojis as choices
    const message = await this.textChannel.send(
      `${question}
Use the emojis under this message to interact
Choices: ${choices}`
    )
    emojiOptions.forEach(
      async emojiOption => await message.react(emojiOption).catch(() => {})
    )

    // Wait for a single emoji as a reaction from the user that is one of the options
    const filter = (reaction, user) =>
      emojiOptions.includes(reaction.emoji.name) && !user.bot
    const reactions = await message.awaitReactions({ filter, max: 1 })
    const emoji = reactions.keys().next().value

    // Delete the message
    message.delete()

    // Traverse the context tree
    this.context = this.context[emoji]

    if (!Object.keys(this.context).includes('contexts')) {
      // Play music based on the context if we have reached a leaf node, requests preferences if needed
      this.playMusic()
      return
    }

    // If we haven't reached a leaf traverse further
    this.context = this.context.contexts
    this.askContext('Please specify the context further: ')
  }

  // Fetches user preferences using `PreferenceManager.js` and fetches a playlist based on context and preferences, then plays the first item on the playlist
  async playMusic () {
    // Get current members in the voice channel
    const members = Array.from(this.voiceChannel.members.values())
      .map(value => value.user)
      .filter(member => !member.bot)

    // Get their preferences
    const preferences = await this.preferenceManager.getPreferences(
      members,
      this.context
    )

    // Combine context and preferences
    const context_and_preferences = preferences
    context_and_preferences['context'] = this.context.name
    console.log(context_and_preferences)

    // Request playlist and start playing
    const response = await fetchPlaylist(context_and_preferences)
    this.playlist = response.playlist_blend
    this.playNextSong()
  }

  // Play the next song on the playlist
  async playNextSong () {
    // Request the url for the next song in the playlist
    const [score, track, artist] = this.playlist.shift()
    console.log(`Now playing ${track} - ${artist} (${score})`)
    const jsonUrl = await fetchMusic(track, artist)

    // Get the resource
    const stream = ytdl(jsonUrl.url, {
      filter: 'audioonly',
      highWaterMark: 1 << 25
    })
    const resource = createAudioResource(stream)

    // Play the song
    const player = await this.getPlayer()
    player.play(resource)
    this.textChannel.send(`Now playing  ${jsonUrl.url}!`)
  }

  // Returns (and registers) a player to play music
  async getPlayer () {
    // Return the current player if we have one
    if (this._player) return this._player

    // Otherwise create a player and connect it to the voice channel
    this._player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause
      }
    })
    this.voiceConnection.subscribe(this._player)

    // If we stop playing, play the next song
    this._player.on(AudioPlayerStatus.Idle, () => {
      this._player.pause()
      this.playNextSong()
    })

    // If we error, simply log the error (most likely connection issues)
    this._player.on('error', console.error)

    // Return the new player
    return this._player
  }

  // Disconnect the current recommender and destroy its connection
  async disconnect () {
    const connection = getVoiceConnection(this.guild.id)
    try {
      connection.destroy()
    } catch (error) {
      console.error(`Failed to leave the voice channel: ${error}`)
    }
  }
}
