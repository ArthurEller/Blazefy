require("dotenv/config");
const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);

var PREDICTED_COLOR;
var LAST_COLOR;
var LAST_SEED;
var NEW_RESULT = "new";
var GALE = 0;
var MESSAGE_ID = null;

const BLAZE_TILES = {
  white: 0,
  red: 1,
  black: 2,
};

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function getDoubleResults() {
  let blazeResults = [];

  const config = {
    method: "get",
    url: `${process.env.BLAZE_URL}/roulette_games/recent`,
  };

  try {
    let results = await axios(config);

    results = results.data;

    results.map((result, i) => {
      switch (result.color) {
        case BLAZE_TILES.black:
          blazeResults.push({
            color: "black",
            id: BLAZE_TILES.black,
          });
          break;

        case BLAZE_TILES.red:
          blazeResults.push({
            color: "red",
            id: BLAZE_TILES.red,
          });
          break;

        case BLAZE_TILES.white:
          blazeResults.push({
            color: "white",
            id: BLAZE_TILES.white,
          });
          break;
      }

      if (i === 19) {
        LAST_COLOR = blazeResults[0].color;

        if (LAST_SEED !== result.server_seed) {
          NEW_RESULT = "true";
        } else {
          NEW_RESULT = "false";
        }

        LAST_SEED = result.server_seed;
      }
    });

    return blazeResults;
  } catch (error) {
    console.log(error);
  }
}

async function parseResultAndReturnTip() {
  if (LAST_COLOR === "white") {
    PREDICTED_COLOR = LAST_COLOR === "red" ? "black" : "red";

    return bot.telegram.sendMessage(
      process.env.CHANNEL_ID,
      `<b>🔥Blazefy Double🔥</b>
<b>🎰 Entrada confirmada no: ${PREDICTED_COLOR === "red" ? "🟥" : "⬛️"}</b>
<b>🛡 PROTEÇÃO:  ⬜️ </b>`,
      { parse_mode: "HTML" }
    );
  }

  // INICIAL
  if (!PREDICTED_COLOR || LAST_COLOR === PREDICTED_COLOR) {
    PREDICTED_COLOR = LAST_COLOR === "red" ? "black" : "red";
    const message = await bot.telegram.sendMessage(
      process.env.CHANNEL_ID,
      `<b>🔥Blazefy Double🔥</b>
<b>🎰 Entrada confirmada no: ${PREDICTED_COLOR === "red" ? "🟥" : "⬛️"}</b>
<b>🛡 PROTEÇÃO:  ⬜️ </b>`,
      { parse_mode: "HTML" }
    );

    MESSAGE_ID = message.message_id;

    return message;
  }

  // GALE
  if (LAST_COLOR !== PREDICTED_COLOR && GALE <= 2) {
    GALE++;

    const message = await bot.telegram.sendMessage(
      process.env.CHANNEL_ID,
      `<b>GALE ${GALE === 1 ? "1️⃣" : "2️⃣"}</b>`,
      {
        parse_mode: "HTML",
        reply_to_message_id: MESSAGE_ID,
      }
    );

    if (GALE === 2) GALE = undefined;
    return message;
  }

  if (LAST_COLOR !== PREDICTED_COLOR && !GALE) {
    GALE = 0;
    PREDICTED_COLOR = null;
    return bot.telegram.sendMessage(
      process.env.CHANNEL_ID,
      `❌ <b>Refazendo calculo do algoritmo!</b> ❌`,
      { parse_mode: "HTML" }
    );
  }
}

async function logic() {
  await getDoubleResults();

  try {
    if (NEW_RESULT === "new" || NEW_RESULT === "true") {
      if (LAST_COLOR === "white") {
        GALE = 0;
        await bot.telegram.sendMessage(
          process.env.CHANNEL_ID,
          "<b>🤑🤑🤑 WHITEEEE 🤑🤑🤑</b>",
          { parse_mode: "HTML" }
        );

        return parseResultAndReturnTip();
      }

      if (LAST_COLOR === PREDICTED_COLOR && GALE === 0) {
        await bot.telegram.sendMessage(
          process.env.CHANNEL_ID,
          "<b>✅✅✅ GREEN ✅✅✅</b>",
          { parse_mode: "HTML", reply_to_message_id: MESSAGE_ID }
        );

        MESSAGE_ID = null;

        return parseResultAndReturnTip();
      }

      if (LAST_COLOR === PREDICTED_COLOR && GALE > 0) {
        GALE = 0;
        await bot.telegram.sendMessage(
          process.env.CHANNEL_ID,
          "<b>✅✅✅ GREEN ✅✅✅</b>",
          { parse_mode: "HTML", reply_to_message_id: MESSAGE_ID }
        );

        MESSAGE_ID = null;

        return parseResultAndReturnTip();
      }

      parseResultAndReturnTip();
    }
  } catch (error) {
    console.log(error);
  }
}

async function run() {
  console.log("🔥Blazefy Double🔥");
  (async () => {
    while (true) await logic();
  })();
}

module.exports = {
  run,
};
