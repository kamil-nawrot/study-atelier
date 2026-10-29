import { rankOf } from '#lib/career/ranks/ranks.ts';
import { loadStanding, markRankSeen } from '#lib/career/standing-data/standing-data.ts';
import { markTiersSeen } from '#lib/career/career-data/career-data.ts';
import type { Standing } from '#lib/career/types/standing.ts';

export class CareerState {
	standing = $state<Standing>();
	tierFlash = $state(0);
	rankFlash = $state(0);

	readonly rank = $derived(this.standing ? rankOf(this.standing.points).level : undefined);
	readonly hasNewTiers = $derived((this.standing?.newTiers ?? 0) > 0);
	readonly hasNewRank = $derived(
		this.standing !== undefined && this.rank !== undefined && this.rank > this.standing.rankSeen
	);

	async refresh(): Promise<void> {
		const { standing } = await loadStanding().catch(() => ({ standing: undefined }));
		if (!standing) return;
		const before = this.standing;
		if (before && standing.newTiers > before.newTiers) this.tierFlash += 1;
		if (before && rankOf(standing.points).level > rankOf(before.points).level) this.rankFlash += 1;
		this.standing = standing;
	}

	async markSeen(): Promise<void> {
		if (!this.standing) await this.refresh();
		const standing = this.standing;
		if (!standing) return;
		const rank = rankOf(standing.points).level;
		this.standing = { ...standing, newTiers: 0, rankSeen: Math.max(rank, standing.rankSeen) };
		await Promise.all([markTiersSeen(), rank > standing.rankSeen ? markRankSeen(rank) : undefined]);
	}
}

export const career = new CareerState();
