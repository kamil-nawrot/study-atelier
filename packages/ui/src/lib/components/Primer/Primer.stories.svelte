<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Frame from '../Frame/Frame.svelte';
	import Primer from './Primer.svelte';

	const { Story } = defineMeta({
		title: 'Components/Primer',
		component: Primer,
		tags: ['autodocs']
	});
</script>

<Story name="On a passe-partout">
	{#snippet template()}
		<div
			style="width: 240px; padding: var(--spacing-2); background: var(--color-mat-bg); color: var(--color-mat-fg-muted)"
		>
			<div style="position: relative; aspect-ratio: 4 / 5; background: var(--color-mat-window)">
				<Primer />
			</div>
		</div>
	{/snippet}
</Story>

<Story name="In a frame">
	{#snippet template()}
		<div style="width: 240px; color: var(--color-fg-muted)">
			<Frame>
				<div style="position: relative; aspect-ratio: 4 / 5">
					<Primer />
				</div>
			</Frame>
		</div>
	{/snippet}
</Story>
