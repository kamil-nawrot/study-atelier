import type { asset } from '$app/paths';
import type { ExhibitArt } from '#lib/career/types/exhibit-art.ts';
import type { Metal } from '#lib/career/types/metal.ts';
import { commonsFilePage } from '#lib/images/commons/commons.ts';

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
	bullseye: {
		credit: 'Reinier Vinkeles, „Putto ogląda strzałę w dziesiątce tarczy”',
		licence: 'CC0',
		commonsFile: 'Putto bekijkt een pijl in de roos van een schietschijf, RP-P-1905-5949.jpg'
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
	crystal_palace: {
		credit: 'Charles Burton, „Transept Pałacu Przemysłu od Bramy Księcia Walii”, 1851',
		licence: 'domena publiczna',
		page: 'https://www.rijksmuseum.nl/en/collection/RP-P-2018-839'
	},
	lenoir_chapel: {
		credit:
			'Jean-Baptiste Réville i Jacques Lavallée według Jean-Lubina Vauzelle’a, „Druga perspektywa sali wprowadzającej”, 1816',
		licence: 'CC0',
		commonsFile: "Seconde vue de la salle d'introduction. G.30766.jpg"
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
	},
	mouth_of_truth: {
		credit: 'Georg Pencz, „Usta prawdy”, 1533–1534',
		licence: 'CC0',
		commonsFile: 'Georg Pencz - The Mouth of Truth - 1922.150 - Cleveland Museum of Art.jpg'
	},
	prehistory: {
		credit: 'Émile Bayard, „Une famille à l’âge du renne”, 1870',
		licence: 'domena publiczna',
		commonsFile: 'Une famille à l’âge du renne.jpg'
	},
	antiquity: {
		credit:
			'Jules Férat, „La bibliothèque d’un Romain”, skan: Biblioteca de la Universidad de Sevilla',
		licence: 'CC BY 2.0',
		commonsFile:
			'Les merveilles de l\'industrie, 1873 "La bibliothèque d\'un Romain". (4727228008).jpg'
	},
	middle_ages: {
		credit: 'Rycerstwo w postaciach alegorycznych, według miedziorytu z 1573 roku, 1870',
		licence: 'domena publiczna',
		commonsFile:
			'Military and religious life in the Middle Ages and at the period of the Renaissance (1870) (14782676354).jpg'
	},
	early_modern: {
		credit: 'Leo Reiffenstein, „Gutenberg pokazuje Fustowi pierwsze arkusze”, 1881',
		licence: 'domena publiczna',
		commonsFile: 'Die Gartenlaube (1881) b 837.jpg'
	},
	modern: {
		credit: 'Alphonse de Neuville i Léon Benett, „Stado bizonów zagrodziło tory”',
		licence: 'domena publiczna',
		commonsFile: "'Around the World in Eighty Days' by Neuville and Benett 42.jpg"
	},
	contemporary: {
		credit: 'Henri de Montaut, „L’arrivée du projectile à Stone’s Hill”',
		licence: 'domena publiczna',
		commonsFile: 'Arrivee Projectile DTAL.jpg'
	},
	pinacotheca: {
		credit: '„Pinacoteca 1”, plansza z katalogu Levinusa Vincenta, 1719',
		licence: 'domena publiczna',
		commonsFile: 'Vincent, Levinus (1715) Wondertooneel der natuur -Tome 2- 0293.jpg'
	},
	vasari_lives: {
		credit:
			'Strona tytułowa „Żywotów najwybitniejszych malarzy, rzeźbiarzy i architektów” Giorgia Vasariego, Florencja 1568',
		licence: 'domena publiczna',
		commonsFile: 'Vite.jpg'
	},
	boncompagni_academy: {
		credit: 'Cornelis Cort, „Adepci sztuk plastycznych”, 1578',
		licence: 'CC0',
		page: 'https://www.metmuseum.org/art/collection/search/369581'
	},
	hortus_cliffortianus: {
		credit: 'Jan Wandelaar, frontyspis „Hortus Cliffortianus” Karola Linneusza, 1738',
		licence: 'domena publiczna',
		commonsFile: 'Linnaeus Hortus Cliffortianus frontispiece.jpg'
	},
	trevi_fountain: {
		credit: 'Giovanni Battista Piranesi, „Widok Fontanny di Trevi”, ok. 1751',
		licence: 'CC0',
		commonsFile:
			"Trevifontein te Rome Veduta della vasta Fontana di Trevi anticamente detta l'Acqua Vergine (titel op object) Gezichten op Rome (serietitel) Vedute di Roma disegnate ed incise da Giambattista Piranesi architetto Ve(nez, RP-P-1941-600.jpg"
	},
	seven_league_boots: {
		credit: 'Gustave Doré, ilustracja do „Tomcia Palucha” Charles’a Perraulta, 1862',
		licence: 'domena publiczna',
		commonsFile: 'Le Petit Poucet (136548020).jpg'
	},
	figure_alphabet: {
		credit:
			'Israhel van Meckenem według Mistrza E.S., litera A z „Alfabetu figuralnego”, ostatnia tercja XV wieku',
		licence: 'domena publiczna',
		page: 'https://id.smb.museum/object/1543315'
	},
	candle_moths: {
		credit: 'Vincent Laurensz. van der Vinne, „Muchy lecą do światła świecy”, 1714',
		licence: 'domena publiczna',
		page: 'https://www.rijksmuseum.nl/en/collection/RP-P-OB-62.370'
	},
	amateur_magnifier: {
		credit: 'Honoré Daumier, „Prawdziwy znawca”, 1847',
		licence: 'domena publiczna',
		page: 'https://www.rijksmuseum.nl/en/collection/RP-P-2015-26-183'
	}
};

export function artOf(code: string): ExhibitArt | undefined {
	return EXHIBIT_ART[code];
}

export function imageOf(code: string, metal: Metal): Parameters<typeof asset>[0] {
	return `exhibits/${code}/${metal}.webp` as Parameters<typeof asset>[0];
}

export function pageOf(art: ExhibitArt): string {
	return 'page' in art ? art.page : commonsFilePage(art.commonsFile);
}

export function credits(codes: readonly string[]): ExhibitArt[] {
	return codes.map(artOf).filter((art): art is ExhibitArt => art !== undefined);
}
