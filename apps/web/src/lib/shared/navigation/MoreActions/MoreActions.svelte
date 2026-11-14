<script lang="ts">
	import type { Snippet } from 'svelte';
	import { MediaQuery } from 'svelte/reactivity';
	import { m } from '#lib/i18n/i18n.ts';
	import ActionMenu from '#lib/shared/navigation/ActionMenu/ActionMenu.svelte';
	import type { MoreAction } from '#lib/shared/types/more-action.ts';

	type Props = {
		actions: readonly MoreAction[];
		children: Snippet;
		kept?: Snippet;
	};

	let { actions, children, kept }: Props = $props();

	const phone = new MediaQuery('max-width: 767.98px');
</script>

{#if phone.current}
	{@render kept?.()}
	<ActionMenu {actions} label={m.common.moreActions} />
{:else}
	{@render children()}
{/if}
