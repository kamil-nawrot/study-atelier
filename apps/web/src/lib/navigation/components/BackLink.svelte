<script lang="ts">
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import { Icon } from '@study-atelier/ui';
	import type { ResolvedPathname } from '$app/types';
	import { goBackThroughHistory } from '#lib/collection/history.ts';
	import { currentBackPlace } from '../back.svelte.ts';

	type Props = {
		fallbackName: string;
		fallbackHref: ResolvedPathname;
	};

	let { fallbackName, fallbackHref }: Props = $props();

	let place = $derived(currentBackPlace());
	let href = $derived<ResolvedPathname>(
		(place?.path as ResolvedPathname | undefined) ?? fallbackHref
	);
</script>

<a
	class="back"
	{href}
	onclick={(event) => goBackThroughHistory(event, place !== undefined, place?.steps)}
>
	<Icon icon={ArrowLeft} />
	<span class="name">{place?.name ?? fallbackName}</span>
</a>

<style>
	.back {
		display: flex;
		flex: 1;
		align-items: center;
		gap: var(--spacing-2);
		min-width: 0;
		color: var(--color-fg);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-medium);
		text-decoration: none;
	}

	.name {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}
</style>
