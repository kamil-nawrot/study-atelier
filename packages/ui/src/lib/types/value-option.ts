export type ValueOption = {
	kind: 'similar' | 'existing' | 'starter' | 'new';
	name: string;
	note?: string;
};
