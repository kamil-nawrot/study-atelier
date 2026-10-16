<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Church from '@lucide/svelte/icons/church';
	import Compass from '@lucide/svelte/icons/compass';
	import Flame from '@lucide/svelte/icons/flame';
	import Landmark from '@lucide/svelte/icons/landmark';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import TrainFront from '@lucide/svelte/icons/train-front';
	import { fn } from 'storybook/test';
	import ToggleTiles from './ToggleTiles.svelte';

	const eras = [
		{ value: 'prehistory', label: 'Prehistory', note: 'to 3000 BCE', icon: Flame, count: 2 },
		{ value: 'antiquity', label: 'Antiquity', note: 'to 476', icon: Landmark, count: 14 },
		{ value: 'middle-ages', label: 'Middle Ages', note: '476–1492', icon: Church, count: 9 },
		{ value: 'early-modern', label: 'Early modern', note: '1492–1789', icon: Compass, count: 31 },
		{ value: 'modern', label: 'Modern', note: '1789–1945', icon: TrainFront, count: 20 },
		{ value: 'contemporary', label: 'Contemporary', note: 'from 1945', icon: Smartphone, count: 0 }
	];

	const { Story } = defineMeta({
		title: 'Components/ToggleTiles',
		component: ToggleTiles,
		tags: ['autodocs'],
		args: { label: 'Era', options: eras, onchange: fn() },
		argTypes: { options: { control: false } }
	});
</script>

<Story name="Default" />

<Story name="Several chosen" args={{ values: ['antiquity', 'modern'] }} />

<Story
	name="Without counts"
	args={{ options: eras.map((tile) => ({ ...tile, count: undefined })) }}
/>

<Story name="Two columns" args={{ columns: 2 }} />
