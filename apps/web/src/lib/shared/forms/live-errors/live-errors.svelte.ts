type Errors = Record<string, unknown>;

type Added<E> = { errors: Partial<E>; watch: () => unknown; value: unknown };

function hasErrors(errors: Errors): boolean {
	return Object.values(errors).some((value) =>
		value !== null && typeof value === 'object' ? hasErrors(value as Errors) : Boolean(value)
	);
}

export class LiveErrors<E extends Errors> {
	readonly #validate: () => E;
	#shown = $state(false);
	#added = $state.raw<Added<E>[]>([]);

	readonly current: Partial<E> = $derived.by(() => {
		if (!this.#shown) return {};
		const added = this.#added
			.filter((entry) => Object.is(entry.watch(), entry.value))
			.reduce<Partial<E>>((all, entry) => ({ ...all, ...entry.errors }), {});
		const checked = Object.fromEntries(
			Object.entries(this.#validate()).filter(([, value]) => value !== undefined)
		) as Partial<E>;
		return { ...added, ...checked };
	});

	constructor(validate: () => E) {
		this.#validate = validate;
	}

	check(): boolean {
		this.#shown = true;
		this.#added = [];
		return !hasErrors(this.#validate());
	}

	add(errors: Partial<E>, watch: () => unknown): void {
		this.#shown = true;
		this.#added = [...this.#added, { errors, watch, value: watch() }];
	}
}
