export const getPriceMovementIcon = (price: number) => {
  if (price < 0) {
    return "💔";
  }
  if (price > 0) {
    return "💚";
  }
  return "";
};

export const getMarketCapIcon = (marketCap: number) => {
  if (marketCap > 250000000 && marketCap < 2000000000) {
    return "🥉";
  } else if (marketCap > 2000000000 && marketCap < 10000000000) {
    return "🥈";
  } else if (marketCap > 10000000000) {
    return "🥇";
  } else {
    return "🥉🥉";
  }
};

export const roundToTwo = (num: number) => {
  const places = 2;
  const factor = 10 ** places;
  return (Math.round(num * factor) / factor).toLocaleString("en", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};
