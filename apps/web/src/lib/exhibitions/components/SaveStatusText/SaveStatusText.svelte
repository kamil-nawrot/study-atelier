<script lang="ts">
	import { m } from '#lib/i18n/i18n.ts';
	import type { SaveStatus } from '#lib/exhibitions/types/save-status.ts';

	type Props = {
		status: SaveStatus;
	};

	let { status }: Props = $props();

	let text = $derived(
		status === 'saving'
			? m.exhibitions.save.saving
			: status === 'saved'
				? m.exhibitions.save.saved
				: status === 'conflict'
					? m.exhibitions.save.conflictTitle
					: status === 'untitled'
						? m.exhibitions.save.untitled
						: m.exhibitions.save.failed
	);
</script>

<span
	class="status"
	class:failed={status === 'failed' || status === 'conflict' || status === 'untitled'}
	role="status"
>
	{text}
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
