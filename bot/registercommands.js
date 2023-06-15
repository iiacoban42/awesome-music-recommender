// Registers commands that are used by client.js, these can be modified in `commands.json5`
const { REST, Routes } = require('discord.js')
require('json5/lib/register')

const commands = require('./commands.json5')

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN)

try {
  console.log('Started refreshing application (/) commands.')

  rest.put(Routes.applicationCommands(process.env.CLIENT_ID), {
    body: commands
  })

  console.log('Successfully reloaded application (/) commands.')

  console.log('')
  for (let command of commands) {
    console.log(`/${command.name}: ${command.description}`)
  }
  console.log('')
} catch (error) {
  console.error(error)
}
