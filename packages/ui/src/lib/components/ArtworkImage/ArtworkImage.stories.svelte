<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import type { ComponentProps } from 'svelte';
	import ArtworkImage from './ArtworkImage.svelte';
	import Frame from './Frame.svelte';

	const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400"><defs><linearGradient id="g" x2="0" y2="1"><stop offset="0" stop-color="#2a2622"/><stop offset="0.5" stop-color="#3b332b"/><stop offset="1" stop-color="#1d1a17"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;

	const { Story } = defineMeta({
		title: 'Components/ArtworkImage',
		component: ArtworkImage,
		tags: ['autodocs'],
		args: {
			src: `data:image/svg+xml,${encodeURIComponent(svg)}`,
			alt: 'Lady with an Ermine, Leonardo da Vinci',
			width: 300,
			height: 400
		},
		argTypes: {
			surface: { control: 'inline-radio', options: ['mat', 'frame', 'stage'] },
			loading: { control: 'inline-radio', options: ['lazy', 'eager'] }
		}
	});
</script>

{#snippet mat(args: ComponentProps<typeof ArtworkImage>)}
	<div style="width: 240px; padding: var(--spacing-2); background: var(--color-mat-bg)">
		<ArtworkImage {...args} />
	</div>
{/snippet}

<Story name="Loaded">
	{#snippet template(args)}
		{@render mat(args)}
	{/snippet}
</Story>

<Story name="Failed" args={{ src: 'data:image/png;base64,broken' }}>
	{#snippet template(args)}
		{@render mat(args)}
	{/snippet}
</Story>

<Story
	name="Failed without a size"
	args={{ src: 'data:image/png;base64,broken', width: undefined, height: undefined }}
>
	{#snippet template(args)}
		{@render mat(args)}
	{/snippet}
</Story>

<Story name="Failed in a frame" args={{ src: 'data:image/png;base64,broken', surface: 'frame' }}>
	{#snippet template(args)}
		<div style="width: 240px">
			<Frame>
				<ArtworkImage {...args} />
			</Frame>
		</div>
	{/snippet}
</Story>
