require("dotenv").config();

const axios = require("axios")
const Twitter = require("twitter-v2")
const schedule = require('node-schedule');
const moment = require("moment");


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

async function getTweetsTodayByProfile(profile, initDate, endDate) {
    const response = await client.get("tweets/search/recent", {
        query: `from:${profile}`,
        "start_time": initDate,
        "end_time": endDate,
        "tweet.fields": "created_at",
        "expansions": "author_id"
    })

    if (!response.data) {
        console.log(`Profile ${profile} don't have tweets in period`)
        return;
    }

    let links = []
    for (let index = 0; index < response.data.length; index++) {

        if (links.length == 20) {
            await axios.post(process.env.URL_WEBHOOK_CHANNEL_DISCORD, {
                content: links.join("\n")
            })
            console.log(`Sended ${links.length} tweets made of ${profile} to Discord`)
            links = []
            await sleep(1)
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

schedule.scheduleJob('30 0 * * *', async () => {
    const initDate = (moment().utc().subtract(1, "day").format("YYYY-MM-DDT00:00:00Z"))
    const endDate =  (moment().utc().subtract(1, "day").format("YYYY-MM-DDT23:59:59Z"))
    for (let index = 0; index < profilesToMonitor.length; index++) {
        await getTweetsTodayByProfile(profilesToMonitor[index], initDate, endDate)
        sleep(1)
    }
})


