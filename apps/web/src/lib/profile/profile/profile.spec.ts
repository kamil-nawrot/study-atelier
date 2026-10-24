import { describe, expect, it } from 'vitest';
import { m } from '#lib/i18n/i18n.ts';
import {
	avatarInitial,
	DISPLAY_NAME_MAX_LENGTH,
	normalizedName,
	profileDraftChanged,
	profileDraftOf,
	showsAvatar,
	validateDisplayName
} from './profile.ts';

describe('avatarInitial', () => {
	it('takes the first letter of the name in capitals', () => {
		expect(avatarInitial({ displayName: 'łukasz', avatarPath: null }, 'a@example.com')).toBe('Ł');
	});

	it('falls back to the first letter of the email without a name', () => {
		expect(avatarInitial({ displayName: null, avatarPath: null }, 'anna@example.com')).toBe('A');
		expect(avatarInitial(undefined, 'anna@example.com')).toBe('A');
	});

	it('falls back to the email when the name is only spaces', () => {
		expect(avatarInitial({ displayName: '  ', avatarPath: null }, 'zofia@example.com')).toBe('Z');
	});
});

describe('normalizedName', () => {
	it('trims and collapses spaces', () => {
		expect(normalizedName('  Anna   Maria ')).toBe('Anna Maria');
	});

	it('stores an empty name as nothing', () => {
		expect(normalizedName('   ')).toBeNull();
	});
});

describe('validateDisplayName', () => {
	it('accepts a name up to the limit', () => {
		expect(validateDisplayName('x'.repeat(DISPLAY_NAME_MAX_LENGTH))).toBeUndefined();
	});

	it('says how long the name may be when it is over the limit', () => {
		expect(validateDisplayName('x'.repeat(DISPLAY_NAME_MAX_LENGTH + 1))).toBe(
			m.settings.profile.nameTooLong(DISPLAY_NAME_MAX_LENGTH)
		);
	});
});

describe('profileDraftChanged', () => {
	const saved = profileDraftOf({ displayName: 'Anna', avatarPath: null });

	it('sees no change in the same draft or in a name that differs only in spacing', () => {
		expect(profileDraftChanged(saved, saved)).toBe(false);
		expect(profileDraftChanged({ ...saved, name: ' Anna ' }, saved)).toBe(false);
	});

	it('sees a changed name', () => {
		expect(profileDraftChanged({ ...saved, name: 'Ania' }, saved)).toBe(true);
	});

	it('sees a new photo and a removed photo', () => {
		const image = new Blob(['a'], { type: 'image/jpeg' });
		expect(profileDraftChanged({ ...saved, avatar: { kind: 'replace', image } }, saved)).toBe(true);
		expect(profileDraftChanged({ ...saved, avatar: { kind: 'remove' } }, saved)).toBe(true);
	});

	it('treats the same new photo as unchanged', () => {
		const image = new Blob(['a'], { type: 'image/jpeg' });
		const draft = { ...saved, avatar: { kind: 'replace' as const, image } };
		expect(profileDraftChanged(draft, { ...draft })).toBe(false);
	});
});

describe('showsAvatar', () => {
	const image = new Blob(['a'], { type: 'image/jpeg' });

	it('shows the saved photo until it is removed', () => {
		const profile = { displayName: null, avatarPath: 'owner/avatar-1.jpg' };
		expect(showsAvatar(profile, { kind: 'keep' })).toBe(true);
		expect(showsAvatar(profile, { kind: 'remove' })).toBe(false);
	});

	it('shows a new photo and shows none for a profile without one', () => {
		const profile = { displayName: null, avatarPath: null };
		expect(showsAvatar(profile, { kind: 'replace', image })).toBe(true);
		expect(showsAvatar(profile, { kind: 'keep' })).toBe(false);
	});
});
