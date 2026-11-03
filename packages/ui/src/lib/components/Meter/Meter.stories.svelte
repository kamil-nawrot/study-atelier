<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Meter from './Meter.svelte';

	const { Story } = defineMeta({
		title: 'Components/Meter',
		component: Meter,
		tags: ['autodocs'],
		args: { value: 8.7, max: 200, label: 'Twoje zdjęcia zajmują 8,7 MB z 200 MB.' }
	});
</script>

<Story name="Default" />

<Story name="Full" args={{ value: 200, label: 'Twoje zdjęcia zajmują 200 MB z 200 MB.' }} />

<Story name="Gold" args={{ value: 846, max: 1000, label: 'Znawca', tone: 'gold' }} />

<Story name="Dim track" args={{ value: 191, max: 250, label: 'Dzieła w atelier', track: 'dim' }} />
