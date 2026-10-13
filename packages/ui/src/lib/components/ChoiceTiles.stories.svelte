<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Church from '@lucide/svelte/icons/church';
	import Compass from '@lucide/svelte/icons/compass';
	import Flame from '@lucide/svelte/icons/flame';
	import Landmark from '@lucide/svelte/icons/landmark';
	import Smartphone from '@lucide/svelte/icons/smartphone';
	import TrainFront from '@lucide/svelte/icons/train-front';
	import ChoiceTiles, { type ChoiceTile } from './ChoiceTiles.svelte';

	const eras: ChoiceTile[] = [
		{ value: 'prehistory', label: 'Prehistory', note: 'to 3000 BCE', icon: Flame },
		{ value: 'antiquity', label: 'Antiquity', note: 'to 476', icon: Landmark },
		{ value: 'middle-ages', label: 'Middle Ages', note: '476–1492', icon: Church },
		{ value: 'early-modern', label: 'Early modern', note: '1492–1789', icon: Compass },
		{ value: 'modern', label: 'Modern', note: '1789–1945', icon: TrainFront },
		{ value: 'contemporary', label: 'Contemporary', note: 'from 1945', icon: Smartphone }
	];

	const { Story } = defineMeta({
		title: 'Components/ChoiceTiles',
		component: ChoiceTiles,
		tags: ['autodocs'],
		args: { label: 'Era', options: eras },
		argTypes: { options: { control: false } }
	});
</script>

<Story name="Default" />

<Story name="Selected" args={{ value: 'early-modern' }} />

<Story name="Clearable" args={{ value: 'antiquity', clearable: true }} />

<Story
	name="Without icons"
	args={{ options: eras.map((tile) => ({ ...tile, icon: undefined })) }}
/>

<Story name="Disabled" args={{ value: 'modern', disabled: true }} />
