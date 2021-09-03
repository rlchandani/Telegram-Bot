export declare namespace RegisteredUser {
  interface Record {
    [key: string]: {
      all_members_are_administrators: boolean;
      created_at: number;
      enabled: boolean;
      first_name: string;
      id: number;
      is_bot: boolean;
      language_code: string;
      updated_at: number;
      username: string;
    };
  }
}
