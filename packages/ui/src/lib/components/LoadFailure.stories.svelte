<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import LoadFailure from './LoadFailure.svelte';

	const { Story } = defineMeta({
		title: 'Components/LoadFailure',
		component: LoadFailure,
		tags: ['autodocs'],
		args: {
			notFound: true,
			message: 'Nie ma dzieła o tym numerze.',
			backHref: '#',
			backLabel: 'Atelier'
		}
	});
</script>

<Story name="Not found" />

<Story name="Not found with heading" args={{ heading: 'Nie znaleziono dzieła #0042' }} />

<Story
	name="Failed to load"
	args={{
		notFound: false,
		message: 'Sprawdź połączenie z internetem i spróbuj ponownie.',
		errorTitle: 'Nie udało się wczytać hasła'
	}}
/>
