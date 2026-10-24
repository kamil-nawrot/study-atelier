import { m } from '#lib/i18n/i18n.ts';
import type { AvatarChange, Profile, ProfileDraft } from '#lib/profile/types.ts';

export const DISPLAY_NAME_MAX_LENGTH = 60;

export const emptyProfile: Profile = { displayName: null, avatarPath: null };

export function validateDisplayName(name: string): string | undefined {
	if (name.trim().length > DISPLAY_NAME_MAX_LENGTH) {
		return m.settings.profile.nameTooLong(DISPLAY_NAME_MAX_LENGTH);
	}
	return undefined;
}

export function normalizedName(name: string): string | null {
	const trimmed = name.replace(/\s+/g, ' ').trim();
	return trimmed === '' ? null : trimmed;
}

export function avatarInitial(profile: Profile | undefined, email: string): string {
	const source = profile?.displayName?.trim() || email.trim();
	return Array.from(source)[0]?.toLocaleUpperCase('pl') ?? '';
}

export function profileDraftOf(profile: Profile): ProfileDraft {
	return { name: profile.displayName ?? '', avatar: { kind: 'keep' } };
}

function sameAvatar(left: AvatarChange, right: AvatarChange): boolean {
	if (left.kind !== right.kind) return false;
	return left.kind !== 'replace' || left.image === (right as typeof left).image;
}

export function profileDraftChanged(current: ProfileDraft, reference: ProfileDraft): boolean {
	return (
		normalizedName(current.name) !== normalizedName(reference.name) ||
		!sameAvatar(current.avatar, reference.avatar)
	);
}

export function showsAvatar(profile: Profile, avatar: AvatarChange): boolean {
	if (avatar.kind === 'replace') return true;
	return avatar.kind === 'keep' && profile.avatarPath !== null;
}
