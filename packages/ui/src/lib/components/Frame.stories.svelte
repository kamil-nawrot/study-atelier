<script module lang="ts">
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import { html } from '../../stories/snippets';
	import Frame from './Frame.svelte';

	const artwork = html(
		'<div role="img" aria-label="Placeholder artwork" style="aspect-ratio: 4 / 3; background: linear-gradient(#cdd3d6, #9fb0b9 40%, #e3e0d6 58%, #8b939a 64%)"></div>'
	);

	const { Story } = defineMeta({
		title: 'Components/Frame',
		component: Frame,
		tags: ['autodocs'],
		args: { children: artwork },
		argTypes: {
			size: { control: 'inline-radio', options: ['list', 'view'] },
			children: { control: false }
		}
	});
</script>

<Story name="List" args={{ size: 'list' }} />

<Story name="View" args={{ size: 'view' }} />

<Story name="Collection">
	{#snippet template()}
		<div style="display: grid; grid-template-columns: repeat(3, 200px); gap: var(--spacing-6)">
			<Frame>{@render artwork()}</Frame>
			<Frame>{@render artwork()}</Frame>
			<Frame>{@render artwork()}</Frame>
		</div>
	{/snippet}
</Story>
