<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Logo from './Logo.svelte';

	const { Story } = defineMeta({
		title: 'Components/Logo',
		component: Logo,
		tags: ['autodocs'],
		args: { label: 'Study Atelier', size: 'md' },
		argTypes: {
			size: { control: 'inline-radio', options: ['sm', 'md', 'lg'] }
		}
	});
</script>

<Story name="Default" />

<Story name="Small" args={{ size: 'sm' }} />

<Story name="Large" args={{ size: 'lg' }} />
