<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { fn } from 'storybook/test';
	import { text } from '../../stories/snippets';
	import ToggleTag from './ToggleTag.svelte';

	const { Story } = defineMeta({
		title: 'Components/ToggleTag',
		component: ToggleTag,
		tags: ['autodocs'],
		args: { children: text('baroque'), onclick: fn() },
		argTypes: { children: { control: false } }
	});
</script>

<Story name="Default" />

<Story name="With count" args={{ count: 12 }} />

<Story name="Pressed" args={{ pressed: true, count: 12 }} />

<Story name="No artworks" args={{ count: 0, disabled: true }} />

<Story name="List">
	{#snippet template()}
		<div style="display: flex; flex-wrap: wrap; gap: var(--spacing-2)">
			<ToggleTag count={7} pressed>baroque</ToggleTag>
			<ToggleTag count={4}>portrait</ToggleTag>
			<ToggleTag count={2}>ultramarine</ToggleTag>
			<ToggleTag count={1}>netherlands</ToggleTag>
		</div>
	{/snippet}
</Story>
