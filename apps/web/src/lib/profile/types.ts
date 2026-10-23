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
