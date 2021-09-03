import { MentionedTickerNormalized } from "./types.mentionedTickerNormalized";

export declare namespace RealtimeDatabase {
  interface StreamPayload {
    path: string;
    data: MentionedTickerNormalized.Record;
  }
}
