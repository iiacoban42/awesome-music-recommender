const { Client, GatewayIntentBits } = require('discord.js');
const { joinVoiceChannel, getVoiceConnection } = require('@discordjs/voice');
const musicRecommender = require('./musicRecommender.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds,  GatewayIntentBits.GuildMessageReactions] });

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    switch (interaction.commandName) {
        case 'join':
            await join(interaction)
            break;
        case 'leave':
            await leave(interaction)
            break;
        default:
            await interaction.reply("Unknown command")
            break;
    }
});

async function join(interaction) {
    if (!interaction.member.voice.channel) {
        await interaction.reply("You must be in a voice channel for me to join you!");
        return;
    }

    const voiceChannel = interaction.member.voice.channel;
    try {
        const connection = await joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: voiceChannel.guild.id,
            adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        });
        await interaction.reply("Let's recommend some music!");
        musicRecommender(client, interaction)
    } catch (error) {
        console.error(`Failed to join the voice channel: ${error}`);
        await interaction.reply('Failed to join the voice channel. Please try again later.');
    }
}

async function leave(interaction) {
    let voiceChannel = interaction.member.voice.channel
    const connection = getVoiceConnection(voiceChannel.guild.id);
    try {
        connection.destroy();
        await interaction.reply("Hate to see you leave but love to watch you go!")
    } catch (error) {
        console.error(`Failed to leave the voice channel: ${error}`);
        await interaction.reply('Failed to leave the voice channel. Please try again later.');
    }
}

client.login(process.env.TOKEN);