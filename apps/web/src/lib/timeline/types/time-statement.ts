export type TimeStatement = {
	rank?: 'preferred' | 'normal' | 'deprecated';
	mainsnak?: { datavalue?: { value?: { time?: string; precision?: number } } };
};
