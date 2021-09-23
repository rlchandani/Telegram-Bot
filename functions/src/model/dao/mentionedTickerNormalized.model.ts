export interface MentionedTickerNormalizedRecord {
  [key: string]: {
    [key: string]: {
      [key: string]: {
        price: number;
        total: number;
        updatedOn: number;
        users: {
          [key: string]: {
            price: number;
            total: number;
          }
        }
      }
    }
  };
}
