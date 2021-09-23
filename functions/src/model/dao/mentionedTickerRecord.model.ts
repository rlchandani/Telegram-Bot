export interface MentionedTickerRecord {
  [key: string]: {
    [key: string]: {
      userId: number;
      symbol: string;
      price: number;
      day: number;
      createdOn: number;
    }
  };
}
