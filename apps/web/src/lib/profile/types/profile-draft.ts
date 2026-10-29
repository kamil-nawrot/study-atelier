import type { AvatarChange } from './avatar-change.ts';
import type { RankForm } from '#lib/profile/types/rank-form.ts';

export type ProfileDraft = {
	name: string;
	avatar: AvatarChange;
	rankForm: RankForm;
};
