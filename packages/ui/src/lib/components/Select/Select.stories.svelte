<script lang="ts" module>
	import { defineMeta } from '@storybook/addon-svelte-csf';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import Select, { type SelectOption } from './Select.svelte';

	const types: SelectOption[] = [
		{ value: 'architecture', label: 'Architecture' },
		{ value: 'painting', label: 'Painting' },
		{ value: 'sculpture', label: 'Sculpture' },
		{ value: 'drawing', label: 'Drawing' },
		{ value: 'print', label: 'Print' },
		{ value: 'decorative-art', label: 'Decorative art' },
		{ value: 'photography', label: 'Photography' },
		{ value: 'other', label: 'Other' }
	];

	const { Story } = defineMeta({
		title: 'Components/Select',
		component: Select,
		tags: ['autodocs'],
		args: { label: 'Type', options: types, placeholder: 'Not chosen' },
		argTypes: { options: { control: false } }
	});
</script>

<Story name="Default" />

<Story name="With value" args={{ value: 'painting' }} />

<Story name="With hint" args={{ hint: 'What kind of artwork it is.' }} />

<Story name="With error" args={{ error: 'Choose a type.' }} />

<Story name="Disabled" args={{ value: 'sculpture', disabled: true }} />

<Story
	name="Compact"
	args={{
		label: 'Order',
		icon: ArrowUpDown,
		compact: true,
		placeholder: undefined,
		value: 'painting'
	}}
/>
