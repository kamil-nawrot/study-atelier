<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import FillingLines from './FillingLines.svelte';

	const { Story } = defineMeta({
		title: 'Components/FillingLines',
		component: FillingLines,
		tags: ['autodocs']
	});
</script>

<Story name="In a text area">
	{#snippet template()}
		<div
			style="position: relative; width: 360px; height: 160px; border: var(--border-width-base) solid var(--color-line); background: var(--color-surface); color: var(--color-fg)"
		>
			<FillingLines lines={4} />
		</div>
	{/snippet}
</Story>
