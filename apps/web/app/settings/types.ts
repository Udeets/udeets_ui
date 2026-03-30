export type SettingsItem = {
  label: string;
  description: string;
  enabled: boolean;
};

export type SettingsSection = {
  title: string;
  items: SettingsItem[];
};
