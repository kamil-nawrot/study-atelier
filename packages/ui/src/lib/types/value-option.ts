export type ValueOption = {
	kind: 'found' | 'similar' | 'existing' | 'starter' | 'new';
	id?: string;
	name: string;
	note?: string;
};
