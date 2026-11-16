import type { FlagGroup } from '#lib/backroom/types/flag-group.ts';
import type { FlagItem } from '#lib/backroom/types/flag-item.ts';
import type { FlagReason } from '#lib/backroom/types/flag-reason.ts';
import type { StoredFlag } from '#lib/backroom/types/stored-flag.ts';

function concerns(flag: StoredFlag, item: FlagItem): boolean {
	if (item.kind === 'artwork') return flag.artworkId === item.id;
	return item.kind === 'term' ? flag.termId === item.id : flag.symbolId === item.id;
}

function samePlace(flag: StoredFlag, item: FlagItem, pinId?: string): boolean {
	if (item.kind !== 'artwork') return true;
	if (flag.reason === 'image') return flag.imageId === (item.imageId ?? null);
	if (flag.reason !== 'pin') return true;
	if (pinId) return flag.pinId === pinId;
	return item.pin ? flag.imageId === item.pin.imageId : true;
}

export function flagOf(
	flags: readonly StoredFlag[],
	item: FlagItem,
	reason: FlagReason,
	pinId?: string
): StoredFlag | undefined {
	return flags.find(
		(flag) => flag.reason === reason && concerns(flag, item) && samePlace(flag, item, pinId)
	);
}

export function flagsOfGroups(
	flags: readonly StoredFlag[],
	groups: readonly FlagGroup[]
): StoredFlag[] {
	return flags.filter((flag) => groups.some((group) => concerns(flag, group.item)));
}
