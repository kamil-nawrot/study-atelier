import { deleteFlag } from '#lib/backroom/backroom-data/backroom-data.ts';
import { flagCount } from '#lib/backroom/flag-count/flag-count.svelte.ts';
import { fieldOf, reasonText } from '#lib/backroom/flag-fields/flag-fields.ts';
import { restoreFlag } from '#lib/backroom/flags-data/flags-data.ts';
import { ItemFlags } from '#lib/backroom/item-flags/item-flags.svelte.ts';
import type { FixField } from '#lib/backroom/types/fix-field.ts';
import type { FlagKind } from '#lib/backroom/types/flag-kind.ts';
import type { FlagTarget } from '#lib/backroom/types/flag-target.ts';
import type { StoredFlag } from '#lib/backroom/types/stored-flag.ts';
import { m } from '#lib/i18n/i18n.ts';

export type FormNote = { id: string; text: string; fixed: boolean };

export class FormFlags {
	#kind: FlagKind;
	#target: FlagTarget | undefined;
	#items = new ItemFlags();
	#fixed = $state<StoredFlag[]>([]);
	busy = $state<string>();
	failed = $state<{ id: string; text: string }>();

	constructor(kind: FlagKind, target: () => FlagTarget | undefined) {
		this.#kind = kind;
		$effect(() => {
			const current = target();
			this.#target = current;
			this.#fixed = [];
			if (current) void this.#items.load(current);
			else this.#items.list = [];
		});
	}

	notes(field: FixField): FormNote[] {
		const fixed = this.#fixed.map((flag) => flag.id);
		return [...this.#items.list, ...this.#fixed.filter((flag) => !this.#has(flag.id))]
			.filter((flag) => fieldOf(this.#kind, flag.reason) === field)
			.map((flag) => ({
				id: flag.id,
				text: m.backroom.note(reasonText(flag.reason, flag.imageNumber), flag.comment ?? undefined),
				fixed: fixed.includes(flag.id)
			}));
	}

	async markFixed(id: string): Promise<void> {
		const flag = this.#items.list.find((item) => item.id === id);
		if (!flag || this.busy) return;
		this.busy = id;
		const { error } = await deleteFlag(id);
		this.busy = undefined;
		this.failed = error ? { id, text: error } : undefined;
		if (error) return;
		this.#fixed = [...this.#fixed, flag];
		this.#items.list = this.#items.list.filter((item) => item.id !== id);
		void flagCount.refresh();
	}

	async undo(id: string): Promise<void> {
		const flag = this.#fixed.find((item) => item.id === id);
		if (!flag || this.busy) return;
		this.busy = id;
		const { error } = await restoreFlag(flag);
		this.failed = error ? { id, text: error } : undefined;
		if (!error) {
			await this.#items.load(this.#target);
			this.#fixed = this.#fixed.filter((item) => item.id !== id);
			void flagCount.refresh();
		}
		this.busy = undefined;
	}

	#has(id: string): boolean {
		return this.#items.list.some((flag) => flag.id === id);
	}
}
