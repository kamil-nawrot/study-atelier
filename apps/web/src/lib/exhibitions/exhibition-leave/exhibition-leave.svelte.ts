import { beforeNavigate } from '$app/navigation';
import { UnsavedChanges } from '#lib/shared/forms/unsaved-changes/unsaved-changes.svelte.ts';
import type { ExhibitionSession } from '#lib/exhibitions/exhibition-session/exhibition-session.svelte.ts';

export class ExhibitionLeave {
	changes: UnsavedChanges<boolean>;
	#switching = false;

	constructor(session: () => ExhibitionSession | undefined) {
		this.changes = new UnsavedChanges(
			() => !this.#switching && session()?.unsaved === true,
			() => false,
			(current, saved) => current !== saved
		);
		beforeNavigate((navigation) => {
			const current = session();
			if (current?.dirty) void current.flush();
			if (current?.dirty && navigation.willUnload) navigation.cancel();
		});
	}

	async switchMode(go: () => Promise<void>): Promise<void> {
		this.#switching = true;
		try {
			await go();
		} finally {
			this.#switching = false;
		}
	}
}
