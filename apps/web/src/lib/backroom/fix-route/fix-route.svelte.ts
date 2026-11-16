import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { ResolvedPathname } from '$app/types';
import { fixSession } from '#lib/backroom/fix-session/fix-session.svelte.ts';
import type { FixEntry } from '#lib/backroom/types/fix-entry.ts';
import type { FixStep } from '#lib/backroom/types/fix-step.ts';
import { m } from '#lib/i18n/i18n.ts';

export const BACKROOM_PATH = resolve('/(app)/atelier/backroom');

async function goOn(step: FixStep): Promise<void> {
	if ('path' in step) {
		await goto(step.path as ResolvedPathname, { refreshAll: true });
		return;
	}
	await goto(BACKROOM_PATH, {
		refreshAll: true,
		state: step.queue ? { backroomMessage: m.backroom.done(step.fixed) } : {}
	});
}

export class FixRoute {
	#path: () => string;

	constructor(path: () => string) {
		this.#path = path;
	}

	get entry(): FixEntry | undefined {
		return fixSession.entryFor(this.#path());
	}

	get progress(): { position: number; total: number } | undefined {
		return fixSession.progressFor(this.#path());
	}

	get labels(): { save: string; cancel: string } | undefined {
		return this.progress ? { save: m.backroom.saveNext, cancel: m.backroom.finish } : undefined;
	}

	async afterSave(): Promise<boolean> {
		const step = await fixSession.saved(this.#path());
		if (!step) return false;
		await goOn(step);
		return true;
	}

	async skip(): Promise<void> {
		const step = fixSession.skip(this.#path());
		if (step) await goOn(step);
	}
}
