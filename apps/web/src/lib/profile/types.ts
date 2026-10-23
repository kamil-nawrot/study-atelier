import type { QuizMode, ReviewForm } from '#lib/review/types.ts';

export type Profile = {
	displayName: string | null;
	avatarPath: string | null;
};

export type AvatarChange = { kind: 'keep' } | { kind: 'remove' } | { kind: 'replace'; image: Blob };

export type ProfileDraft = {
	name: string;
	avatar: AvatarChange;
};

export type ProfileResult = {
	profile: Profile;
	error?: string;
};

export type ProfileSaveResult = { profile: Profile; error?: undefined } | { error: string };

export type Preferences = {
	reviewSessionSize: number;
	reviewNewPerDay: number;
	reviewForm: ReviewForm;
	reviewQuizKinds: QuizMode[];
	reviewFree: boolean;
	viewShowPins: boolean;
	viewLoupeOn: boolean;
};

export type PreferencesPart = 'review' | 'view';

export type PreferencesResult = {
	preferences: Preferences;
	error?: string;
};

export type PreferencesSaveResult =
	{ preferences: Preferences; error?: undefined } | { error: string };
