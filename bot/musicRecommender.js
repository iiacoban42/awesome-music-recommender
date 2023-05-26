require('json5/lib/register');
const { Events } = require('discord.js');
const ytdl = require('ytdl-core');
const contexts = require('./contexts.json5');
const { createAudioPlayer, createAudioResource, getVoiceConnection, NoSubscriberBehavior, AudioPlayerStatus } = require('@discordjs/voice');

let context = null;
let activity_name = '';

async function askContext(textChannel, context, question) {
    const message = await textChannel.send(question);
    for (let emojiOption in context) {
        message.react(emojiOption);
    }
}

async function fetchMusic(activity, context) {
    try {
        let response = await fetch(`http://127.0.0.1:8000/get-new-track/${activity}/${context}/`);
        return response.json();
    } catch (e) {
        console.log(e);
    }
}

module.exports = function (client, interaction) {
    client.on(Events.MessageReactionAdd, async (reaction, user) => {
        if (user.bot) return; // Ignore reactions from bots

        const message = reaction.message;

        if (!message.author.bot) return; // Check if the reaction is on a message sent by a bot
        if (message.channel != interaction.channel) return; // Check if the reaction is in the correct channel

        const emoji = reaction.emoji.name;

        if (!Object.keys(context).includes(emoji)) return; // Check if the emoji is a valid choice

        context = context[emoji];

        if (!Object.keys(context).includes('contexts')) {
            // Check if we are done specifying the context
            if (activity_name == '') {
                activity_name = context.name
            }

            interaction.channel.send(`Context selected ${JSON.stringify(context)}`);
            let context_name = context.name;
            try {
                const json_url = await fetchMusic(activity_name, context_name);

                const voiceConnection = getVoiceConnection(interaction.guildId)
                if (!voiceConnection) {
                    interaction.channel.send('Not in a voice channel please use /join');
                    return;
                }

                const stream = ytdl(json_url.url, { filter: 'audioonly' });
                const resource = createAudioResource(stream);
                const player = createAudioPlayer({
                    behaviors: {
                        noSubscriber: NoSubscriberBehavior.Pause,
                    },
                });

                voiceConnection.subscribe(player);

                player.play(resource);
                
                player.on(AudioPlayerStatus.Idle, () => {
                    player.pause();
                    // player.play(getNextResource());
                });

                interaction.channel.send(`Now playing  ${json_url.url}!`);

            } catch (e) {
                console.log(e)
            }
            return;
        }

        activity_name = context.name;
        context = context.contexts; // Narrow down the context further
        askContext(interaction.channel, context, 'Specify the context further:');
    })
    context = contexts;
    askContext(interaction.channel, context, 'Please select the current context:');
}
