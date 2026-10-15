<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import SearchSelect from './SearchSelect.svelte';

	const countries = [
		{ value: 'AT', label: 'Austria' },
		{ value: 'BE', label: 'Belgium' },
		{ value: 'FR', label: 'France' },
		{ value: 'DE', label: 'Germany' },
		{ value: 'IT', label: 'Italy' },
		{ value: 'NL', label: 'Netherlands' },
		{ value: 'PL', label: 'Poland' },
		{ value: 'ES', label: 'Spain' },
		{ value: 'GB', label: 'United Kingdom' }
	];

	const { Story } = defineMeta({
		title: 'Components/SearchSelect',
		component: SearchSelect,
		tags: ['autodocs'],
		args: { label: 'Country', options: countries, placeholder: 'Choose a country' }
	});
</script>

<Story name="Empty" />

<Story name="Chosen" args={{ value: 'FR' }} />

<Story name="With hint" args={{ hint: 'Pick the country from the list.' }} />

<Story name="With error" args={{ error: 'Pick a country from the list.' }} />

<Story name="Disabled" args={{ value: 'IT', disabled: true }} />
