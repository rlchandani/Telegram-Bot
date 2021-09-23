interface CountryData {
  name: string;
}
interface FlaggedCountries {
  [key: string]: CountryData;
}

export const flaggedCountries: FlaggedCountries = { CN: { name: "China" } };
