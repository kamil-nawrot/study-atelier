import { failureMessage } from '#lib/auth/expired-session.svelte.ts';
import { IMAGES_BUCKET } from '#lib/images/bucket.ts';
import { removeOwnImage } from '#lib/images/own-image.ts';
import { supabase } from '#lib/shared/data/supabase/supabase.ts';
import type { Database } from '#lib/shared/data/database.types.ts';
import { avatarPathOf } from './avatar.ts';
import { profileErrorMessage } from './errors.ts';
import { emptyProfile, normalizedName } from './profile.ts';
import type { Profile, ProfileDraft, ProfileResult, ProfileSaveResult } from './types.ts';

export const PROFILE_DEPENDENCY = 'profile:own';

type Row = Pick<Database['public']['Tables']['profiles']['Row'], 'display_name' | 'avatar_path'>;

const COLUMNS = 'display_name, avatar_path';

function profileOf(row: Row | null): Profile {
	return row ? { displayName: row.display_name, avatarPath: row.avatar_path } : emptyProfile;
}

export async function loadProfile(): Promise<ProfileResult> {
	const { data, error } = await supabase.from('profiles').select(COLUMNS).maybeSingle();
	if (error) return { profile: emptyProfile, error: profileErrorMessage(error) };
	return { profile: profileOf(data) };
}

async function uploadAvatar(image: Blob): Promise<{ path: string } | { error: string }> {
	const { data } = await supabase.auth.getSession();
	const ownerId = data.session?.user.id;
	if (!ownerId) return { error: profileErrorMessage({}) };
	const path = avatarPathOf(ownerId);
	const { error } = await supabase.storage
		.from(IMAGES_BUCKET)
		.upload(path, image, { contentType: image.type, upsert: false });
	if (error) return { error: await failureMessage(error, profileErrorMessage) };
	return { path };
}

export async function saveProfile(
	draft: ProfileDraft,
	current: Profile
): Promise<ProfileSaveResult> {
	let avatarPath = current.avatarPath;
	let uploaded: string | undefined;
	if (draft.avatar.kind === 'remove') avatarPath = null;
	if (draft.avatar.kind === 'replace') {
		const upload = await uploadAvatar(draft.avatar.image);
		if ('error' in upload) return { error: upload.error };
		uploaded = upload.path;
		avatarPath = upload.path;
	}
	const { data, error } = await supabase
		.from('profiles')
		.upsert({ display_name: normalizedName(draft.name), avatar_path: avatarPath })
		.select(COLUMNS)
		.single();
	if (error) {
		if (uploaded) await removeOwnImage(uploaded);
		return { error: await failureMessage(error, profileErrorMessage) };
	}
	if (current.avatarPath && current.avatarPath !== avatarPath) {
		await removeOwnImage(current.avatarPath);
	}
	return { profile: profileOf(data) };
}
