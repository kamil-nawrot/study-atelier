export const SETTINGS_TABS = ['profile', 'account', 'review', 'view', 'data'] as const;

export type SettingsTab = (typeof SETTINGS_TABS)[number];

export function settingsTabOf(value: string | null): SettingsTab {
	return (SETTINGS_TABS as readonly unknown[]).includes(value) ? (value as SettingsTab) : 'profile';
}
