require("dotenv/config");
const { Telegraf } = require("telegraf");
const axios = require("axios");

const bot = new Telegraf(process.env.BOT_TOKEN);

var PREDICTED_COLOR;
var LAST_COLOR;
var LAST_SEED;
var NEW_RESULT = "new";
var GALE = 0;

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
    return bot.telegram.sendMessage(
      process.env.CHANNEL_ID,
      `<b>🔥Blazefy Double🔥</b>
<b>🎰 Entrada confirmada no: ${PREDICTED_COLOR === "red" ? "🟥" : "⬛️"}</b>
<b>🛡 PROTEÇÃO:  ⬜️ </b>`,
      { parse_mode: "HTML" }
    );
  }

  // GALE 1
  if (LAST_COLOR !== PREDICTED_COLOR && GALE < 2) {
    GALE++;

    return bot.telegram.sendMessage(
      process.env.CHANNEL_ID,
      `<b>🔥Blazefy Double🔥</b>
<b>🎰 Entrada confirmada no: ${PREDICTED_COLOR === "red" ? "🟥" : "⬛️"}</b>
<b>🛡 PROTEÇÃO:  ⬜️ </b>
ℹ️ GALE: ${GALE}
            `,
      { parse_mode: "HTML" }
    );
  }

  if (LAST_COLOR !== PREDICTED_COLOR && GALE === 2) {
    GALE = 0;
    PREDICTED_COLOR = null;
    return bot.telegram.sendMessage(
      process.env.CHANNEL_ID,
      `<b>🔥Blazefy Double🔥</b>
❌ <b>Não foi dessa vez, atentos no gerenciamento!</b>
        `,
      { parse_mode: "HTML" }
    );
  }

  if (LAST_COLOR === PREDICTED_COLOR && GALE === 2) {
    PREDICTED_COLOR = LAST_COLOR === "red" ? "black" : "red";
    GALE = 0;
    return bot.telegram.sendMessage(
      process.env.CHANNEL_ID,
      `<b>🔥Blazefy Double🔥</b>
<b>🎰 Entrada confirmada no:${PREDICTED_COLOR === "red" ? "🟥" : "⬛️"}</b>
<b>🛡 PROTEÇÃO:  ⬜️ </b>
        `,
      { parse_mode: "HTML" }
    );
  }
}

async function run() {
  await getDoubleResults();
  console.log("---------------------------------------");
  console.log("IS NEW? ", NEW_RESULT);
  console.log("LAST: ", LAST_COLOR);
  console.log("PREDICTED: ", PREDICTED_COLOR);
  console.log("GALE? ", GALE);

  try {
    if (NEW_RESULT === "new" || NEW_RESULT === "true") {
      if (LAST_COLOR === "white") {
        GALE = 0;
        bot.telegram.sendMessage(
          process.env.CHANNEL_ID,
          "<b>🤑🤑🤑 SEGURA ESSE WHITEEEE!</b>",
          { parse_mode: "HTML" }
        );
        await sleep(1000);

        return parseResultAndReturnTip();
      }

      if (LAST_COLOR === PREDICTED_COLOR && GALE === 0) {
        bot.telegram.sendMessage(
          process.env.CHANNEL_ID,
          "<b>✅✅✅ CHAMA NO GREEN PAPAI 🤑</b>",
          { parse_mode: "HTML" }
        );
        await sleep(1000);

        return parseResultAndReturnTip();
      }

      if (LAST_COLOR === PREDICTED_COLOR && GALE > 0) {
        GALE = 0;
        bot.telegram.sendMessage(
          process.env.CHANNEL_ID,
          "<b>✅✅✅ CHAMA NO GREEN PAPAI 🤑</b>",
          { parse_mode: "HTML" }
        );
        await sleep(1000);

        return parseResultAndReturnTip();
      }

      parseResultAndReturnTip();
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  run,
};
