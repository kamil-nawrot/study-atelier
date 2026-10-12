import '../styles/index.css';

export function controlHeight(): number {
	const value = getComputedStyle(document.documentElement).getPropertyValue('--size-control');
	return parseFloat(value);
}

export function outlinedHeight(element: Element, selector: string): number {
	const box = element.closest(selector);
	if (!box) throw new Error(`No ${selector} around the element`);
	return box.getBoundingClientRect().height;
}
