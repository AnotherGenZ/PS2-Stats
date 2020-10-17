const Eris = require('eris');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

require('dotenv').config();

const client = new Eris(process.env.DISCORD_TOKEN);


client.on('ready', () => console.log('Ready to serve stats!'));

const PREFIX = process.env.PREFIX || '~';

const COLORS = {
    VS: 6234519,
    TR: 9767936,
    NC: 16774912,
    NS: 15920362
}

const FACTION_ID = {
    1: 'VS',
    2: 'NC',
    3: 'TR',
    4: 'NS'
}

async function getFactionColor(player) {
    let res = await fetch(`http://census.daybreakgames.com/s:${process.env.SERVICE_ID}/get/ps2:v2/character/?name.first_lower=${player.toLowerCase()}`)
        .catch(err => console.log(err))
        .then(p => p.json())

    if (res) return COLORS[FACTION_ID[res.character_list[0].faction_id]];

    return 0;
}

client.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    if (!msg.content.startsWith(PREFIX)) return;

    let params = msg.content.split(' ');
    let cmd = params.splice(0, 1)[0].slice(1);

    if (cmd === 'binary') {
        let player = params[0];
        let sampleSize = Number.parseInt(params[1]) || 1000;

        let res;

        try {
            res = await fetch(`http://stats.binarycoder.info/playerinfo.php?playerName=${player}&sampleSize=${sampleSize}`);
        } catch (err) {
            console.log(err);
            return;
        }

        if (res) {
            res = await res.text();
        }

        let factionColor = await getFactionColor(player);

        const $ = cheerio.load(res);

        let trueKD = $('.infobox', '.killFeedBox')[0].children[1].children[0].children[0].data;
        let resKD = $('.infobox', '.killFeedBox')[1].children[1].children[0].children[0].data;
        let hsr = $('.infobox', '.killFeedBox')[2].children[1].children[0].children[0].data;
        let accuracy = $('.infobox', '.killFeedBox')[3].children[1].children[0].children[0].data;
        let ivi = $('.infobox', '.killFeedBox')[4].children[1].children[0].children[0].data;
        let weaponOfChoice = $('.infobox', '.killFeedBox')[5].children[1].children[1].children[0]?.data;

        let deaths = Math.round(sampleSize / (Number.parseFloat(trueKD) + 1));
        let kills = sampleSize - deaths;
         

        client.createMessage(msg.channel.id, {
            embed: {
                title: `${player} Stats`,
                color: factionColor,
                fields: [
                    {
                        name: 'KD',
                        value: trueKD,
                        inline: true
                    },
                    {
                        name: 'Res KD',
                        value: resKD,
                        inline: true
                    },
                    {
                        name: 'HSR',
                        value: hsr,
                        inline: true
                    },
                    {
                        name: 'Accuracy',
                        value: accuracy,
                        inline: true
                    },
                    {
                        name: 'IVI',
                        value: ivi,
                        inline: true
                    },
                    {
                        name: 'Weapon of Choice',
                        value: weaponOfChoice ? weaponOfChoice : 'N/A',
                        inline: true
                    },
                ],
                footer: {
                    text: `${kills} Kills / ${deaths} Deaths`
                }
            }
        });
    } else if (cmd === 'recursion') {
        let sessionLink = params[0];

        let res; 
        
        try {
            res = await fetch(sessionLink);
        } catch (err) {
            console.log(err);
            return;
        }

        if (res) {
            res = await res.text();
        }

        const $ = cheerio.load(res);

        let playerInfo = $('.container', '.container-fluid')[0].children[6].children[1].children[0].children[1].children[0]

        let username = playerInfo.children[2].children[0].data;
        let BR = playerInfo.children[5].data.replace(' ', '');

        let factionColor = await getFactionColor(username.split(']')[1].replace(' ', ''));

        let sessionInfo = $('.container', '.container-fluid')[1].children[4].children[1];

        let sessionStart = sessionInfo.children[0].children[1].children[0].children[1].data;
        let sessionEnd = sessionInfo.children[0].children[1].children[0].children[3].data;
        let sessionDuration = sessionInfo.children[0].children[1].children[0].children[5].data;
        let kills = sessionInfo.children[2].children[1].children[0].children[1].data;
        let deaths = sessionInfo.children[2].children[1].children[0].children[3].data;
        let KDR = sessionInfo.children[2].children[1].children[0].children[5].data;
        let vKills = sessionInfo.children[2].children[1].children[0].children[11].data;
        let kpm = sessionInfo.children[2].children[1].children[0].children[13].data;
        let hsr = sessionInfo.children[4].children[1].children[0].children[3].data;

        client.createMessage(msg.channel.id, {
            embed: {
                title: `${username} BR ${BR}`,
                color: factionColor,
                fields: [
                    {
                        name: 'Session Start',
                        value: sessionStart,
                        inline: true
                    },
                    {
                        name: 'Session End',
                        value: sessionEnd,
                        inline: true
                    },
                    {
                        name: 'Session Duration',
                        value: sessionDuration,
                        inline: true
                    },
                    {
                        name: 'Kills',
                        value: kills,
                        inline: true
                    },
                    {
                        name: 'Deaths',
                        value: deaths,
                        inline: true
                    },
                    {
                        name: 'KDR',
                        value: KDR,
                        inline: true
                    },
                    {
                        name: 'Vehicle Kills',
                        value: vKills,
                        inline: true
                    },
                    {
                        name: 'KPM',
                        value: kpm,
                        inline: true
                    },
                    {
                        name: 'HSR',
                        value: hsr,
                        inline: true
                    },
                ]
            }
        });
    }
});

client.connect();