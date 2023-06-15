const fs = require('fs')
const preferencesFile = './data/preferences.json'
const { Events } = require('discord.js')

numberEmojis = [
  '0️⃣',
  '1️⃣',
  '2️⃣',
  '3️⃣',
  '4️⃣',
  '5️⃣',
  '6️⃣',
  '7️⃣',
  '8️⃣',
  '9️⃣',
  '🔟'
]
confirmEmoji = '✅'

module.exports = class PreferenceManager {
  constructor (client) {
    this.client = client
    this.preferences = this.readPreferences()
  }

  // Function to read the preferences from the file
  readPreferences () {
    try {
      const data = fs.readFileSync(preferencesFile, 'utf8')
      return JSON.parse(data)
    } catch (err) {
      // If the file doesn't exist, return an empty object
      if (err.code === 'ENOENT') {
        return {}
      }
      throw err
    }
  }

  // Function to write the preferences to the file
  writePreferences () {
    const data = JSON.stringify(this.preferences, null, 2)
    fs.writeFileSync(preferencesFile, data, 'utf8')
  }

  // Function to get the preferences
  getPreferences (members, context) {
    // Keep track of the number of members we have preferences for
    let resolvedCount = 0

    // Get the preferences resolve a promise after all members answered
    console.log(
      `Getting preferences from ${JSON.stringify(
        members.map(member => member.username)
      )}`
    )
    return new Promise((resolve, reject) => {
      // Store the partial preferences
      const preferences = {}

      // Create a promise for each member which resolves on answer
      members
        .map(member => {
          // If we already have an answer for a member use that, else request their likes and dislikes
          const promise = new Promise((resolve, reject) => {
            let userPreference = this.preferences[member.id]
            if (!userPreference) {
              userPreference = {}
              this.preferences[member.id] = userPreference
            }
            const contextPreference = userPreference[context.name]
            if (contextPreference) {
              return resolve(contextPreference)
            }
            this.requestPreferences(member, context, resolve)
          })
          return {
            promise,
            member
          }
        })
        .forEach(async ({ promise, member }) => {
          // Once a promise resolves store its contents and upon receiving all answers resolve the main promise and save to disk
          const preferences = await promise
          resolvedCount++
          this.preferences[member.id][context.name] = preferences

          if (resolvedCount === members.length) {
            this.writePreferences()
            resolve({
              likes: members.map(
                member => this.preferences[member.id][context.name].likes
              ),
              dislikes: members.map(
                member => this.preferences[member.id][context.name].dislikes
              )
            })
          }
        })
    })
  }

  // Function to request the preferences from a user
  async requestPreferences (member, context, resolve) {
    console.log(`Requesting preferences from ${member.username}`)

    // Create/Get a direct message channel with the user
    const dm = await member.createDM()

    // Delete existing messages
    const messages = await dm.messages.fetch({ limit: 100 })
    messages.forEach(async message => {
      try {
        await dm.messages.delete(message)
      } catch {}
    })

    // Map possible genres with an emoji
    const genreEmojis = context.genres.map((genre, i) => [
      genre,
      numberEmojis[i + 1]
    ])

    // Create text to display possible choices
    let choices = genreEmojis
      .map(([genre, emoji]) => `${emoji}  ${genre}`)
      .join(' | ')

    // Filter to wait for confirmation
    const filter = (reaction, user) =>
      reaction.emoji.name == confirmEmoji && !user.bot

    // Create a holder for the like/dislike message
    let message

    // Request the likes and append emojis
    message = await dm.send(
      `What are your prefered musical genres for ${context.name}?
Use the emojis under this message to interact
Choices: ${choices}
Press ${confirmEmoji} to confirm your choices`
    )
    genreEmojis.forEach(
      async ([_, emojiOption]) => await message.react(emojiOption)
    )
    await message.react(confirmEmoji)

    // Wait for the confirmation emoji
    console.log(`Waiting for ${member.username} to input likes`)
    await message.awaitReactions({ filter, max: 1 })

    // Store likes and interact with user
    console.log(`${member.username} confirmed likes`)
    dm.messages.delete(message)
    dm.send('Thanks!')
    const likes = genreEmojis
      .filter(
        ([_, emojiOption]) =>
          message.reactions.cache.get(emojiOption).count == 2
      )
      .map(([genre, _]) => genre)

    // Request the dislikes and append emojis
    message = await dm.send(
      `What are your disliked musical genres for ${context.name}?
Use the emojis under this message to interact
Choices: ${choices}
Press ${confirmEmoji} to confirm your choices`
    )
    genreEmojis.forEach(
      async ([_, emojiOption]) => await message.react(emojiOption)
    )
    await message.react(confirmEmoji)

    // Wait for the confirmation emoji
    console.log(`Waiting for ${member.username} to input dislikes`)
    await message.awaitReactions({ filter, max: 1 })

    // Store dislikes and interact with user
    console.log(`${member.username} confirmed dislikes`)
    dm.messages.delete(message)
    dm.send('Thanks!')
    const dislikes = genreEmojis
      .filter(
        ([_, emojiOption]) =>
          message.reactions.cache.get(emojiOption).count == 2
      )
      .map(([genre, _]) => genre)

    // Return both likes and dislikes
    resolve({ likes, dislikes })
  }
}
