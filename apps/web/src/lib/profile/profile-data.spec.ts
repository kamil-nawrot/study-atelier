import { beforeEach, describe, expect, it, vi } from 'vitest';
import { m } from '#lib/i18n/index.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import { loadProfile, saveProfile } from './profile-data.ts';

const OWNER = '3f2c1d4e-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

const storage = vi.hoisted(() => ({
	upload: vi.fn(),
	remove: vi.fn()
}));

vi.mock('#lib/shared/data/supabase/supabase.ts', () => ({
	supabase: {
		from: vi.fn(),
		auth: { getSession: vi.fn(), signOut: vi.fn() },
		storage: { from: vi.fn(() => storage) }
	}
}));

const from = vi.mocked(supabase.from);
const signOut = vi.mocked(supabase.auth.signOut);

function selecting(result: unknown): void {
	from.mockReturnValue({
		select: () => ({ maybeSingle: () => Promise.resolve(result) })
	} as never);
}

function upserting(result: unknown): ReturnType<typeof vi.fn> {
	const upsert = vi.fn(() => ({ select: () => ({ single: () => Promise.resolve(result) }) }));
	from.mockReturnValue({ upsert } as never);
	return upsert;
}

const image = new Blob(['a'], { type: 'image/jpeg' });

beforeEach(() => {
	vi.clearAllMocks();
	vi.mocked(supabase.auth.getSession).mockResolvedValue({
		data: { session: { user: { id: OWNER } } }
	} as never);
	storage.upload.mockResolvedValue({ error: null });
	storage.remove.mockResolvedValue({ error: null });
});

describe('loadProfile', () => {
	it('reads the name and the avatar path', async () => {
		selecting({ data: { display_name: 'Anna', avatar_path: 'a/avatar-1.jpg' }, error: null });

		expect(await loadProfile()).toEqual({
			profile: { displayName: 'Anna', avatarPath: 'a/avatar-1.jpg' }
		});
	});

	it('gives an empty profile to a learner without a row', async () => {
		selecting({ data: null, error: null });

		expect(await loadProfile()).toEqual({ profile: { displayName: null, avatarPath: null } });
	});

	it('gives an empty profile and a message when the read fails', async () => {
		selecting({ data: null, error: { code: '500', status: 500 } });

		expect(await loadProfile()).toEqual({
			profile: { displayName: null, avatarPath: null },
			error: m.settings.profile.failed
		});
	});
});

describe('saveProfile', () => {
	const current = { displayName: 'Anna', avatarPath: `${OWNER}/avatar-old.jpg` };

	it('saves a trimmed name and keeps the photo', async () => {
		const upsert = upserting({
			data: { display_name: 'Ania', avatar_path: current.avatarPath },
			error: null
		});

		const result = await saveProfile({ name: '  Ania ', avatar: { kind: 'keep' } }, current);

		expect(upsert).toHaveBeenCalledWith({ display_name: 'Ania', avatar_path: current.avatarPath });
		expect(result).toEqual({ profile: { displayName: 'Ania', avatarPath: current.avatarPath } });
		expect(storage.upload).not.toHaveBeenCalled();
		expect(storage.remove).not.toHaveBeenCalled();
	});

	it('uploads a new photo into the learner folder and removes the old one', async () => {
		const upsert = upserting({
			data: { display_name: 'Anna', avatar_path: 'saved' },
			error: null
		});

		await saveProfile({ name: 'Anna', avatar: { kind: 'replace', image } }, current);

		const [path, body, options] = storage.upload.mock.calls[0];
		expect(path).toMatch(new RegExp(`^${OWNER}/avatar-[0-9a-f-]{36}\\.jpg$`));
		expect(body).toBe(image);
		expect(options).toMatchObject({ contentType: 'image/jpeg', upsert: false });
		expect(upsert).toHaveBeenCalledWith({ display_name: 'Anna', avatar_path: path });
		expect(storage.remove).toHaveBeenCalledWith([
			current.avatarPath,
			`${OWNER}/avatar-old-thumb.jpg`
		]);
	});

	it('clears the path and removes the file when the photo is removed', async () => {
		const upsert = upserting({ data: { display_name: 'Anna', avatar_path: null }, error: null });

		await saveProfile({ name: 'Anna', avatar: { kind: 'remove' } }, current);

		expect(upsert).toHaveBeenCalledWith({ display_name: 'Anna', avatar_path: null });
		expect(storage.remove).toHaveBeenCalledTimes(1);
	});

	it('stores an empty name as nothing', async () => {
		const upsert = upserting({ data: { display_name: null, avatar_path: null }, error: null });

		await saveProfile({ name: '  ', avatar: { kind: 'keep' } }, { ...current, avatarPath: null });

		expect(upsert).toHaveBeenCalledWith({ display_name: null, avatar_path: null });
	});

	it('removes the uploaded photo and keeps the old one when the row is not saved', async () => {
		upserting({ data: null, error: { code: '23514', status: 400 } });

		const result = await saveProfile({ name: 'Anna', avatar: { kind: 'replace', image } }, current);

		expect(result).toEqual({ error: m.settings.profile.failed });
		const uploaded = storage.upload.mock.calls[0][0];
		expect(storage.remove).toHaveBeenCalledWith([uploaded, uploaded.replace('.jpg', '-thumb.jpg')]);
		expect(storage.remove).not.toHaveBeenCalledWith(expect.arrayContaining([current.avatarPath]));
	});

	it('does not write the row when the upload fails', async () => {
		storage.upload.mockResolvedValue({ error: { status: 413, statusCode: '413' } });

		const result = await saveProfile({ name: 'Anna', avatar: { kind: 'replace', image } }, current);

		expect(result).toHaveProperty('error');
		expect(from).not.toHaveBeenCalled();
	});

	it('signs the learner out when the session has ended', async () => {
		upserting({ data: null, error: { code: 'PGRST301', status: 401 } });

		const result = await saveProfile({ name: 'Anna', avatar: { kind: 'keep' } }, current);

		expect(result).toEqual({ error: m.authErrors.sessionEnded });
		expect(signOut).toHaveBeenCalled();
	});
});
