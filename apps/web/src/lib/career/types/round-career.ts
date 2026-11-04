export type RoundCareer = {
	plan?: { share: number; streak: number };
	tiers: { exhibit: string; tier: number; tiers: number | null }[];
	points: number;
	rankSeen: number;
};
