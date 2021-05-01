// var express = require("express");
// var app = express();
var cron =  require('node-cron');
require("dotenv").config();
const axios = require("axios");

//
let telegram_url = "https://api.telegram.org/bot" + process.env.TELEGRAM_API_TOKEN + "/sendMessage";
let setuUrl = process.env.DISTRICT_INFO_SETU
let openWeatherUrl = process.env.OPENWEATHER_API_URL;
//
var smthCompleted = false;


// app.get('/', (req, res) => {
//     res.send('Hello World!')
//   })
  

// app.post("/start_bot", function(req, res) {
//     const { message } = req.body;
    
//     let reply = "Welcome to telegram weather bot";
//     console.log(`${message.text}`);
//     let talking_to_bot_check = (message.text || "").includes("@jareeboty_bot");
//     let city_check = (message.text || "").toLowerCase().indexOf('/');
//     if (talking_to_bot_check && (message.text || "").toLowerCase().indexOf("hi") !== -1) {
//         sendMessage(telegram_url, message, reply, res);
//     } else if ( talking_to_bot_check && (message.text || "").toLowerCase().indexOf("check") !== -1 && (city_check !== -1 )) {
//         city = message.text.split('/')[1];
//         get_forecast(city).then( response => {
//             sendMessage(telegram_url, message, response, res)
//         });
//     } else if (talking_to_bot_check && (message.text || "").length > 0) {
//         reply = "request not understood, please review and try again.";
//         sendMessage(telegram_url, message, reply, res);
//         return res.end();
//     } else {
//       console.log("Not sending a response");
//     }
// });

// app.listen(process.env.PORT || 3000, () => console.log(`Telegram bot is listening on port ${process.env.PORT}`));

function sendMessage(url, message, reply, res) {
    axios.post(url, {chat_id: process.env.GROUP_ID,
        text: reply
    }).then(response => {
        console.log("Message posted");
        res.end("ok");
    }).catch(error =>{
        console.log(error);
    });
}

function sendMessageToGroup(url, reply) {
    axios.post(url, {chat_id: process.env.GROUP_ID,
        text: reply
    }).then(response => {
        console.log("Message posted");
    }).catch(error =>{
        console.log(error);
    });
}

function get_forecast(city) {
    let new_url = openWeatherUrl + city+"&appid="+process.env.OPENWEATHER_API_KEY;
    return axios.get(new_url).then(response => {
        let temp = response.data.main.temp;
        //converts temperature from kelvin to celsuis
        temp = Math.round(temp - 273.15); 
        let city_name = response.data.name;
        let resp = "It's "+temp+" degrees in "+city_name;
        return resp;
    }).catch(error => {
        console.log(error);
    });
}

function check_slot_availability(districtId) {
    let date = getCurrentDate()
    axios.get(setuUrl, {
        params: {
            district_id: districtId,
            date: date
        }
    }).then(response => {
        // let testing = response.data.centers[0].name;
        // console.log(`haha: ${testing}`)
        checkForOpenSlot(response)
    }).catch(error => {
        console.log(error);
    })
}


function getCurrentDate() {
    var date = new Date();
    var month = pad2(date.getMonth()+1);//months (0-11)
    var day = pad2(date.getDate());//day (1-31)
    var year= date.getFullYear();
    
    return day+"-"+month+"-"+year;
}

function pad2(n) {
    return (n < 10 ? '0' : '') + n;
}
  
function checkForOpenSlot(response) {
    let resultList = response.data.centers.filter((center) => {
        var validCenter = false;
        center.sessions.every((session) => {
            console.log(`${session.min_age_limit}`);
            if (session.min_age_limit == 18 && session.available_capacity > 0) {
                validCenter = true;
                return false;
            }
        });
        return validCenter;
    });


    console.log(resultList.length);
    if (resultList !== null && resultList.length > 0) {
        var reply = `Slots available in Lucknow! \n\nTotal slots: ${resultList.length}\n=========================\n`;
        resultList.forEach((center) => {
            reply += `${center.name}, ${center.block_name}, FEE: ${center.fee_type} \n`;
            console.log(center.name);
        });
        sendMessageToGroup(telegram_url, reply);
    }  else {
        console.log("ResultList was null");
    }
} 

//check_slot_availability(670);

cron.schedule('*/30 * * * *', () => {
    console.log('running a task in 30 minutes');
    check_slot_availability(670);
  }).start();

console.log("Bot started");
//runPeriodically();