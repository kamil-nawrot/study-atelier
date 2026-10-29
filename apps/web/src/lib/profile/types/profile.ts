import type { RankForm } from '#lib/profile/types/rank-form.ts';

export type Profile = {
	displayName: string | null;
	avatarPath: string | null;
	rankForm: RankForm;
};
