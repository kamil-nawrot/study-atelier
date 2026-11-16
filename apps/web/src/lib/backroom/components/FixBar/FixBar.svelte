<script lang="ts">
	import SkipForward from '@lucide/svelte/icons/skip-forward';
	import { Button } from '@study-atelier/ui';
	import { page } from '$app/state';
	import { FixRoute } from '#lib/backroom/fix-route/fix-route.svelte.ts';
	import { m } from '#lib/i18n/i18n.ts';

	const fix = new FixRoute(() => page.url.pathname);
</script>

{#if fix.progress}
	<div class="fix-bar">
		<span class="caption">{m.backroom.progress(fix.progress.position, fix.progress.total)}</span>
		<Button aria-label={m.backroom.skip} compact icon={SkipForward} onclick={() => void fix.skip()}>
			{m.backroom.skip}
		</Button>
	</div>
{/if}

<style>
	.fix-bar {
		display: flex;
		align-items: center;
		gap: var(--spacing-3);
		margin-inline-start: auto;
	}

	.caption {
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}
</style>
