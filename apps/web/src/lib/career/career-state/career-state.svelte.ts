import { rankOf } from '#lib/career/ranks/ranks.ts';
import { loadStanding, markRankSeen } from '#lib/career/standing-data/standing-data.ts';
import { markTiersSeen } from '#lib/career/career-data/career-data.ts';
import { onWrite } from '#lib/shared/data/writes/writes.ts';
import type { Standing } from '#lib/career/types/standing.ts';

const STALE_AFTER_MS = 10 * 60 * 1000;

export class CareerState {
	standing = $state<Standing>();
	tierFlash = $state(0);
	rankFlash = $state(0);

	readonly rank = $derived(this.standing ? rankOf(this.standing.points).level : undefined);
	readonly hasNewTiers = $derived((this.standing?.newTiers ?? 0) > 0);
	readonly hasNewRank = $derived(
		this.standing !== undefined &&
			this.rank !== undefined &&
			this.rank > Math.max(this.standing.rankSeen, 1)
	);

	#owner: string | undefined;
	#requests = 0;
	#refreshedAt: number | undefined;
	#wrote = false;

	forLearner(owner: string | undefined): void {
		if (owner === this.#owner) return;
		this.#owner = owner;
		this.#requests += 1;
		this.#refreshedAt = undefined;
		this.standing = undefined;
		this.tierFlash = 0;
		this.rankFlash = 0;
	}

	noteWrite(): void {
		this.#wrote = true;
	}

	refreshIfStale(now: number = Date.now()): void {
		const fresh = this.#refreshedAt !== undefined && now - this.#refreshedAt < STALE_AFTER_MS;
		if (fresh && !this.#wrote) return;
		void this.refresh({ now });
	}

	async refresh({ counted = false, now = Date.now() } = {}): Promise<void> {
		const request = ++this.#requests;
		this.#refreshedAt = now;
		this.#wrote = false;
		const { standing } = await loadStanding(counted).catch(() => ({ standing: undefined }));
		if (!standing || request !== this.#requests) return;
		const before = this.standing;
		if (before && standing.newTiers > before.newTiers) this.tierFlash += 1;
		if (before && rankOf(standing.points).level > rankOf(before.points).level) this.rankFlash += 1;
		this.standing = standing;
	}

	async markSeen(): Promise<void> {
		if (!this.standing) await this.refresh({ counted: true });
		const standing = this.standing;
		if (!standing) return;
		const rank = rankOf(standing.points).level;
		this.#requests += 1;
		this.standing = { ...standing, newTiers: 0, rankSeen: Math.max(rank, standing.rankSeen) };
		await Promise.all([markTiersSeen(), rank > standing.rankSeen ? markRankSeen(rank) : undefined]);
	}
}

export const career = new CareerState();

onWrite(() => career.noteWrite());
