require("dotenv").config();

const axios = require("axios")
const Twitter = require("twitter-v2")
const schedule = require('node-schedule');


const client = new Twitter({
    consumer_key: process.env.API_TWITTER_KEY,
    consumer_secret: process.env.API_TWITTER_SECRET
});

const profilesToMonitor = [
    "rodrigobranas", "vercel", "devpleno",
    'loiane', 'unclebobmartin', "o_gabsferreira",
    'marcobrunodev', 'awscloud', 'digitalocean'
];

function sleep(seconds) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve()
        }, (seconds * 1000));
    })
}

async function getTweetsTodayByProfile(profile) {
    const response = await client.get("tweets/search/recent", {
        query: `from:${profile}`,
        "start_time": '2022-07-11T00:00:00Z',
        "end_time": '2022-07-11T23:59:59Z',
        "tweet.fields": "created_at",
        "expansions": "author_id"
    })

    if (!response.data) {
        console.log(`Profile ${profile} don't have tweets in period`)
        return;
    }

    console.log(response.data)
    let links = []
    for (let index = 0; index < response.data.length; index++) {

        if (links.length == 5) {
            await axios.post(process.env.URL_WEBHOOK_CHANNEL_DISCORD, {
                content: links.join("\n")
            })
            console.log(`Sended ${links.length} tweets made of ${profile} to Discord`)
            links = []
        }

        const item = response.data[index]
        links.push(`https://twitter.com/${item.author_id}/status/${item.id}`)
    }

    if (links.length > 0) {
        await axios.post(process.env.URL_WEBHOOK_CHANNEL_DISCORD, {
            content: links.join("\n")
        })
        console.log(`Sended ${links.length} tweets made of ${profile} to Discord`)
    }
}

schedule.scheduleJob('30 23 * * *', async () => {
    for (let index = 0; index < profilesToMonitor.length; index++) {
        await getTweetsTodayByProfile(profilesToMonitor[index])
        sleep(1)
    }
})


