let loads = $state(0);

export function fontLoads(): number {
	return loads;
}

export function countFontLoads(fonts: FontFaceSet | undefined): void {
	void fonts?.ready.then(() => {
		loads += 1;
	});
}

if (typeof document !== 'undefined') countFontLoads(document.fonts);
