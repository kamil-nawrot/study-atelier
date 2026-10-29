<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import Switch from './Switch.svelte';

	const { Story } = defineMeta({
		title: 'Components/Switch',
		component: Switch,
		tags: ['autodocs'],
		args: { label: 'Period', checked: false, disabled: false }
	});
</script>

<Story name="Default" />

<Story name="On" args={{ checked: true }} />

<Story name="Disabled" args={{ disabled: true }} />

<Story name="Disabled and on" args={{ disabled: true, checked: true }} />
