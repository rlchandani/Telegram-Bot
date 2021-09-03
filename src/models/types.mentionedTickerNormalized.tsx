export declare namespace MentionedTickerNormalized {
  interface Record {
    [key: string]: {
      [key: string]: {
        total: number;
        users: {
          [key: string]: {
            price: number;
            total: number;
          };
        };
      };
    };
  }
}
