console.log("Beep Boop");


const Discord = require('discord.js');
//Client start for Discord.js
const client = new Discord.Client();
const search = require('youtube-search');
const config = require('./config.json');
const prefix = config.prefix;
const TENOR_TOKEN = config.TENOR_API;
const request = require('request');
const cheerio = require('cheerio');
const fetch = require("node-fetch");

const fs = require('fs');
const ytdl = require('ytdl-core');
const { Player } = require("discord-player");
const player = new Player(client);
client.player = player;
client.player.on('trackStart', (message, track) => message.channel.send(`Now playing ${track.title}...`))
let messageList = config.messagesOfTheDay;
 


client.login(config.token);

client.once('ready', () => {
    console.log(`${client.user.username} is online!`);
    loadCommands();
});

let musicConn;
let musicChannel;
let musicDispatcher;
let musicQueue = [];
let npURL ='';

const opts = {
    maxResults: 10,
    key: config.YOUTUBE_API,
    type: 'video'
};
  
client.on('message', async message => {
    console.log(message.content);

    if(!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.slice(prefix.length).trim().split(' ');
    const command = args.shift().toLowerCase()
    
    if (command === `ping`) {
        message.channel.send('Pong.');
    }

    if(command === '') {
        message.channel.send("animal prost baga comanda... (sau b!help daca tot esti prost)");
    }

    if(command === 'members') {
        message.channel.send("Sunt " + message.guild.memberCount + " animale INTeresante pe server");
    }

    if(command === 'info') {
        message.channel.send(`Your username: ${message.author.username}\nYour ID: ${message.author.id}`);
    }

    if (command === 'kick') {
        if (!message.mentions.users.size) {
            return message.reply('you need to tag a user in order to kick them!');
        }
        const taggedUser = message.mentions.users.first();
        message.channel.send(`You wanted to kick: ${taggedUser.username}`);
    }

    if(command === 'join') {
        const voiceChannel = message.member.voice.channel;
        if(!voiceChannel) {
            return message.channel.send("Nu esti intr-un voice channel, animal INTer ce esti!");
        }
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
            return message.channel.send("N-am permisiuni sa vorbesc animalule, nu mai trolla!");
        }
        voiceChannel.join();
    }

    if(command === 'leave') {
        const voiceChannel = message.member.voice.channel;
        
        if(!voiceChannel) {
            return message.channel.send("Nu esti intr-un voice channel, animal INTer ce esti!");
        }

        const botVoiceChannel = message.guild.voice.channel;
        
        if(!botVoiceChannel) {
            return message.channel.send("Nu sunt intr-un canal vocal animal prost!");
        }
        
        if (voiceChannel === botVoiceChannel) {
            voiceChannel.leave();
        } else {
            message.channel.send("Nu esti cu mine in canal, animal INTer ce esti!");
        }
    }

    if (command === 'mesajul-zilei') {
        msg = messageList[Math.floor(Math.random() * messageList.length)];
        message.channel.send(msg);
    }

    if (command === 'help') {
        message.channel.send(commandsList);
    }

    if (command === "prost"){
        var VC = message.member.voice.channel;
        if (!VC)
            return message.reply("Nu sunt pe canal animal prost, de ce insisti!")
        VC.join()
        .then(connection => {
            const dispatcher = connection.play('./resources/audio/animal.wav');
            dispatcher.on("end", end => {VC.leave()});
            musicConn = null;
        })
        .catch(console.error);
    }

    if (command == "maimuta"){
        var VC = message.member.voice.channel;
            if (!VC)
                return message.reply("Nu sunt pe canal animal prost, de ce insisti!")
            VC.join()
            .then(connection => {
                const dispatcher = connection.play('./resources/audio/monkey.wav');
                dispatcher.on("end", end => {VC.leave()});
                musicConn = null;
            })
            .catch(console.error);
    }


    if(command === 'stop') {
        // client.player.stop(message);
        if(!musicConn) {
            return message.channel.send("There is no music");
        }
        musicConn.disconnect();
        musicConn = null;
        musicQueue = [];
        message.channel.send('Jeff stopped the music!');
    }

    if(command === 'queue') {
        if(!musicConn) {
            return message.channel.send("There is no music therefore there is no queue");
        }
        if(musicQueue.length === 0) {
            return message.channel.send("Queue is empty");
        }

        let qMessage = ' __**QUEUE**__\n';

        for(let i = 0; i < musicQueue.length; i++) {
            let url = musicQueue[i];
            qMessage += `**${(i + 1).toString()}** \`\`${url}\`\` \n`;
        }

        message.channel.send(qMessage);
    }

    if(command === 'now') {
        if(!musicConn) {
            return message.channel.send("There is no music therefore there is no queue");
        }
        message.channel.send('Now playing ' + `\`\`${npURL}\`\``);
    }

    if(command === 'skip') {
        if(!musicConn) {
            return message.channel.send("There is no music therefore there is no queue");
        }
        musicDispatcher.end();
        musicDispatcher = null;
        message.channel.send('Song skipped!');
    }

    if(command.startsWith('av')) {
        const avatar = message.mentions.users.first();
        if(!avatar) {
            return message.channel.send(message.author.displayAvatarURL({
                dynamic: true,
                format: 'png',
                size: 512
            }));
        } else {
            message.channel.send(avatar.displayAvatarURL({
                dynamic: true,
                format: 'png',
                size: 512
            }))
        }
    }

    if(command === 'play') {
        let youtubeRegExp = /^(?:https?:\/\/)?(?:m\.|www\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))((\w|-){11})(?:\S+)?$/
        
        
        let query = await args;
        console.log(args)
        if(!query[0]) {
            return message.channel.send("You need to provide an URL");
        }

        let VC = message.member.voice.channel;
        if(!VC) {
            return message.channel.send("You need to be in a Voice channel");
        }

        let inVC = client.user.voice && client.user.voice.channel;
        if(inVC) {
            return message.channel.send("Arleady playing somewhere else");
        }

        if(query.toString().match(youtubeRegExp)) {
            musicQueue.push(query.toString());
            console.log(musicQueue);
            if(!musicConn) {
                message.member.voice.channel.join().then((conn) => {
                    musicConn = conn;
                    musicChannel = message.channel;
                    playNextSong();
                })
            }
        }
        else {
            // let embed = new Discord.MessageEmbed()
            // .setColor("#73ffdc")
            // .setDescription("Please select one of the videos")
            // .setTitle("Jeff Music");
            // let embedMsg = await message.channel.send(embed);
            let filter = m => m.author.id === message.author.id;
            let results = await search(query.join(' '), opts).catch(err => console.log(err));
            console.log(results);
            console.log("Aici:" + query.join(' '));
            if(results) {
                let youtubeResults = results.results;
                let i = 0;
                let titles = youtubeResults.map(result => {
                    i++;
                    return i + ") " + result.title;
                });
                // message.channel.send({
                //     embed: {
                //         title: 'Select which song you want by typing the number',
                //         description: titles.join("\n")
                //     }
                // }).catch(err => console.log(err));
                
                filter = m => (m.author.id === message.author.id) && m.content >= 1 && m.content <= youtubeResults.length;
                // let collected = await message.channel.awaitMessages(filter, {max: 1});
                // let selected = youtubeResults[collected.first().content - 1];
                let selected = youtubeResults[0]
                musicQueue.push(selected.link);
                if(!musicConn) {
                    message.member.voice.channel.join().then((conn) => {
                        musicConn = conn;
                        musicChannel = message.channel;
                        playNextSong();
                        message.channel.send('Now playing -' + selected.title);
                    })
                }

                embed = new Discord.MessageEmbed()
                    .setTitle(`${selected.title}`)
                    .setURL(`${selected.link}`)
                    .setDescription(`${selected.description}`)
                    .setThumbnail(`${selected.thumbnails.default.url}`);

                message.channel.send(embed);
            }
        }
    }

    
    let tokens = message.cleanContent.split(" ");   
    if (command.startsWith("gif")) {
        let keywords = "coding train";
        if (tokens.length > 1) {
          keywords = tokens.slice(1, tokens.length).join(" ");
        }
        let url = `https://api.tenor.com/v1/search?q=${keywords}&key=${TENOR_TOKEN}&contentfilter=high`;
        let response = await fetch(url);
        let json = await response.json();
        const index = Math.floor(Math.random() * json.results.length);
        message.channel.send(json.results[index].url);
        message.channel.send("GIF from Tenor: " + keywords);
    }

    if (command === 'kickdragos') {
        member = message.guild.members.cache.get(config.Dragos_ID);
        member.voice.setChannel(null);
    }
    
    if (command === 'kickAndrei') {
        member = message.guild.members.cache.get(config.Andrei_ID);
        member.voice.setChannel(null);
    }
});

function loadCommands() {
    commandsList = fs.readFileSync('comenzi.txt').toString();
}

async function playNextSong() {
    let nextUrl = musicQueue[0];

    musicDispatcher = musicConn.play(ytdl(nextUrl, {filter: "audioonly", quality: "highestaudio"}));
    
    musicQueue.shift();
    npURL = nextUrl;

    musicDispatcher.on("speaking", (speaking) => {
        if (!speaking) {

            if(musicQueue.length == 0) {
                musicChannel.send("Done playing music");
                musicConn.disconnect();   
                musicConn = null;
            } else {
                playNextSong();
            }

          
        }
    })
}
/**   Deprecated v11 function 
async function searchYoutube(searchTerm) {
    return new Promise((resolve, reject) => {

        let url = 'https://www.youtube.com/results?search_query=' +encodeURIComponent(searchTerm);

        request.get(url, (err, res, body) => {
            if(err) throw err;

            const $ = cheerio.load(body);
            let results = $('a.yt-uix-tile-link.yt-ui-ellipsis.yt-ui.ellipsis-2.yt-uix-sessionlink.spf-link');
            let firstResutlt = results.get(0);
            if(!firstResutlt) {
                return reject();
            }

            let firstUrl = firstResutlt.attribs.href;

            firstUrl = `https://youtube.com` + firstUrl;
            resolve(firstUrl);
        })
    })
}

*/