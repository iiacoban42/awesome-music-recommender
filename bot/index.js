require('dotenv').config();

// Register commands using the discord api
require('./registercommands.js');

// Start the actual bot
require('./client.js');