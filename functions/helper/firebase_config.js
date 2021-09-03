const functions = require("firebase-functions");
let firebaseInternalConfig = functions.config();

const _config = () => {
  // Check if not dev
  if (process.env.FUNCTIONS_EMULATOR) {
    firebaseInternalConfig = JSON.parse(process.env.DEBUG_TELEGRAM_CONFIG);
  }

  // Check if bot_token is defined
  if (firebaseInternalConfig.telegram.bot_token === undefined) {
    throw new TypeError("Telegram bot token must be provided!");
  }

  // Check if api_key is defined
  if (firebaseInternalConfig.google.api_key === undefined) {
    throw new TypeError("Google API key must be provided!");
  }

  // Check if robinhood credentials is defined
  if (
    firebaseInternalConfig.robinhood.username === undefined ||
    firebaseInternalConfig.robinhood.password === undefined ||
    firebaseInternalConfig.robinhood.api_key === undefined
  ) {
    throw new TypeError("Robinhood credentials must be provided!");
  }

  // Check if watchlist is defined
  if (firebaseInternalConfig.watchlist.mentioned === undefined || firebaseInternalConfig.watchlist.track === undefined) {
    throw new TypeError("Watchlist must be provided!");
  }

  // if (firebaseInternalConfig.demo === undefined) {
  //   throw new TypeError("Demo must be defined!");
  // }

  return firebaseInternalConfig;
};

exports.firebaseConfig = _config();
