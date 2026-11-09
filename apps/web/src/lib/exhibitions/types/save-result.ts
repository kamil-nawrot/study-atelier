export type SaveResult = {
	revision?: number;
	conflict?: boolean;
	rejected?: boolean;
	error?: string;
};
