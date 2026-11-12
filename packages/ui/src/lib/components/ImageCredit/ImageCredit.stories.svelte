<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ImageCredit from './ImageCredit.svelte';

	const { Story } = defineMeta({
		title: 'Components/ImageCredit',
		component: ImageCredit,
		tags: ['autodocs']
	});
</script>

<Story name="On a stage">
	{#snippet template()}
		<div
			style="position: relative; height: 240px; background: var(--color-stage-bg); --color-stage-fg: var(--color-fg)"
		>
			<ImageCredit label="Image source" text="Wikimedia Commons, public domain" />
		</div>
	{/snippet}
</Story>

<Story name="On a passe-partout">
	{#snippet template()}
		<div
			style="position: relative; width: 240px; padding: var(--spacing-2); background: var(--color-mat-bg)"
		>
			<div style="aspect-ratio: 4 / 5; background: var(--color-mat-window)"></div>
			<ImageCredit label="Image source" text="Photo: Jane Doe, CC BY-SA 4.0" tone="mat" />
		</div>
	{/snippet}
</Story>
