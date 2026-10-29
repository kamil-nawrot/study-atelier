import type { ExhibitArt } from '#lib/career/types/exhibit-art.ts';

export const EXHIBIT_ART: Readonly<Record<string, ExhibitArt>> = {
	collection: {
		file: 'exhibits/collection.jpg',
		credit: 'Frontyspis „Musei Wormiani Historia”, 1655',
		licence: 'domena publiczna',
		commonsFile: '1655 - Frontispiece of Museum Wormiani Historia.jpg'
	},
	regular: {
		file: 'exhibits/regular.jpg',
		credit: 'Albrecht Dürer, „Melencolia I”, 1514',
		licence: 'CC0',
		commonsFile: 'Albrecht Dürer, Melencolia I, 1514, NGA 6640.jpg'
	},
	back_from_storage: {
		file: 'exhibits/back_from_storage.jpg',
		credit: 'Luigi Calamatta według Leonarda da Vinci, „Mona Lisa”, 1858',
		licence: 'domena publiczna',
		commonsFile: 'Joconde de Calamatta.jpg'
	},
	chronicle: {
		file: 'exhibits/chronicle.jpg',
		credit: 'Karl Baedeker, „Greece. Handbook for Travellers”, 1894',
		licence: 'domena publiczna',
		commonsFile: 'Title page - Baedeker Karl - 1894.jpg'
	},
	grand_tour: {
		file: 'exhibits/grand_tour.jpg',
		credit: 'Jean-Baptiste Nolin według Vincenza Coronellego, „Le Globe terrestre”',
		licence: 'domena publiczna',
		commonsFile:
			'Le Globe Terrestre represente en deux plans-hemispheres. Par P. Coronelli Cosmographe, etc. Corrigé et augmenté par le Sr. (IA dr le-globe-terrestre-represente-en-deux-plans-hemispheres-par-p-coronelli-c-14353004).jpg'
	},
	timeline: {
		file: 'exhibits/timeline.jpg',
		credit: 'Praski orloj, rycina z 1837 roku',
		licence: 'domena publiczna',
		commonsFile: 'Orloj 1837.jpg'
	},
	glossary: {
		file: 'exhibits/glossary.jpg',
		credit:
			'Benoît-Louis Prévost według Charles’a-Nicolasa Cochina, frontyspis „Encyklopedii”, 1772',
		licence: 'domena publiczna',
		commonsFile: 'Encyclopedie frontispice full.jpg'
	},
	own_eye: {
		file: 'exhibits/own_eye.jpg',
		credit: 'Camera obscura, plansza z „Encyklopedii” Diderota i d’Alemberta, 1763',
		licence: 'domena publiczna',
		commonsFile: 'Camera obscura.png'
	},
	night_watch: {
		file: 'exhibits/night_watch.jpg',
		credit: '„Straż nocna” według Rembrandta, rycina z 1847 roku',
		licence: 'CC0',
		commonsFile: 'Nachtwacht, RP-P-OB-54.954.jpg'
	}
};

export function artOf(code: string): ExhibitArt | undefined {
	return EXHIBIT_ART[code];
}

export function credits(codes: readonly string[]): ExhibitArt[] {
	return codes.map(artOf).filter((art): art is ExhibitArt => art !== undefined);
}
