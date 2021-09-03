export declare namespace RegisteredGroup {
  interface Record {
    [key: string]: {
      all_members_are_administrators: boolean;
      created_at: number;
      enabled: boolean;
      id: number;
      requested_by: number;
      service: {
        all_services: boolean;
        automated_quotes: boolean;
        automated_welcome_members: boolean;
        holiday_events_india: boolean;
        holiday_events_usa: boolean;
        report_flagged_country: boolean;
        scheduled_polls: boolean;
        scheduled_reminders: boolean;
      };
      title: string;
      first_name: string,
      type: string;
      updated_at: number;
    };
  }
}
