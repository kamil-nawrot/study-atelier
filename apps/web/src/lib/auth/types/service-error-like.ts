export type ServiceErrorLike = {
	code?: string;
	message?: string;
	status?: number;
	hint?: string | null;
};
