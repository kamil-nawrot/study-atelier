<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Landmark from '@lucide/svelte/icons/landmark';
	import ArtworkTile, { type ArtworkTileImage } from './ArtworkTile.svelte';

	function placeholder(width: number, height: number, stops: string[]): ArtworkTileImage {
		const gradient = stops
			.map((color, index) => `<stop offset="${index / (stops.length - 1)}" stop-color="${color}"/>`)
			.join('');
		const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><defs><linearGradient id="g" x2="0" y2="1">${gradient}</linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
		return { src: `data:image/svg+xml,${encodeURIComponent(svg)}`, width, height };
	}

	const portrait = placeholder(300, 400, ['#2a2622', '#3b332b', '#1d1a17']);
	const landscape = placeholder(400, 250, ['#cdd3d6', '#9fb0b9', '#e3e0d6', '#8b939a']);
	const tall = placeholder(300, 500, ['#7a5a2a', '#a07a3a', '#5a4020']);
	const panorama = placeholder(450, 200, ['#5a4a3a', '#8a6a4a', '#3a2a1a']);

	const { Story } = defineMeta({
		title: 'Components/ArtworkTile',
		component: ArtworkTile,
		tags: ['autodocs'],
		args: {
			href: '#',
			number: 42,
			title: 'Lady with an Ermine',
			authors: ['Leonardo da Vinci'],
			date: 'c. 1490',
			image: portrait
		},
		argTypes: {
			image: { control: false },
			mark: { control: false }
		},
		parameters: { layout: 'padded' }
	});
</script>

<Story name="Portrait">
	{#snippet template(args)}
		<div style="max-width: 280px">
			<ArtworkTile {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Landscape"
	args={{
		number: 107,
		title: 'Wanderer above the Sea of Fog',
		authors: ['Caspar David Friedrich'],
		date: 'c. 1818',
		image: landscape
	}}
>
	{#snippet template(args)}
		<div style="max-width: 280px">
			<ArtworkTile {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="No image"
	args={{
		number: 13,
		title: 'Veit Stoss Altarpiece',
		authors: ['Veit Stoss'],
		date: '1477–1489',
		image: undefined
	}}
>
	{#snippet template(args)}
		<div style="max-width: 280px">
			<ArtworkTile {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Unknown author"
	args={{ number: 14, title: 'Venus de Milo', authors: [], date: 'c. 150 BCE', image: tall }}
>
	{#snippet template(args)}
		<div style="max-width: 280px">
			<ArtworkTile {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Several authors"
	args={{
		number: 12,
		title: 'Hagia Sophia',
		authors: ['Isidore of Miletus', 'Anthemius of Tralles'],
		date: '532–537',
		image: landscape
	}}
>
	{#snippet template(args)}
		<div style="max-width: 280px">
			<ArtworkTile {...args} />
		</div>
	{/snippet}
</Story>

<Story name="With mark" args={{ mark: Landmark, markLabel: 'Antiquity' }}>
	{#snippet template(args)}
		<div style="max-width: 280px">
			<ArtworkTile {...args} />
		</div>
	{/snippet}
</Story>

<Story
	name="Favourite"
	args={{ favourite: true, favouriteLabel: 'Remove from favourites', onfavourite: () => {} }}
>
	{#snippet template(args)}
		<div style="max-width: 280px">
			<ArtworkTile {...args} />
		</div>
	{/snippet}
</Story>

<Story name="Wall">
	{#snippet template()}
		<div style="display: flex; gap: var(--spacing-6); align-items: flex-start">
			<div style="display: grid; flex: 1; gap: var(--spacing-6)">
				<ArtworkTile
					authors={[]}
					date="c. 150 BCE"
					href="#"
					image={tall}
					number={14}
					title="Venus de Milo"
				/>
				<ArtworkTile
					authors={['Jan Matejko']}
					date="1878"
					href="#"
					image={panorama}
					number={10}
					title="Battle of Grunwald"
				/>
			</div>
			<div style="display: grid; flex: 1; gap: var(--spacing-6)">
				<ArtworkTile
					authors={['Veit Stoss']}
					date="1477–1489"
					href="#"
					number={13}
					title="Veit Stoss Altarpiece"
				/>
				<ArtworkTile
					authors={['Caspar David Friedrich']}
					date="c. 1818"
					href="#"
					image={landscape}
					number={3}
					title="Wanderer above the Sea of Fog"
				/>
			</div>
			<div style="display: grid; flex: 1; gap: var(--spacing-6)">
				<ArtworkTile
					authors={['Isidore of Miletus', 'Anthemius of Tralles']}
					date="532–537"
					href="#"
					image={landscape}
					number={12}
					title="Hagia Sophia"
				/>
				<ArtworkTile
					authors={['Leonardo da Vinci']}
					date="c. 1490"
					href="#"
					image={portrait}
					number={1}
					title="Lady with an Ermine"
				/>
			</div>
		</div>
	{/snippet}
</Story>

<Story name="Image unavailable" args={{ image: undefined, imageUnavailable: true }}>
	{#snippet template(args)}
		<div style="max-width: 280px">
			<ArtworkTile {...args} />
		</div>
	{/snippet}
</Story>
