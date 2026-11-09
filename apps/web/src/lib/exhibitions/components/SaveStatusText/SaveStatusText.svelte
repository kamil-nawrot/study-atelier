<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import type { SaveStatus } from '#lib/exhibitions/types/save-status.ts';

	type Props = {
		status: SaveStatus;
	};

	let { status }: Props = $props();

	const TEXTS: Record<SaveStatus, string> = {
		saving: m.exhibitions.save.saving,
		saved: m.exhibitions.save.saved,
		failed: m.exhibitions.save.failed,
		conflict: m.exhibitions.save.conflictTitle,
		rejected: m.exhibitions.save.limitTitle,
		untitled: m.exhibitions.save.untitled
	};
</script>

<span class="status" class:failed={status !== 'saving' && status !== 'saved'} role="status">
	{TEXTS[status]}
</span>

<style>
	.status {
		align-self: center;
		color: var(--color-fg-muted);
		font-size: var(--font-size-sm);
		white-space: nowrap;
	}

	.failed {
		color: var(--color-danger);
	}
</style>
