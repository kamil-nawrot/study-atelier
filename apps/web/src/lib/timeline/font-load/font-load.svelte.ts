let loads = $state(0);

export function fontLoads(): number {
	return loads;
}

function countLoad(): void {
	loads += 1;
}

export function countFontLoads(fonts: FontFaceSet | undefined): void {
	void fonts?.ready.then(countLoad);
	fonts?.addEventListener('loadingdone', countLoad);
}

if (typeof document !== 'undefined') countFontLoads(document.fonts);
