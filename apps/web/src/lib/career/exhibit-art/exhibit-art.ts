import type { asset } from '$app/paths';
import type { ExhibitArt } from '#lib/career/types/exhibit-art.ts';
import type { Metal } from '#lib/career/types/metal.ts';

export const EXHIBIT_ART: Readonly<Record<string, ExhibitArt>> = {
	chronicle: {
		credit: 'Pietro Antonio Martini, „Exposition au Salon du Louvre en 1787”',
		licence: 'CC0',
		commonsFile: 'Exposition au Salon du Louvre en 1787 Met DP-15578-001.jpg'
	},
	collection: {
		credit: 'Frontyspis „Musei Wormiani Historia”, 1655',
		licence: 'domena publiczna',
		commonsFile: '1655 - Frontispiece of Museum Wormiani Historia.jpg'
	},
	eras: {
		credit: 'Giovanni Battista Piranesi, „Veduta interna del Tempio della Tosse”',
		licence: 'CC0',
		commonsFile:
			'Interieur van de Tempio della Tosse bij Tivoli Veduta interna del Tempio della Tosse (titel op object) Gezichten op Rome (serietitel) Vedute di Roma disegnate ed incise da Giambattista Piranesi architetto Ve(nez)iano , RP-P-OB-39.365.jpg'
	},
	memory: {
		credit: 'Albrecht Dürer, „Święty Hieronim w pracowni”, 1514',
		licence: 'CC0',
		commonsFile: 'Albrecht Dürer, Saint Jerome in His Study, 1514, NGA 6642.jpg'
	},
	regular: {
		credit: 'Albrecht Dürer, „Melencolia I”, 1514',
		licence: 'CC0',
		commonsFile: 'Albrecht Dürer, Melencolia I, 1514, NGA 6640.jpg'
	},
	back_from_storage: {
		credit: 'Luigi Calamatta według Leonarda da Vinci, „Mona Lisa”, 1857',
		licence: 'domena publiczna',
		commonsFile: 'Joconde de Calamatta.jpg'
	},
	grand_tour: {
		credit: '„Sphaerarum artificialium typica repraesentatio”, tło uzupełnione',
		licence: 'CC0',
		commonsFile:
			'Hemelglobe, armillarium en aardglobe Sphaerarum artificialium typica repraesentatio (titel op object), RP-P-AO-29-19-1.jpg'
	},
	seen_live: {
		credit: '„Mathieu Laensbergh patrzy przez teleskop”, plansza z „L’Artiste”',
		licence: 'CC0',
		commonsFile:
			'Mathieu Laensbergh kijkt door een telescoop naar de sterrenhemel, RP-P-1944-162.jpg'
	},
	timeline: {
		credit: 'Praski orloj, rycina z 1837 roku',
		licence: 'domena publiczna',
		commonsFile: 'Orloj 1837.jpg'
	},
	glossary: {
		credit: 'Biblioteka uniwersytetu w Lejdzie w 1610 roku',
		licence: 'CC0',
		commonsFile: 'De Bibliotheek in 1610, Objectnr PV PV14002.15.jpg'
	},
	own_eye: {
		credit: 'Camera obscura, plansza z „Encyklopedii” Diderota i d’Alemberta, tło uzupełnione',
		licence: 'domena publiczna',
		commonsFile: 'Camera obscura.png'
	},
	night_watch: {
		credit: 'William Unger według Rembrandta, „Straż nocna”, XIX wiek',
		licence: 'CC0',
		commonsFile: 'Nachtwacht, RP-P-OB-54.954.jpg'
	},
	marathon: {
		credit: 'Albrecht Dürer, „Nemezis”, ok. 1501–1502, tło uzupełnione',
		licence: 'CC0',
		commonsFile: 'Albrecht Dürer, Nemesis (The Great Fortune), c. 1501-1502, NGA 6603.jpg'
	}
};

export function artOf(code: string): ExhibitArt | undefined {
	return EXHIBIT_ART[code];
}

export function imageOf(code: string, metal: Metal): Parameters<typeof asset>[0] {
	return `exhibits/${code}/${metal}.webp` as Parameters<typeof asset>[0];
}

export function credits(codes: readonly string[]): ExhibitArt[] {
	return codes.map(artOf).filter((art): art is ExhibitArt => art !== undefined);
}
