const Discord = require('discord.js');
const bot = new Discord.Client();

var logger = require('winston');

// Add token for Discord
var auth = require('./auth.json');

const fetch = require('node-fetch');

const whereMessages = [
        'https://c.tenor.com/MUfeNecHTiAAAAAM/arrival-darth-vader.gif',
        'https://tenor.com/view/patience-patiently-waiting-gif-12710259',
        'https://tenor.com/view/star-wars-yoda-patience-sw3-gif-21070142',
	'https://tenor.com/view/yoda-wisdom-starwars-nod-gif-5316035',
	'https://tenor.com/view/mandalorian-baby-yoda-hello-gif-19013340'
];

// Configure logger settings
const poolDiff = 4000000000; 

logger.remove(logger.transports.Console);

logger.add(new logger.transports.Console, {
    colorize: true,
    timestamp: true
});

logger.level = 'debug';

bot.on('debug', error=>logger.info("Error: "+error));
bot.on('rateLimit',error=>logger.info("Ratelimit: "+error));
bot.on('ready', () => {
    bot.user.setStatus('available');

    logger.info('Connected');
    logger.info('Logged in as: ' + bot.user.tag + ' (' + bot.user.id + ')');

    // update every 30 seconds
    var updateInterval = 1000 * 30;

    // using updateInterval, get coindata, then update nickname on all guilds/servers that the bot is on
        setInterval(function() {
                var pooldata = fetchErgostats();
                 pooldata.then(function(res) {
//                      var shares = res[1].count.toLocaleString();
                        var effort = (res[1].count*poolDiff)/(res[0].miningCost.difficulty);
                        effort = Math.round((effort*100)*100+Number.EPSILON)/100 + '%';

                        var serverCount=1;

                        logger.info('EnigmaBot: Changing effort status');

                        bot.guilds.cache.map((guild) => {
                                updateBots(effort,serverCount,bot);
                                serverCount=serverCount+1;
                        });
                        logger.info("EnigmaBot: Updated for "+effort + "effort (" + serverCount+" servers)");
                });
        }, updateInterval);

});

function updateBots(update,i,bot) {
        setTimeout(function() {
                bot.user.setActivity(update, { type: "WATCHING" });
        },1000*i);
}

bot.login(auth.token);

var help_message = {
color: "#9966cc",
title: "EnigmaBot Commands",
description: "\n\
**!ehelp** - This message!\n\
**!estatus** - Show Enigma pool/Ergo network information" };

bot.on('message', msg =>
{

    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`

    if (msg.content.substring(0, 1) == '!') {
        var args = msg.content.substring(1).split(' ');
        var cmd = args[0];
        args = args.splice(1);


        switch(cmd.toLowerCase()) {


                case 'ehelp':
                    msg.channel.send({embed: help_message});
                break;

                case 'wherefuckingblock':
                case 'wheremyfuckingblock':
                case 'wherefuckinblock':
                case 'whereblock':
                case 'wherefuckingblonk':
                       msg.channel.send(randomWhereMsg());
                break;



                case 'estatus':
                        var poolStatus = fetchErgostats();
                        poolStatus.then(function(res) {
                                var effort = (res[1].count*poolDiff)/(res[0].miningCost.difficulty);
                                effort = Math.round((effort*100)*100+Number.EPSILON)/100 + '%';
                                // load 1hr hash from api
                                for (var i=0; i < res[2].hashrates.length; i++) {
                                        if (res[2].hashrates[i].name == "1 hour") { var oneHrHash= res[2].hashrates[i].hashrate; }
					if (res[2].hashrates[i].name == "10 min") { var tenMinHash = res [2].hashrates[i].hashrate; }
                                }
                                statusMessage = {
                                        color: "#9966cc",
                                        title: "Pool/Network Status",
                                        description:
                                        "Shares submitted: " + res[1].count.toLocaleString() + "\n" +
                                        "Pool hashrate (10m avg): " + hash(tenMinHash) + "H/s\n" +
					"Pool hashrate (1hr avg): " + hash(oneHrHash) + "H/s\n" +
                                        "Pool difficulty: " + hash(poolDiff) + "H\n" +
                                        "Pool effort: " + effort + "\n" +
					"Expected Time Per Block (10min avg): " + fancyTimeFormat(res[0].miningCost.difficulty/(tenMinHash)) + "\n" +
                                        "Expected Time Per Block (1hr avg): " + fancyTimeFormat(res[0].miningCost.difficulty/(oneHrHash)) + "\n" +
                                        "Network difficulty: " + hash(res[0].miningCost.difficulty) + "H\n" +
                                        "Network hashrate: " + hash(res[0].miningCost.hashRate) + "H/s\n" };
                                msg.channel.send({embed: statusMessage});
                        });
                break;

        }
     }
});

async function fetchErgostats() {
   var responses = await Promise.all([
        fetch('https://api.ergoplatform.com/api/v0/stats'),
        fetch('https://api.enigmapool.com/shares'),
        fetch('https://api.enigmapool.com/hashrate')
   ]);

   logger.info('EnigmaBot: Fetching from Ergo Platform and EnigmaPool apis');
  
   var data = await Promise.all(responses.map(function (response) { 
           return response.json();
   } ));

   return data;
}

function hash(value) {
   let prefixArray=[""," K", " M", " G"," T"," P"," E"];
   let prefixCounter = 0;
   while (value>1000) {
        prefixCounter++;
        value = value/1000;
        if (prefixCounter===prefixArray.length-1) {
                break;
        }
   }
  return (Math.round(value*100+Number.EPSILON)/100)+prefixArray[prefixCounter];
}

function fancyTimeFormat(duration)
{   
    // Hours, minutes and seconds
    var days = ~~((duration / 3600) / 24);
    var hrs = ~~((duration / 3600) % 24);
    var mins = ~~((duration % 3600) / 60);
    var secs = ~~duration % 60;

    // Output like "1:01" or "4:03:59" or "123:03:59"
    var ret = "";

    if (hrs > 0) {
	if (days > 0) {
		ret += "" + days + "d " + hrs + "h " + (mins < 10 ? "0" : "");
	} else {
        	ret += "" + hrs + "h " + (mins < 10 ? "0" : "");
	}
    }

    ret += "" + mins + "m " + (secs < 10 ? "0" : "");
    ret += "" + secs +"s";
    return ret;
}

function randomWhereMsg() { 
        var randomNumber = Math.floor(Math.random()*whereMessages.length); 
        return whereMessages[randomNumber];
}


