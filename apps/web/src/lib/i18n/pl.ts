const appName = 'Study Atelier';

export const pl = {
	app: {
		name: appName,
		pageTitle: (title: string): string => `${title} · ${appName}`
	},
	ui: {
		alert: {
			danger: 'Błąd',
			warning: 'Uwaga',
			success: 'Gotowe'
		},
		showPassword: 'Pokaż',
		hidePassword: 'Ukryj',
		removeTag: 'Usuń tag',
		unknownAuthor: 'Autor nieznany',
		noImage: 'Brak obrazu',
		clearSearch: 'Wyczyść wyszukiwanie',
		closeDialog: 'Zamknij',
		valueField: {
			existing: 'Już używane',
			starting: 'Lista startowa',
			similar: (name: string): string => `Masz już „${name}”`,
			useSimilar: 'Użyj tej wartości',
			add: (name: string): string => `+ Dodaj „${name}”`,
			addAnyway: (name: string): string => `+ Dodaj „${name}” mimo to`,
			remove: (name: string): string => `Usuń ${name}`
		}
	},
	common: {
		email: 'E-mail',
		password: 'Hasło',
		backToSignIn: 'Wróć do logowania',
		unexpectedError: 'Coś poszło nie tak. Spróbuj jeszcze raz za chwilę.'
	},
	validation: {
		emailRequired: 'Wpisz adres e-mail.',
		emailInvalid: 'To nie wygląda na pełny adres e-mail. Przykład: anna@przyklad.pl.',
		passwordRequired: 'Wpisz hasło.',
		passwordTooShort: (min: number, length: number): string =>
			`Hasło ma ${length} ${plural(length, { one: 'znak', few: 'znaki', many: 'znaków' })}. Potrzeba co najmniej ${min}.`,
		passwordHint: (min: number): string => `Co najmniej ${min} znaków.`
	},
	authErrors: {
		invalidCredentials:
			'E-mail albo hasło się nie zgadzają. Sprawdź oba pola albo ustaw nowe hasło.',
		emailNotConfirmed:
			'Ten adres nie jest jeszcze potwierdzony. Kliknij link z wiadomości, którą wysłaliśmy po rejestracji.',
		weakPassword: 'To hasło łatwo odgadnąć. Wybierz dłuższe, najlepiej z cyframi i znakami.',
		samePassword: 'Nowe hasło musi być inne niż obecne.',
		rateLimited: 'Sporo prób w krótkim czasie. Odczekaj chwilę i spróbuj jeszcze raz.',
		emailRateLimited:
			'Kilka wiadomości jest już w drodze. Daj im chwilę, zanim poprosisz o kolejną.',
		network: 'Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj jeszcze raz.'
	},
	artwork: {
		credit: 'Wikimedia Commons, domena publiczna',
		photoCredit: (photographer: string, license: string): string =>
			`Wikimedia Commons, zdjęcie: ${photographer}, ${license}`,
		unknownArtist: 'autor nieznany',
		yearBce: (year: number): string => `${year} p.n.e.`
	},
	signIn: {
		title: 'Zaloguj się',
		lead: 'Witaj ponownie. Twoje atelier czeka.',
		forgotPassword: 'Nie pamiętasz hasła?',
		submit: 'Zaloguj się',
		submitting: 'Logowanie…',
		errorTitle: 'Nie udało się zalogować',
		noAccount: 'Nie masz jeszcze konta?',
		toSignUp: 'Załóż konto'
	},
	signUp: {
		title: 'Załóż konto',
		lead: 'Załóż konto i zbieraj dzieła, które poznajesz, we własnym atelier.',
		submit: 'Załóż konto',
		submitting: 'Zakładanie konta…',
		errorTitle: 'Nie udało się założyć konta',
		haveAccount: 'Masz już konto?',
		toSignIn: 'Zaloguj się'
	},
	checkEmail: {
		title: 'Sprawdź skrzynkę',
		lead: 'Jeszcze tylko potwierdzenie adresu i możemy zaczynać.',
		sentTitle: 'Wysłaliśmy link',
		sent: (email: string): string => `Na adres ${email}. Kliknij go, żeby potwierdzić konto.`,
		sentNoEmail: 'Kliknij link z wiadomości, żeby potwierdzić konto.',
		notReceived: 'Nic nie dotarło? Zajrzyj do spamu albo poproś o nowy link.',
		resend: 'Wyślij link ponownie',
		resending: 'Wysyłanie…',
		resent: 'Wysłaliśmy nowy link.'
	},
	forgotPassword: {
		title: 'Nie pamiętasz hasła?',
		lead: 'Zdarza się. Podaj e-mail konta, a wyślemy link do ustawienia nowego hasła.',
		submit: 'Wyślij link',
		submitting: 'Wysyłanie…',
		sentTitle: 'Sprawdź skrzynkę',
		sent: (email: string): string =>
			`Jeśli konto ${email} istnieje, wysłaliśmy na nie link do ustawienia nowego hasła.`,
		errorTitle: 'Nie udało się wysłać linku'
	},
	updatePassword: {
		title: 'Ustaw nowe hasło',
		lead: 'Wybierz nowe hasło do swojego konta.',
		newPassword: 'Nowe hasło',
		submit: 'Zapisz hasło',
		submitting: 'Zapisywanie…',
		errorTitle: 'Nie udało się zapisać hasła',
		expiredTitle: 'Link wygasł',
		expired: 'Ten link już nie działa: wygasł albo został użyty. Poproś o nowy.',
		requestNew: 'Wyślij nowy link'
	},
	landing: {
		title: 'Atelier do nauki historii sztuki',
		lead: 'Twoja własna kolekcja dzieł, budowana w trakcie nauki.',
		description: [
			'Każde dzieło opisujesz sam: tytuł, autora, datę, styl i swoje notatki. Samo wpisywanie jest częścią nauki.',
			'Z czasem powstaje z tego Twoja baza wiedzy, do której łatwo wrócić i którą łatwo przeszukać.'
		],
		signIn: 'Zaloguj się',
		signUp: 'Załóż konto'
	},
	menu: {
		label: 'Menu',
		open: 'Otwórz menu',
		close: 'Zamknij menu',
		expand: 'Rozwiń menu',
		collapse: 'Zwiń menu',
		atelier: 'Atelier',
		trash: 'Kosz',
		signOut: 'Wyloguj się'
	},
	atelier: {
		title: 'Atelier',
		count: (count: number): string =>
			`${count} ${plural(count, { one: 'dzieło', few: 'dzieła', many: 'dzieł' })}`,
		filteredCount: (shown: number, total: number): string =>
			`${shown} z ${total} ${plural(total, { one: 'dzieła', few: 'dzieł', many: 'dzieł' })}`,
		search: 'Szukaj po tytule',
		add: 'Dodaj dzieło',
		emptyTitle: 'Twoje atelier jest jeszcze puste',
		empty:
			'Dodaj pierwsze dzieło, które poznajesz w książce albo na wykładzie. Na początek wystarczą tytuł i autor.',
		addFirst: 'Dodaj pierwsze dzieło',
		noResultsTitle: 'Nie ma tu dzieła o takim tytule',
		noResults: (query: string): string =>
			`Nic nie pasuje do „${query}”. Sprawdź pisownię albo wpisz krótszy fragment tytułu.`,
		clearSearch: 'Wyczyść wyszukiwanie',
		loadErrorTitle: 'Nie udało się wczytać atelier',
		year: (year: number, approximate: boolean): string =>
			`${approximate ? 'ok. ' : ''}${year < 0 ? `${-year} p.n.e.` : year}`
	},
	artworkForm: {
		newTitle: 'Nowe dzieło',
		back: 'Wróć do atelier',
		image: 'Zdjęcie',
		findImage: 'Znajdź zdjęcie',
		ownImage: 'Dodaj własne',
		findImageHint: 'Wpisz tytuł i autora, żeby znaleźć zdjęcie.',
		title: 'Tytuł',
		authors: 'Autorzy',
		authorUnknown: 'Autor nieznany',
		year: 'Rok powstania',
		beforeCommonEra: 'p.n.e.',
		yearApproximate: 'ok.',
		type: 'Typ',
		typeNone: 'Nie wybrano',
		period: 'Epoka',
		style: 'Styl',
		material: 'Materiał',
		location: 'Miejsce',
		locationHint: 'Gdzie dzieło jest teraz. Jedna wartość.',
		notes: 'Notatki',
		notesPlaceholder: 'Co warto zapamiętać, skąd znasz to dzieło',
		cancel: 'Anuluj',
		saveAndNext: 'Zapisz i dodaj kolejne',
		save: 'Zapisz',
		saving: 'Zapisywanie…',
		errorTitle: 'Nie udało się zapisać dzieła',
		saved: (number: string): string => `Zapisano dzieło ${number}.`,
		discardTitle: 'Odrzucić zmiany?',
		discardDescription: 'Masz niezapisane zmiany w tym dziele. Jeśli wyjdziesz, znikną.',
		keepEditing: 'Wróć do formularza',
		discard: 'Odrzuć'
	},
	artworkTypes: {
		architecture: 'Architektura',
		painting: 'Malarstwo',
		sculpture: 'Rzeźba',
		drawing: 'Rysunek',
		printmaking: 'Grafika',
		applied_arts: 'Rzemiosło artystyczne',
		photography: 'Fotografia',
		other: 'Inne'
	},
	collectionErrors: {
		network: 'Nie udało się połączyć z serwerem. Sprawdź internet i odśwież stronę.'
	},
	artworkErrors: {
		titleRequired: 'Wpisz tytuł dzieła.',
		authorRequired: 'Dodaj autora albo zaznacz „Autor nieznany”.',
		yearRequired: 'Wpisz rok, żeby zaznaczyć „p.n.e.” albo „ok.”.',
		yearInvalid: 'Rok to liczba całkowita od 1 w górę. Dla lat przed naszą erą zaznacz „p.n.e.”.',
		invalid: 'Niektóre pola się nie zgadzają. Sprawdź je i zapisz jeszcze raz.',
		notFound: 'Nie ma takiego dzieła w Twoim atelier. Mogło trafić do kosza.',
		network: 'Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj jeszcze raz.'
	},
	startingValues: {
		period: [
			'prehistoria',
			'starożytność',
			'średniowiecze',
			'renesans',
			'barok',
			'oświecenie',
			'XIX wiek',
			'modernizm',
			'sztuka współczesna'
		],
		style: [
			'sztuka egipska',
			'sztuka grecka',
			'sztuka rzymska',
			'sztuka bizantyjska',
			'romanizm',
			'gotyk',
			'renesans',
			'manieryzm',
			'barok',
			'rokoko',
			'klasycyzm',
			'romantyzm',
			'realizm',
			'impresjonizm',
			'postimpresjonizm',
			'secesja',
			'ekspresjonizm',
			'kubizm',
			'futuryzm',
			'dadaizm',
			'surrealizm',
			'abstrakcjonizm',
			'pop-art',
			'minimalizm'
		],
		material: [
			'olej na płótnie',
			'olej na desce',
			'tempera',
			'fresk',
			'akwarela',
			'pastel',
			'tusz',
			'węgiel',
			'marmur',
			'kamień',
			'brąz',
			'drewno',
			'terakota',
			'złoto',
			'szkło',
			'ceramika',
			'mozaika',
			'cegła',
			'żelbet'
		]
	},
	comingSoon: {
		lead: 'Ten widok jest jeszcze w przygotowaniu.',
		backToAtelier: 'Wróć do atelier',
		artwork: (number: string): string => `Dzieło ${number}`,
		trash: 'Kosz'
	}
};

type PluralForms = Record<'one' | 'few' | 'many', string>;

const pluralRules = new Intl.PluralRules('pl');

function plural(count: number, forms: PluralForms): string {
	const category = pluralRules.select(count);
	return category === 'one' || category === 'few' ? forms[category] : forms.many;
}
