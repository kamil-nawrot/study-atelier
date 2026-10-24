type PendingAnswer = {
	readonly pending: boolean;
	ask: (open: () => void) => Promise<boolean>;
	answer: (value: boolean) => void;
};

export function pendingAnswer(): PendingAnswer {
	let question: Promise<boolean> | null = null;
	let resolveQuestion: (value: boolean) => void = () => {};

	return {
		get pending(): boolean {
			return question !== null;
		},
		ask(open: () => void): Promise<boolean> {
			if (question) return question;
			open();
			question = new Promise<boolean>((resolve) => {
				resolveQuestion = resolve;
			});
			return question;
		},
		answer(value: boolean): void {
			const resolve = resolveQuestion;
			question = null;
			resolveQuestion = () => {};
			resolve(value);
		}
	};
}
