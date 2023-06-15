// The main entry for our bot

// Read the environment variables from the .env file
require('dotenv').config()

// Register commands using the discord api
require('./registercommands.js')

// Start the actual bot
require('./client.js')
