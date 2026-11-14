import type { PinFragment } from '#lib/pins/types/pin-fragment.ts';

export type CoverCandidate = {
	meaningId: string | null;
	createdAt: string;
	fragment: PinFragment;
};

export function symbolCover(
	candidates: readonly CoverCandidate[],
	coverPinId?: string,
	meaningId?: string
): PinFragment | undefined {
	const fitting = candidates.filter(
		(candidate) => meaningId === undefined || candidate.meaningId === meaningId
	);
	const chosen = fitting.find((candidate) => candidate.fragment.pinId === coverPinId);
	if (chosen) return chosen.fragment;
	const newest = [...fitting].sort(
		(a, b) =>
			b.createdAt.localeCompare(a.createdAt) || a.fragment.pinId.localeCompare(b.fragment.pinId)
	)[0];
	return newest?.fragment;
}
