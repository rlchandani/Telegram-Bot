"use strict";

exports.extractTickerSymbolsInsideMessageText = (message) => {
  const re = /\$\w+/g;
  const matches = message.match(re);
  return matches ? [...new Set(matches.map((m) => m.substring(1)))] : [];
};

exports.extractTickerSymbolsFromQuoteCommand = (message) => {
  const re = /(\w+)/g;
  const matches = message.match(re);
  matches.shift();
  return matches ? [...new Set(matches)] : [];
};

exports.getPriceMovementIcon = (price) => {
  if (price < 0) {
    return "🔻";
  }
  if (price > 0) {
    return "🔺";
  }
  return "";
};
