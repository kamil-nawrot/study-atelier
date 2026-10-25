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
		imageFailed: 'Nie udało się wczytać obrazu',
		loading: 'Wczytywanie',
		clearSearch: 'Wyczyść wyszukiwanie',
		closeDialog: 'Zamknij',
		notesEditor: {
			toolbar: 'Formatowanie',
			bold: 'Pogrubienie',
			italic: 'Kursywa',
			heading: 'Nagłówek',
			bulletedList: 'Lista punktowana',
			numberedList: 'Lista numerowana',
			linkValue: 'Dodaj odnośnik do autora, epoki, miejsca…',
			linkArtwork: 'Dodaj odnośnik do dzieła',
			linkSuggestions: 'Podpowiedzi odnośników',
			noValueFound: 'Nie masz jeszcze takiej wartości w Kartotece.',
			noArtworkFound: 'Nie masz w kolekcji dzieła o takim numerze ani tytule.'
		},
		valueField: {
			existing: 'Już używane',
			starter: 'Z listy startowej',
			similar: (name: string): string => `Masz już „${name}”`,
			useSimilar: 'Użyj tej wartości',
			add: (name: string): string => `+ Dodaj „${name}”`,
			addAnyway: (name: string): string => `+ Dodaj „${name}” mimo to`,
			remove: (name: string): string => `Usuń ${name}`
		},
		searchSelect: {
			empty: 'Nic nie pasuje',
			clear: (label: string): string => `Wyczyść: ${label}`
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
		sessionEnded: 'Twoja sesja wygasła. Zaloguj się jeszcze raz.',
		invalidCredentials:
			'E-mail albo hasło się nie zgadzają. Sprawdź oba pola albo ustaw nowe hasło.',
		emailNotConfirmed:
			'Ten adres nie jest jeszcze potwierdzony. Kliknij link z wiadomości, którą wysłaliśmy po rejestracji.',
		weakPassword: 'To hasło łatwo odgadnąć. Wybierz dłuższe, najlepiej z cyframi i znakami.',
		samePassword: 'Nowe hasło musi być inne niż obecne.',
		emailTaken: 'Ten adres jest już przypisany do innego konta.',
		rateLimited: 'Sporo prób w krótkim czasie. Odczekaj chwilę i spróbuj jeszcze raz.',
		emailRateLimited:
			'Kilka wiadomości jest już w drodze. Daj im chwilę, zanim poprosisz o kolejną.',
		network: 'Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj jeszcze raz.'
	},
	artwork: {
		credit: 'Wikimedia Commons, domena publiczna',
		photoCredit: (photographer: string, license: string): string =>
			`Wikimedia Commons, zdjęcie: ${photographer}, ${license}`,
		licenceCredit: (license: string): string => `Wikimedia Commons, ${license}`,
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
		accountExists: 'Konto z tym adresem już istnieje. Zaloguj się albo ustaw nowe hasło.',
		forgotPassword: 'Ustaw nowe hasło',
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
		cardIndex: 'Kartoteka',
		glossary: 'Słowniczek',
		timeline: 'Kalendarium',
		chronicle: 'Kronika',
		review: 'Powtórki',
		reviewWaiting: (count: number): string => `${workCount(count)} na dziś`,
		trash: 'Kosz',
		settings: 'Ustawienia',
		settingsLink: (name: string, email: string): string =>
			name === email ? `Ustawienia, ${email}` : `Ustawienia, ${name}, ${email}`,
		feedback: 'Zgłoś uwagę',
		lightTheme: 'Jasny motyw',
		darkTheme: 'Ciemny motyw',
		signOut: 'Wyloguj się'
	},
	settings: {
		title: 'Ustawienia',
		lead: 'Tutaj możesz zmienić swoje dane, oraz zarządzać preferencjami dotyczącymi funkcjonowania Twojego atelier.',
		tabsLabel: 'Części ustawień',
		tabs: {
			profile: 'Profil',
			account: 'Konto',
			review: 'Powtórki',
			view: 'Widok dzieła',
			sources: 'Źródła',
			data: 'Dane'
		},
		loadErrorTitle: 'Nie udało się wczytać ustawień',
		profile: {
			avatarAlt: 'Twoje zdjęcie',
			addPhoto: 'Dodaj zdjęcie',
			changePhoto: 'Zmień zdjęcie',
			photoHint: 'Zdjęcie zostanie automatycznie dopasowane do rozmiaru awatara',
			removePhoto: 'Usuń zdjęcie',
			name: 'Imię',
			email: 'Adres e-mail',
			emailHint: 'Adres podany przy rejestracji. Zmienisz go w zakładce „Konto”.',
			nameTooLong: (max: number): string => `Imię może mieć najwyżej ${max} znaków.`,
			cancel: 'Anuluj',
			save: 'Zapisz profil',
			saving: 'Zapisuję…',
			saved: 'Zapisano profil.',
			errorTitle: 'Nie udało się zapisać profilu',
			failed: 'Nie udało się zapisać profilu. Spróbuj jeszcze raz.',
			network: 'Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj jeszcze raz.',
			discardDescription: 'Masz niezapisane zmiany w profilu. Jeśli wyjdziesz, znikną.'
		},
		account: {
			emailTitle: 'Adres e-mail',
			currentEmail: (email: string): string => `Obecny adres: ${email}`,
			newEmail: 'Nowy adres e-mail',
			emailSubmit: 'Zmień adres',
			emailSubmitting: 'Wysyłam…',
			sameEmail: 'To jest Twój obecny adres.',
			emailSentTitle: 'Link wysłany',
			emailSent: 'Wysłałem link na stary i na nowy adres. Kliknij oba, a zmiana wejdzie w życie.',
			emailPending: (email: string): string =>
				`Czeka na potwierdzenie zmiany na ${email}. Kliknij linki, które wysłałem na stary i na nowy adres.`,
			emailChanged: 'Adres e-mail jest zmieniony.',
			emailErrorTitle: 'Nie udało się zmienić adresu',
			passwordTitle: 'Zmiana hasła',
			currentPassword: 'Obecne hasło',
			newPassword: 'Nowe hasło',
			signOutOthers: 'Wyloguj mnie na innych urządzeniach',
			submit: 'Zmień hasło',
			submitting: 'Zmieniam…',
			wrongCurrent: 'To nie jest Twoje obecne hasło.',
			sameAsCurrent: 'Nowe hasło musi być inne niż obecne.',
			changed: 'Hasło jest zmienione.',
			errorTitle: 'Nie udało się zmienić hasła',
			othersFailedTitle: 'Hasło jest zmienione',
			othersFailed:
				'Nie udało się wylogować Cię na innych urządzeniach. Wyloguj się tam ręcznie albo zmień hasło jeszcze raz.'
		},
		preferences: {
			sessionSize: 'Ile dzieł w jednej sesji?',
			newPerDay: 'Ile nowych dzieł dziennie?',
			form: 'Od jakiej formy zaczynać?',
			formHint: 'Zmienisz ją też na starcie powtórki.',
			kinds: 'O co mogę pytać?',
			kindLabels: {
				quiz_image: 'Gdzie jest „tytuł”? (wybór obrazu)',
				quiz_title: 'Jaki to tytuł?',
				quiz_style: 'W jakim stylu powstało to dzieło?',
				quiz_pin: 'Co to jest? (pinezki ze Słowniczka)'
			},
			kindsHint: 'Zostaw zaznaczone co najmniej jedno.',
			free: 'Proponuj powtórkę swobodną po skończonym dniu',
			showPins: 'Pokazuj pinezki od razu po otwarciu dzieła',
			loupe: 'Włączaj lupę od razu po otwarciu dzieła',
			sourcesHint:
				'Po wyłączeniu nic nie jest pobierane samo. Zawsze możesz poprosić o to przyciskiem w formularzu.',
			fetchImage: 'Szukaj zdjęcia nowego dzieła w Wikidata i Commons',
			fetchDefinition: 'Uzupełniaj definicję hasła ze Słowniczka z Wikipedii',
			fetchForms: 'Podpowiadaj odmiany hasła z Wikisłownika',
			fetchEvent: 'Uzupełniaj opis i daty wydarzenia z Wikipedii',
			cancel: 'Anuluj',
			save: 'Zapisz ustawienia',
			saving: 'Zapisuję…',
			saved: 'Zapisano ustawienia.',
			errorTitle: 'Nie udało się zapisać ustawień',
			discardDescription: 'Masz niezapisane zmiany w ustawieniach. Jeśli wyjdziesz, znikną.'
		},
		data: {
			exportTitle: 'Eksport',
			exportDescription:
				'Pobierz całe atelier w jednym pliku ZIP: dzieła z notatkami, własne zdjęcia, pinezki, Słowniczek, Kalendarium, kosz i historię powtórek.',
			exportHint:
				'Zdjęcia z Wikimedia Commons i z linków zostają odnośnikami. Duże atelier lepiej wyeksportować na komputerze.',
			exportButton: 'Pobierz atelier',
			reading: 'Zbieram dzieła…',
			images: (done: number, total: number): string => `Zdjęcia: ${done} z ${total}`,
			packing: 'Pakuję plik…',
			exported: 'Plik z atelier jest pobrany.',
			importTitle: 'Import',
			importDescription:
				'Wczytaj plik z eksportu do pustego atelier. Numery dzieł, daty i powtórki zostaną takie same jak w kopii.',
			importHint:
				'Import niczego nie łączy ani nie nadpisuje, dlatego działa tylko w pustym atelier.',
			importButton: 'Wybierz plik ZIP',
			importFilled: 'W tym atelier już coś jest, więc nie mogę wczytać kopii.',
			importReading: 'Czytam plik…',
			importSaving: 'Zapisuję atelier…',
			imported: 'Atelier jest wczytane.',
			importErrorTitle: 'Nie udało się wczytać pliku',
			importNotZip: 'To nie jest plik ZIP.',
			importNoData: 'W tym pliku nie ma atelier.json, więc to nie wygląda na eksport z Atelier.',
			importNotAtelier: 'Ten plik nie pochodzi z eksportu Atelier.',
			importNewer:
				'Ten plik jest z nowszej wersji Atelier. Odśwież aplikację i spróbuj jeszcze raz.',
			importBroken: 'Nie mogę odczytać tego pliku. Jest uszkodzony albo niepełny.',
			importFailed:
				'Nie udało się wczytać atelier. Nic nie zostało zmienione, spróbuj jeszcze raz.',
			importNotEmpty: 'Atelier nie jest już puste, więc nic nie wczytałem.',
			errorTitle: 'Nie udało się wyeksportować atelier',
			failed: 'Spróbuj jeszcze raz. Jeśli to się powtarza, spróbuj na komputerze.',
			imageFailed:
				'Nie udało się pobrać jednego z Twoich zdjęć, a bez niego kopia byłaby niepełna. Spróbuj jeszcze raz.'
		}
	},
	atelier: {
		title: 'Atelier',
		count: (count: number): string =>
			`${count} ${plural(count, { one: 'dzieło', few: 'dzieła', many: 'dzieł' })}`,
		filteredCount: (shown: number, total: number): string =>
			`${shown} z ${total} ${plural(total, { one: 'dzieła', few: 'dzieł', many: 'dzieł' })}`,
		search: 'Szukaj po tytule lub autorze',
		sort: {
			label: 'Kolejność',
			recent: 'Ostatnio dodane',
			year: 'Według daty powstania',
			author: 'Według autorów'
		},
		grouping: {
			label: 'Grupuj',
			button: (levels: string): string => `Grupowanie: ${levels}`,
			off: 'wyłączone',
			hint: 'Kliknij jeszcze raz najniższy poziom, żeby go wyłączyć.',
			steps: {
				era: 'Epoka',
				period: 'Okres',
				style: 'Styl'
			},
			noEra: 'Bez epoki',
			noPeriod: 'Bez okresu',
			noStyle: 'Bez stylu',
			collapseAll: 'Zwiń wszystkie',
			expandAll: 'Rozwiń wszystkie'
		},
		periods: {
			label: 'Epoki'
		},
		authors: {
			label: 'Autorzy'
		},
		add: 'Dodaj dzieło',
		emptyTitle: 'Twoje atelier jest jeszcze puste',
		empty:
			'Dodaj pierwsze dzieło, które poznajesz w książce albo na wykładzie. Na początek wystarczą tytuł i autor.',
		addFirst: 'Dodaj pierwsze dzieło',
		noResultsTitle: 'Nie ma tu takiego dzieła',
		noResults: (query: string): string =>
			`Nic nie pasuje do „${query}”. Sprawdź pisownię albo wpisz krótszy fragment tytułu lub nazwiska.`,
		clearSearch: 'Wyczyść wyszukiwanie',
		loadErrorTitle: 'Nie udało się wczytać atelier',
		imagesUnavailableTitle: 'Nie wszystkie obrazy się wczytały',
		imagesUnavailable: 'Część zdjęć nie jest teraz dostępna. Spróbuj jeszcze raz za chwilę.',
		retryImages: 'Spróbuj ponownie',
		year: (year: number, approximate: boolean): string =>
			`${approximate ? 'ok. ' : ''}${year < 0 ? `${-year} p.n.e.` : year}`,
		yearRange: (from: string, to: string): string => `${from} – ${to}`,
		span: (from: number, to: number, approximate: boolean): string => {
			const prefix = approximate ? 'ok. ' : '';
			if (from < 0 && to < 0) return `${prefix}${-from}–${-to} p.n.e.`;
			if (from > 0 && to > 0) return `${prefix}${from}–${to}`;
			const year = (value: number): string => (value < 0 ? `${-value} p.n.e.` : `${value} n.e.`);
			return `${prefix}${year(from)} – ${year(to)}`;
		},
		filters: {
			title: 'Filtry',
			button: 'Filtry',
			buttonWithCount: (count: number): string => `Filtry (${count})`,
			viewButton: 'Widok',
			viewTitle: 'Widok',
			closePanel: 'Zamknij filtry',
			activeLabel: 'Włączone filtry',
			clear: 'Wyczyść filtry',
			removeTag: (label: string): string => `Usuń filtr: ${label}`,
			noResultsTitle: 'Nic tu nie pasuje',
			noResults: 'Żadne dzieło nie pasuje do tych filtrów.',
			noFavourites: 'Nie ma jeszcze ulubionych dzieł.',
			showResults: (count: number): string =>
				`Pokaż ${count} ${plural(count, { one: 'dzieło', few: 'dzieła', many: 'dzieł' })}`,
			fields: {
				eras: 'Epoka',
				types: 'Typ',
				years: 'Rok powstania',
				authors: 'Autorzy',
				periods: 'Okres',
				styles: 'Styl',
				materials: 'Materiał',
				locations: 'Miejsce',
				missing: 'Do uzupełnienia',
				favourites: 'Ulubione',
				ticked: 'Zaznaczone'
			},
			ownField: 'Własne pole',
			tagFields: {
				eras: 'Epoka',
				types: 'Typ',
				years: 'Rok',
				authors: 'Autor',
				periods: 'Okres',
				styles: 'Styl',
				materials: 'Materiał',
				locations: 'Miejsce',
				missing: 'Do uzupełnienia',
				favourites: 'Ulubione'
			},
			tag: (field: string, value: string): string => `${field} ${value}`,
			unknownAuthor: 'Autor nieznany',
			missing: {
				image: 'bez obrazu',
				year: 'bez roku',
				era: 'bez epoki',
				period: 'bez okresu',
				type: 'bez typu'
			},
			yearFrom: 'Od',
			yearTo: 'Do',
			beforeCommonEra: 'p.n.e.',
			yearsBetween: (from: number, to: number): string =>
				`${from < 0 ? `${-from} p.n.e.` : from}–${to < 0 ? `${-to} p.n.e.` : to}`,
			yearsFrom: (from: number): string => `od ${from < 0 ? `${-from} p.n.e.` : from}`,
			yearsTo: (to: number): string => `do ${to < 0 ? `${-to} p.n.e.` : to}`,
			searchValues: (field: string): string => `Szukaj: ${field.toLocaleLowerCase('pl')}`,
			showMore: 'Pokaż więcej',
			showLess: 'Pokaż mniej',
			valueCount: (name: string, count: number): string => `${name}, ${count}`
		}
	},
	artworkForm: {
		newTitle: 'Nowe dzieło',
		editTitle: (number: string): string => `Edytuj dzieło ${number}`,
		back: 'Wróć do atelier',
		notFoundTitle: (number: string): string => `Nie ma dzieła ${number}`,
		loadErrorTitle: 'Nie udało się wczytać dzieła',
		image: 'Obraz',
		addImage: 'Dodaj kolejny obraz',
		mainImage: 'Główne',
		setMainImage: 'Ustaw jako główne',
		imageSlot: (number: number, count: number): string => `Obraz ${number} z ${count}`,
		findImage: 'Znajdź obraz',
		ownImage: 'Dodaj własne',
		changeOwnImage: 'Zmień własne',
		ownImageTitle: 'Dodaj własny obraz',
		changeOwnImageTitle: 'Zmień własny obraz',
		removeImage: 'Usuń obraz',
		chooseFile: 'Wybierz plik z dysku',
		fileHint: (formats: string, maxMegabytes: number): string =>
			`${formats}. Większe niż ${maxMegabytes} MB zmniejszę.`,
		pasteFromClipboard: 'Wklej ze schowka',
		pasteHintLead: 'Masz obraz w schowku? Po prostu naciśnij',
		pasteHintForm: 'Obraz ze schowka możesz też wkleić tutaj:',
		replaceImageTitle: 'Zastąpić obecny obraz?',
		replaceImageDescription: 'Wklejony obraz zajmie jego miejsce.',
		replaceImage: 'Zastąp',
		keepImage: 'Zostaw obecne',
		removeImageTitle: 'Usunąć obraz?',
		removeImageConfirm: 'Usuń',
		removeImageCancel: 'Anuluj',
		imageUrl: 'Jeśli wolisz, podaj po prostu adres obrazka',
		imageUrlPlaceholder: 'https://…',
		useImageUrl: 'Użyj',
		usingImageUrl: 'Wczytywanie…',
		ownImageCredit: 'Twój obraz, widoczny tylko dla Ciebie.',
		ownImageUrlCredit: (host: string): string =>
			`Twój obraz z adresu ${host}, widoczny tylko dla Ciebie.`,
		findImageHint: 'Wpisz tytuł i autora, żeby znaleźć obraz.',
		chooseOtherImage: 'Wybierz inny',
		matchSearching: 'Szukam obrazu w Wikidata…',
		matchFound: (details: string): string => `Z Wikidata: ${details}`,
		matchNone: 'Nie znalazłem tego dzieła w Wikidata. Poszukaj sam albo dodaj własny obraz.',
		title: 'Tytuł',
		authors: 'Autorzy',
		authorUnknown: 'Autor nieznany',
		year: 'Rok powstania',
		spanTitle: 'Lata powstania',
		spanSwitch: 'Od – do',
		spanFrom: 'Od',
		spanTo: 'Do',
		beforeCommonEraFrom: 'p.n.e. (od)',
		beforeCommonEraTo: 'p.n.e. (do)',
		beforeCommonEra: 'p.n.e.',
		yearApproximate: 'ok.',
		type: 'Typ',
		era: 'Epoka',
		period: 'Okres',
		periodLocked: 'Najpierw wybierz epokę.',
		style: 'Styl',
		styleLocked: 'Najpierw wybierz okres.',
		material: 'Materiał',
		location: 'Miejsce',
		locationHint: 'Gdzie dzieło jest teraz?',
		notes: 'Notatki',
		notesPlaceholder: 'Co warto zapamiętać, skąd znasz to dzieło',
		notesLinkHint:
			'Wpisz @, żeby dodać odnośnik do autora, epoki albo miejsca, albo #, żeby dodać odnośnik do dzieła.',
		cancel: 'Anuluj',
		saveAndNext: 'Zapisz i dodaj kolejne',
		save: 'Zapisz',
		saving: 'Zapisywanie…',
		errorTitle: 'Nie udało się zapisać dzieła',
		saved: (number: string): string => `Zapisano dzieło ${number}.`,
		changesSaved: (number: string): string => `Zapisano zmiany w ${number}.`,
		discardTitle: 'Odrzucić zmiany?',
		discardDescription: 'Masz niezapisane zmiany w tym dziele. Jeśli wyjdziesz, znikną.',
		keepEditing: 'Wróć do formularza',
		discard: 'Odrzuć'
	},
	duplicateDialog: {
		title: 'Masz już takie dzieło',
		description: (numbers: string, count: number, advice: string): string =>
			`W atelier ${count === 1 ? 'jest' : 'są'} już ${numbers} o tym samym tytule i autorach. ${advice}`,
		save: {
			advice: 'Jeśli to inne dzieło, po prostu je zapisz.',
			back: 'Wróć do formularza',
			confirm: 'Zapisz mimo to'
		},
		restore: {
			advice: 'Jeśli to inne dzieło, po prostu je przywróć.',
			back: 'Zostaw w koszu',
			confirm: 'Przywróć mimo to'
		}
	},
	artworkView: {
		previousImage: 'Poprzedni obraz',
		nextImage: 'Następny obraz',
		back: 'Atelier',
		edit: 'Edytuj',
		delete: 'Usuń',
		addImage: 'Dodaj obraz',
		information: 'Informacje',
		showInformation: 'Pokaż informacje',
		hideInformation: 'Zamknij informacje',
		openImage: 'Powiększ obraz',
		closeImage: 'Zamknij powiększenie',
		empty: 'Nie wpisano',
		previous: 'Poprzednie dzieło',
		next: 'Następne dzieło'
	},
	loupe: {
		label: 'Lupa',
		unavailable: 'Rozdzielczość tego obrazu jest zbyt mała, żeby można było skorzystać z lupy.',
		tooLarge: 'Ten obraz z adresu jest zbyt duży, żeby można było skorzystać z lupy.',
		level: (level: number): string => `${level.toLocaleString('pl', { maximumFractionDigits: 1 })}×`
	},
	favourite: {
		add: 'Dodaj do ulubionych',
		remove: 'Usuń z ulubionych',
		added: 'Dodano do ulubionych.',
		removed: 'Usunięto z ulubionych.',
		failed: 'Nie udało się zapisać zmiany. Spróbuj jeszcze raz.'
	},
	review: {
		title: 'Powtórki',
		loadErrorTitle: 'Nie udało się wczytać powtórek',
		startErrorTitle: 'Nie udało się zacząć powtórki',
		waiting: (count: number): string => `Na dziś do powtórki zaplanowane masz ${workCount(count)}`,
		plan: (known: number, fresh: number): string =>
			[
				known > 0
					? `${known} ${plural(known, { one: 'powracające', few: 'powracające', many: 'powracających' })}`
					: '',
				fresh > 0 ? `${fresh} ${plural(fresh, { one: 'nowe', few: 'nowe', many: 'nowych' })}` : ''
			]
				.filter(Boolean)
				.join(' i '),
		streak: (days: number): string =>
			`Seria: ${days} ${plural(days, { one: 'dzień', few: 'dni', many: 'dni' })} z powtórkami z rzędu`,
		allDoneTitle: 'Nic nowego do powtórki',
		allDone: (when: string): string => `Kolejne dzieła będą na Ciebie czekać ${when}.`,
		tooFew: (minimum: number, missing: number): string =>
			`Powtórki będzie można rozpocząć, gdy w Twoim atelier znajdzie się przynajmniej ${minimum} dzieł z obrazami. Obecnie brakuje jeszcze ${missing}.`,
		options: 'Zmień zakres lub formę',
		scope: 'Co powtarzamy?',
		scopes: {
			all: 'Cała kolekcja'
		},
		form: 'W jakiej formie?',
		forms: {
			mixed: 'Mieszane',
			flashcards: 'Fiszki',
			quizzes: 'Quizy'
		},
		formHints: {
			mixed: 'Fiszki i quizy, dobrane do tego, jak dobrze znasz dzieło.',
			flashcards: 'Przypominasz sobie dzieło, odkrywasz kartę i oceniasz, jak Ci poszło.',
			quizzes: 'Wybierasz jedną z czterech odpowiedzi.'
		},
		start: 'Zacznij powtórkę',
		free: 'Powtórka swobodna',
		freeHint:
			'Dodatkowa runda losowo wybranych dzieł, które już powtarzasz. Nie zmienia planu powtórek ani serii.',
		freeTag: 'Tryb swobodny',
		howTitle: 'Jak działają powtórki?',
		how: 'Do puli codziennie dobierane są nowe dzieła, które dodasz do atelier, a także takie, które wymagają powtórki. Im lepiej pamiętasz dzieło, tym rzadziej będzie pojawiać się w kolejnych dniach.',
		knowledge: 'Jak dobrze znasz swoje atelier?',
		knowledgeGroups: {
			settled: { label: 'Utrwalone', hint: 'Pamiętasz je dłużej niż tydzień.' },
			learning: { label: 'W trakcie nauki', hint: 'Już powtarzane, jeszcze się utrwalają.' },
			fresh: { label: 'Nowe', hint: 'Czekają na pierwszą powtórkę.' }
		},
		troubles: 'Ostatnio sprawiały kłopot',
		stop: 'Przerwij',
		stopTitle: 'Przerwać teraz?',
		stopDescription: 'Twoje odpowiedzi do tej pory są zapisane.',
		freeStopDescription: 'Odpowiedzi w powtórce swobodnej nie są zapisywane.',
		keepGoing: 'Powtarzaj dalej',
		progress: (position: number, total: number): string => `${position} z ${total}`,
		progressLabel: 'Postęp powtórki',
		flashcard: {
			question: 'Poznajesz?',
			hint: 'Spróbuj przypomnieć sobie tytuł, autora, czas i styl, zanim odkryjesz kartę.',
			imageAlt: 'Dzieło do rozpoznania',
			reveal: 'Odkryj kartę',
			rate: 'Jak dobrze to pamiętasz?',
			notes: 'Twoja notatka'
		},
		quiz: {
			imageQuestion: { start: 'Gdzie jest', end: '?' },
			imageHint: 'Wybierz właściwe dzieło.',
			imageAlt: (position: number): string => `Obraz ${position}`,
			openImage: (position: number): string => `Powiększ obraz ${position}`,
			titleQuestion: 'Jaki to tytuł?',
			styleQuestion: 'W jakim stylu powstało to dzieło?',
			styleHint: 'Zwróć uwagę na formę, materiał i kompozycję.',
			pinQuestion: 'Co to jest?',
			pinHint: 'Wybierz pojęcie, które pasuje do zaznaczonego miejsca.',
			options: 'Odpowiedzi',
			right: 'Tak, to',
			wrong: 'Nie, to',
			marked: 'Dobra odpowiedź jest zaznaczona.',
			retry: 'Wrócimy do niego za chwilę.',
			rightOption: 'dobra odpowiedź',
			chosenOption: 'Twój wybór',
			next: 'Następne',
			reasons: {
				author: 'ten sam autor',
				style: 'ten sam styl',
				period: 'ten sam okres'
			},
			reasonLabels: {
				author: 'Ten sam autor',
				style: 'Ten sam styl',
				period: 'Ten sam okres'
			}
		},
		ratings: {
			1: 'Nie wiem',
			2: 'Prawie',
			3: 'Wiem'
		},
		saveErrorTitle: 'Nie udało się zapisać odpowiedzi',
		saveFailed: 'Nie udało się zapisać odpowiedzi. Spróbuj jeszcze raz.',
		done: 'Gotowe',
		summary: (count: number, minutes: number, tomorrow: number): string =>
			reviewedToday(count, minutes) +
			(tomorrow > 0
				? ` Jutro ${plural(tomorrow, { one: 'będzie', few: 'będą', many: 'będzie' })} na Ciebie czekać ${workCount(tomorrow)}.`
				: ''),
		groups: {
			1: 'Do poprawki',
			2: 'Prawie',
			3: 'Opanowane'
		},
		freeSummary: (count: number, minutes: number): string =>
			`${reviewedToday(count, minutes)} Plan powtórek się nie zmienił.`,
		nextRound: (count: number): string => `Następna runda (${count})`,
		freeNextRound: 'Kolejna runda swobodna'
	},
	imageSearch: {
		title: 'Które to dzieło?',
		description: (title: string, authors: string): string =>
			`Wyniki z Wikidata dla „${title}”${authors ? `, ${authors}` : ''}. Kliknij to, które dodajesz.`,
		searching: 'Szukam w Wikidata…',
		empty:
			'Nie znalazłem w Wikidata dzieła o takim tytule. Sprawdź pisownię albo dodaj własny obraz.',
		none: 'Żadne z tych',
		errorTitle: 'Nie udało się przeszukać Wikidata',
		retry: 'Szukaj jeszcze raz',
		century: (century: string, beforeCommonEra: boolean): string =>
			`${century} w.${beforeCommonEra ? ' p.n.e.' : ''}`,
		personTitle: 'Który to autor?',
		personDescription: (name: string): string =>
			`Wyniki z Wikidata dla „${name}”. Kliknij portret, który chcesz dodać.`,
		personEmpty:
			'Nie znalazłem w Wikidata portretu osoby o takiej nazwie. Sprawdź pisownię albo dodaj własny portret.',
		personNone: 'Żaden z tych'
	},
	imageSearchErrors: {
		rateLimited: 'Wikidata dostaje teraz sporo zapytań. Odczekaj chwilę i spróbuj jeszcze raz.',
		network: 'Nie udało się połączyć z Wikidata. Sprawdź internet i spróbuj jeszcze raz.',
		failed: 'Wikidata nie odpowiedziała jak trzeba. Spróbuj jeszcze raz za chwilę.'
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
	eras: {
		prehistory: { name: 'prehistoria', years: 'do 3000 p.n.e.' },
		antiquity: { name: 'starożytność', years: 'do 476' },
		middle_ages: { name: 'średniowiecze', years: '476–1492' },
		early_modern: { name: 'nowożytność', years: '1492–1789' },
		modern: { name: 'nowoczesność', years: '1789–1945' },
		contemporary: { name: 'współczesność', years: 'od 1945' }
	},
	collectionErrors: {
		network: 'Nie udało się połączyć z serwerem. Sprawdź internet i odśwież stronę.'
	},
	artworkErrors: {
		titleRequired: 'Wpisz tytuł dzieła.',
		authorRequired: 'Dodaj autora albo zaznacz „Autor nieznany”.',
		yearRequired: 'Wpisz rok, żeby zaznaczyć „p.n.e.” albo „ok.”.',
		spanEndRequired: 'Wpisz rok końcowy.',
		spanOrder: 'Rok końcowy nie może być wcześniejszy niż początkowy.',
		yearInvalid: 'Rok to liczba całkowita od 1 w górę. Dla lat przed naszą erą zaznacz „p.n.e.”.',
		yearTooEarly: 'Rok przed naszą erą może sięgać najwyżej 3 000 000 p.n.e.',
		yearTooLate: 'Rok nie może być późniejszy niż 2500.',
		invalid: 'Niektóre pola się nie zgadzają. Sprawdź je i zapisz jeszcze raz.',
		conflict:
			'Nie udało się zapisać, bo dane zmieniły się w międzyczasie. Odśwież stronę i spróbuj jeszcze raz.',
		notFound: 'Nie ma takiego dzieła w Twoim atelier. Mogło trafić do kosza.',
		network: 'Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj jeszcze raz.'
	},
	ownImageErrors: {
		fileType: (formats: string): string =>
			`Tego pliku nie da się dodać jako obrazu. Wybierz ${formats}.`,
		fileTooLarge: (maxMegabytes: number): string =>
			`Ten plik ma więcej niż ${maxMegabytes} MB. Wybierz mniejszy.`,
		shrinkFailed: 'Nie udało mi się zmniejszyć tego obrazu. Wybierz mniejszy.',
		fileUnreadable: 'Nie udało się otworzyć tego obrazu. Wybierz inny plik.',
		clipboardEmpty:
			'W schowku nie ma teraz obrazu. Skopiuj go albo zrób zrzut ekranu i spróbuj jeszcze raz.',
		clipboardDenied:
			'Przeglądarka nie pozwoliła zajrzeć do schowka. Naciśnij Ctrl+V albo wybierz plik z dysku.',
		urlRequired: 'Wklej adres obrazka.',
		urlInvalid: 'Wklej pełny adres obrazka, zaczynający się od https://.',
		urlUnreadable:
			'Nie udało się wczytać obrazka z tego adresu. Sprawdź, czy prowadzi wprost do obrazka.',
		uploadNetwork: 'Nie udało się wysłać obrazu. Sprawdź internet i spróbuj jeszcze raz.',
		uploadFailed: 'Nie udało się wysłać obrazu. Spróbuj jeszcze raz za chwilę.'
	},
	cardIndex: {
		title: 'Kartoteka',
		lead: 'Tu opisujesz i porządkujesz swoje epoki, okresy, style, autorów, miejsca i wydarzenia. Możesz tutaj także utworzyć własne pola, które pozwolą dokładniej opisywać dzieła. Kliknij nazwę, która Cię interesuje, żeby zobaczyć szczegóły.',
		loadErrorTitle: 'Nie udało się wczytać Kartoteki',
		tabsLabel: 'Rodzaje wartości',
		tabs: {
			timeline: 'Okresy i style',
			material: 'Materiały',
			author: 'Autorzy',
			location: 'Miejsca',
			events: 'Wydarzenia',
			own: 'Własne pola'
		},
		emptyEra: 'W tej epoce nie ma jeszcze okresów.',
		periodsWithoutEra: 'Okresy bez epoki',
		stylesWithoutPeriod: 'Style bez okresu',
		emptyTimeline:
			'Nie ma tu jeszcze okresów ani stylów. Pojawią się, gdy wpiszesz je przy dziele.',
		emptyList: {
			material: 'Nie ma tu jeszcze materiałów. Pojawią się, gdy wpiszesz je przy dziele.',
			author: 'Nie ma tu jeszcze autorów. Pojawią się, gdy wpiszesz ich przy dziele.',
			location: 'Nie ma tu jeszcze miejsc. Pojawią się, gdy wpiszesz je przy dziele.'
		},
		emptyEvents: 'Nie ma tu jeszcze wydarzeń. Dodaj pierwsze, a pojawi się też w Kalendarium.',
		eventsAdd: 'Dodaj wydarzenie',
		search: {
			material: 'Szukaj materiału',
			author: 'Szukaj autora',
			location: 'Szukaj miejsca',
			events: 'Szukaj wydarzenia'
		},
		noResults: (query: string): string =>
			`Nic nie pasuje do „${query}”. Sprawdź pisownię albo wpisz krótszy fragment nazwy.`,
		openValue: (name: string, count: string): string => `${name}, ${count}`,
		kinds: {
			period: {
				name: 'Okres',
				accusative: 'okres',
				genitive: 'okresu',
				demonstrative: 'Ten okres',
				other: 'innym okresem'
			},
			style: {
				name: 'Styl',
				accusative: 'styl',
				genitive: 'stylu',
				demonstrative: 'Ten styl',
				other: 'innym stylem'
			},
			material: {
				name: 'Materiał',
				accusative: 'materiał',
				genitive: 'materiału',
				demonstrative: 'Ten materiał',
				other: 'innym materiałem'
			},
			author: {
				name: 'Autor',
				accusative: 'autora',
				genitive: 'autora',
				demonstrative: 'Ten autor',
				other: 'innym autorem'
			},
			location: {
				name: 'Miejsce',
				accusative: 'miejsce',
				genitive: 'miejsca',
				demonstrative: 'To miejsce',
				other: 'innym miejscem'
			}
		},
		mergeConfirm: {
			title: (merged: string, kept: string): string => `Połączyć „${merged}” z „${kept}”?`,
			unused: (merged: string): string =>
				`Żadne dzieło nie ma teraz „${merged}”, więc zmieni się tylko Kartoteka: „${merged}” z niej zniknie.`,
			assigned: (merged: string, kept: string, count: number, kind: string): string =>
				`Wszystkie dzieła z „${merged}” (${count}) przypiszą się do ${kind} „${kept}”.`,
			periodAssigned: (merged: string, kept: string, count: number): string =>
				`${workCount(count)} z „${merged}” ${count === 1 ? 'dostanie' : 'dostaną'} „${kept}”, a „${merged}” zniknie z Kartoteki.`,
			periodLinks: (merged: string, kept: string): string =>
				`Epoki i style okresu „${merged}” dołączą do „${kept}”.`,
			pageContent: (merged: string): string =>
				`Podsumowanie, notatki i pozostałe informacje o „${merged}” zostaną usunięte.`,
			irreversible: 'Tej akcji nie będzie można cofnąć.',
			back: 'Wróć',
			confirm: 'Połącz',
			merging: 'Łączenie…'
		},
		moveConfirm: {
			title: 'Przenieść dzieła do innej epoki?',
			toEra: (period: string, from: string, count: number, to: string): string =>
				`${workCount(count)} z okresem „${period}” ${count === 1 ? 'jest' : 'są'} teraz w epoce ${from}. Po zapisie ${count === 1 ? 'przeniesie się' : 'przeniosą się'} do epoki ${to}.`,
			toNone: (period: string, from: string, count: number): string =>
				`${workCount(count)} z okresem „${period}” ${count === 1 ? 'jest' : 'są'} teraz w epoce ${from}. Po zapisie ${count === 1 ? 'zostanie' : 'zostaną'} bez epoki. Okres i style się nie zmienią.`,
			toPicked: (period: string, from: string, count: number): string =>
				`${workCount(count)} z okresem „${period}” ${count === 1 ? 'jest' : 'są'} teraz w epoce ${from}. Wybierz epokę, do której ${count === 1 ? 'ma' : 'mają'} trafić po zapisie.`,
			pick: 'Do której epoki mają trafić?',
			pickRequired: 'Wybierz epokę.',
			back: 'Wróć',
			confirm: 'Zapisz i przenieś'
		},
		deleteConfirm: {
			title: (kind: string, name: string): string => `Usunąć ${kind} „${name}”?`,
			description: 'Żadne dzieło go nie używa, więc zniknie z Kartoteki razem z powiązaniami.',
			back: 'Wróć',
			confirm: 'Usuń',
			deleting: 'Usuwanie…'
		},
		merged: (name: string): string => `Połączono z „${name}”.`,
		deleted: (name: string): string => `Usunięto „${name}”.`,
		errors: {
			network: 'Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj jeszcze raz.',
			notFound: 'Nie ma już takiej wartości. Odśwież stronę.',
			changed: 'Coś zmieniło się w międzyczasie. Odśwież stronę i spróbuj jeszcze raz.'
		}
	},
	ownFields: {
		empty:
			'Nie masz jeszcze żadnych własnych pól. Dodaj pole, aby zobaczyć je przy wszystkich swoich dziełach.',
		intro:
			'Własne pola to dodatkowe informacje, które będzie można uzupełniać przy dziełach. Każde z nich pojawi się przy edycji istniejących dzieł oraz przy dodawaniu nowych. Ich wypełnianie zawsze będzie opcjonalne.',
		add: 'Dodaj pole',
		kinds: {
			text: 'Tekst',
			list: 'Lista',
			flag: 'Zaznaczenie'
		},
		kindNotes: {
			text: 'dowolna treść',
			list: 'jedna lub wiele wartości',
			flag: 'pole do zaznaczania'
		},
		oneValue: 'jedna wartość',
		manyValues: 'kilka wartości',
		summary: (parts: string[]): string => parts.join(' · '),
		noValues: 'Nie ma tu jeszcze wartości. Pojawią się, gdy wpiszesz je przy dziele.',
		values: 'Wartości',
		search: (name: string): string => `Szukaj w polu „${name}”`,
		ticked: 'Tak',
		menu: (name: string): string => `Działania pola „${name}”`,
		edit: 'Zmień nazwę',
		moveUp: 'Przesuń wyżej',
		moveDown: 'Przesuń niżej',
		remove: 'Usuń',
		form: {
			newTitle: 'Nowe pole',
			name: 'Nazwa',
			description: 'Opis (opcjonalnie)',
			descriptionHint:
				'Wyjaśnienie, które może w przyszłości pomóc zdecydować, co wpisywać w tym polu.',
			kind: 'Rodzaj',
			kindFixed: 'Wybranego rodzaju nie będzie można zmienić po utworzeniu pola.',
			multiple: 'Dzieło może mieć kilka wartości',
			cancel: 'Anuluj',
			create: 'Dodaj',
			creating: 'Dodawanie…',
			save: 'Zapisz',
			saving: 'Zapisywanie…',
			errorTitle: 'Nie udało się zapisać pola'
		},
		deleteConfirm: {
			title: (name: string): string => `Usunąć pole „${name}”?`,
			description: (count: number): string =>
				count === 0
					? 'Pole zniknie z formularza. Usunięcia nie będzie można cofnąć.'
					: `Pole zniknie z formularza i z ${count} ${plural(count, { one: 'dzieła', few: 'dzieł', many: 'dzieł' })}, ${plural(count, { one: 'które ma', few: 'które mają', many: 'które mają' })} je uzupełnione. Usunięcia nie będzie można cofnąć.`,
			back: 'Wróć',
			confirm: 'Usuń pole',
			deleting: 'Usuwanie…'
		},
		value: {
			description: (field: string, count: string): string => `${field} · ${count}`,
			name: 'Nazwa',
			mergeHint: (name: string, count: string): string =>
				`Masz już „${name}” (${count}). Zapisz, a połączę je w jeden.`,
			cancel: 'Anuluj',
			save: 'Zapisz',
			saving: 'Zapisywanie…',
			merge: 'Połącz',
			kind: 'wartości',
			errorTitle: 'Nie udało się zapisać wartości'
		},
		errorTitle: 'Nie udało się zmienić pola',
		loadErrorTitle: 'Nie udało się wczytać własnych pól',
		created: (name: string): string => `Dodano pole „${name}”.`,
		saved: (name: string): string => `Zapisano „${name}”.`,
		deleted: (name: string): string => `Usunięto pole „${name}”.`,
		errors: {
			nameRequired: 'Wpisz nazwę.',
			builtInName: (name: string): string =>
				`Dzieło ma już wbudowane pole „${name}”. Wybierz inną nazwę.`,
			ownName: (name: string): string => `Masz już pole „${name}”.`
		}
	},
	mentions: {
		heading: 'Wspominasz o tym w notatkach',
		artwork: 'Dzieło'
	},
	feedback: {
		title: 'Zgłoś uwagę',
		description: 'Coś nie działa albo brakuje Ci jakiejś funkcji? Daj znać.',
		kind: 'Co zgłaszasz?',
		bug: 'Błąd',
		idea: 'Pomysł',
		titleLabel: 'Tytuł',
		titleHint: 'Jedno zdanie o tym, czego dotyczy zgłoszenie.',
		descriptionLabel: 'Opis',
		descriptionHint: 'Co się stało albo jak miałoby to działać? Nieobowiązkowe.',
		send: 'Wyślij',
		sending: 'Wysyłanie…',
		cancel: 'Anuluj',
		sent: 'Zgłoszenie wysłane.',
		errorTitle: 'Nie udało się wysłać zgłoszenia',
		errors: {
			kindRequired: 'Wybierz, czy to błąd, czy pomysł.',
			titleRequired: 'Wpisz tytuł zgłoszenia.',
			invalid: 'Zgłoszenie jest niepoprawne. Sprawdź tytuł i opis.',
			network: 'Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj jeszcze raz.'
		}
	},
	pins: {
		switchLabel: (count: number): string => `Pinezki (${count})`,
		editorNote: 'Pinezki zapisują się od razu, niezależnie od przycisku „Zapisz”.',
		editHint:
			'Wskaż miejsce na obrazie, żeby dodać pinezkę. Przeciągnij pinezkę, żeby ją przesunąć.',
		imagePins: (count: number): string => `Jego pinezki (${count}) usuną się po zapisaniu.`,
		placeHere: 'Dodaj pinezkę w tym miejscu',
		marker: (number: number, name?: string, view = false): string =>
			`${name ? `Pinezka ${number}: ${name}` : `Pinezka ${number}`}${view ? ', widok lupy' : ''}`,
		view: (level?: string): string => (level ? `Widok lupy (${level})` : 'Widok lupy'),
		removeView: 'Usuń widok',
		newTitle: 'Nowa pinezka',
		title: 'Pinezka',
		term: 'Pojęcie ze Słowniczka (opcjonalnie)',
		termPlaceholder: 'Szukaj pojęcia',
		text: 'Opis (opcjonalnie)',
		remove: 'Usuń',
		removing: 'Usuwam…',
		cancel: 'Anuluj',
		save: 'Zapisz',
		saving: 'Zapisuję…',
		loadFailed: 'Nie udało się wczytać pinezek.',
		errorTitle: 'Nie udało się zapisać pinezki',
		deleteErrorTitle: 'Nie udało się usunąć pinezki',
		errors: {
			empty: 'Wybierz pojęcie albo wpisz opis.',
			tooLong: (limit: number): string => `Opis może mieć najwyżej ${limit} znaków.`,
			tooMany: (limit: number): string => `Na jednym obrazie zmieści się ${limit} pinezek.`,
			notFound: 'Nie znaleziono tej pinezki. Odśwież stronę i spróbuj jeszcze raz.',
			network: 'Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj jeszcze raz.'
		}
	},
	glossary: {
		title: 'Słowniczek',
		count: (count: number): string =>
			`${count} ${plural(count, { one: 'pojęcie', few: 'pojęcia', many: 'pojęć' })}`,
		lead: 'Pojęcia i postaci, które chcesz zapamiętać. Ich definicje pojawią się w Twoich notatkach.',
		back: 'Słowniczek',
		add: 'Dodaj pojęcie',
		addShort: 'Dodaj',
		empty:
			'Nie masz jeszcze żadnego pojęcia. Dodaj pierwsze, gdy trafisz na słowo, które chcesz zapamiętać.',
		search: 'Szukaj pojęcia',
		noResults: (query: string): string =>
			`Nic nie pasuje do „${query}”. Sprawdź pisownię albo wpisz krótszy fragment.`,
		categories: 'Kategorie',
		loadErrorTitle: 'Nie udało się wczytać słowniczka',
		categoryNames: {
			person: 'Osoba',
			architecture: 'Architektura',
			painting: 'Malarstwo',
			sculpture: 'Rzeźba',
			technique: 'Technika i materiał',
			general: 'Pojęcie ogólne'
		},
		card: {
			source: 'Na podstawie Wikipedii, CC BY-SA 4.0',
			open: 'Otwórz w Słowniczku'
		},
		view: {
			also: (forms: string): string => `też: ${forms}`,
			noDefinition: 'Nie dodano jeszcze definicji.',
			mentionsHeading: 'Pojawia się w notatkach',
			onArtworks: 'Na dziełach',
			sourcePrefix: 'Na podstawie: Wikipedia, ',
			licenceLink: 'CC BY-SA 4.0',
			edit: 'Edytuj',
			delete: 'Usuń',
			notFoundTitle: 'Nie ma takiego pojęcia',
			notFound: 'Nie ma takiego pojęcia w słowniczku. Może zostało usunięte.',
			loadErrorTitle: 'Nie udało się wczytać tego pojęcia',
			saved: (name: string): string => `Zapisano „${name}”.`,
			deleted: (name: string): string => `Usunięto „${name}”.`
		},
		deleteConfirm: {
			title: (name: string): string => `Usunąć „${name}” ze słowniczka?`,
			description: 'Słowo w notatkach straci tło i dymek. Tego nie da się cofnąć.',
			back: 'Zostaw',
			confirm: 'Usuń',
			deleting: 'Usuwanie…'
		},
		form: {
			newTitle: 'Nowe pojęcie',
			editTitle: 'Edycja pojęcia',
			name: 'Nazwa',
			namePlaceholder: 'Np. tympanon, sfumato, Lorenzo Medici',
			nameTaken: (name: string): string => `Masz już pojęcie „${name}”.`,
			category: 'Kategoria',
			categoryRequired: 'Wybierz kategorię.',
			definition: 'Definicja',
			definitionPending: 'Wpisz nazwę i wybierz kategorię, a poszukam definicji w Wikipedii.',
			definitionSearching: 'Szukam w Wikipedii…',
			definitionNone: 'Wikipedia nie zna tego słowa. Napisz definicję własnymi słowami.',
			definitionFailed:
				'Nie udało się połączyć z Wikipedią. Możesz napisać definicję własnymi słowami albo spróbować jeszcze raz.',
			searchAgain: 'Szukaj jeszcze raz',
			searchDefinition: 'Szukaj w Wikipedii',
			definitionManual: 'Napisz definicję własnymi słowami albo poszukaj jej w Wikipedii.',
			definitionTooLong: (max: number): string => `Definicja może mieć najwyżej ${max} znaków.`,
			sourcePrefix: 'Na podstawie: Wikipedia, ',
			pickArticle: 'Wybierz inny artykuł',
			removeSource: 'Usuń źródło',
			sortByOther: 'Sortuj inaczej niż po nazwie',
			sortName: 'Sortuj jako',
			sortNamePlaceholder: 'np. Medici, Lorenzo',
			sortNameHint: 'Według tego pojęcie trafi pod właściwą literę.',
			synonyms: 'Synonimy',
			synonymsHint:
				'Inne nazwy tego samego. Pokażą się pod nazwą, a ich odmiana trafi do „Odmiany”. Każdą zatwierdzasz Enterem.',
			synonymsFull: 'Najwyżej 3 synonimy. Usuń któryś, żeby dodać inny.',
			forms: 'Odmiana',
			formsCount: (count: number): string =>
				`${count} ${plural(count, { one: 'forma', few: 'formy', many: 'form' })}`,
			showForms: 'Pokaż formy',
			hideForms: 'Zwiń',
			formsSearching: 'Szukam odmiany w Wikisłowniku…',
			synonymFormsSearching: (word: string): string => `Szukam odmiany „${word}” w Wikisłowniku…`,
			synonymFormsNone: (word: string): string =>
				`Nie udało się odszukać „${word}” w słowniku. Możesz dopisać formy samodzielnie.`,
			formsSkipped: 'Odmianę tego pojęcia musisz dopisać samodzielnie.',
			formsNone:
				'Nie udało się odszukać tego hasła w słowniku. Możesz dopisać jego formy samodzielnie.',
			formsFailed:
				'Nie udało się połączyć z Wikisłownikiem. Spróbuj jeszcze raz albo dopisz formy samodzielnie.',
			formsFetch: 'Pobierz z Wikisłownika',
			formsRefetch: 'Pobierz ponownie',
			formsHint:
				'Formy nie pokazują się pod nazwą. Dzięki nim pojęcie znajdzie się w notatkach także odmienione.',
			authorWarningSuffix:
				' jest już w Kartotece jako autor. Możesz dodać ją także tutaj albo opisać na stronie autora.',
			cancel: 'Anuluj',
			save: 'Zapisz',
			saving: 'Zapisywanie…',
			errorTitle: 'Nie udało się zapisać pojęcia',
			discardDescription: 'Masz niezapisane zmiany. Jeśli wyjdziesz, znikną.'
		},
		articles: {
			title: 'Który to artykuł?',
			description: (name: string, category: string): string =>
				`Wyniki z Wikipedii dla „${name}” w kategorii ${category}. Wybierz ten, o który ci chodzi.`,
			listLabel: 'Artykuły z Wikipedii',
			searching: 'Szukam w Wikipedii…',
			cancel: 'Anuluj',
			use: 'Użyj tego artykułu'
		},
		replaceConfirm: {
			title: 'Zastąpić Twoją definicję?',
			description: 'Definicja ma już Twoje zmiany. Tekst z nowego artykułu je zastąpi.',
			keep: 'Zostaw moją',
			replace: 'Zastąp'
		},
		errors: {
			notFound: 'Nie ma takiego pojęcia w słowniczku. Może zostało usunięte.',
			invalid: 'Nie udało się zapisać pojęcia. Sprawdź nazwę i definicję.',
			network: 'Nie udało się połączyć. Sprawdź internet i spróbuj jeszcze raz.'
		}
	},
	chronicle: {
		title: 'Kronika',
		lead: 'Dziennik Twoich wizyt w muzeach i innych spotkań ze sztuką. Możesz tutaj zapisać, gdzie i kiedy udało Ci się zobaczyć dzieła z Twojej kolekcji na żywo.',
		count: (visits: number, seen: number): string =>
			`${visitCount(visits)} · ${workCount(seen)} na żywo`,
		add: 'Dodaj wizytę',
		addShort: 'Dodaj',
		empty:
			'Kronika jest jeszcze pusta. Niedawno w muzeum? Zapisz tę wizytę, póki szczegóły są świeże.',
		loadErrorTitle: 'Nie udało się wczytać kroniki',
		back: 'Kronika',
		seen: (count: number): string => `${workCount(count)} na żywo`,
		seenCount: (count: number): string =>
			`${plural(count, { one: 'dzieło', few: 'dzieła', many: 'dzieł' })} na żywo`,
		kind: 'Wizyta',
		inYear: (year: number): string => `${year} roku`,
		saved: (place: string, date: string): string => `Zapisano wizytę: ${place}, ${date}.`,
		view: {
			seenTitle: 'Widziane na żywo',
			noArtworks: 'Do tej wizyty nie ma jeszcze dzieł. Kliknij „Edytuj”, żeby je zaznaczyć.',
			notesTitle: 'Notatki',
			edit: 'Edytuj',
			delete: 'Usuń',
			deleted: (date: string): string => `Usunięto wizytę z ${date}.`,
			notFoundTitle: 'Nie ma takiej wizyty',
			loadErrorTitle: 'Nie udało się wczytać wizyty'
		},
		deleteConfirm: {
			title: (date: string): string => `Usunąć wizytę z ${date}?`,
			description: 'Zniknie wizyta i jej notatka. Dzieła zostaną w kolekcji.',
			back: 'Zostaw',
			confirm: 'Usuń',
			deleting: 'Usuwanie…'
		},
		form: {
			newTitle: 'Nowa wizyta',
			editTitle: 'Edycja wizyty',
			place: 'Miejsce',
			placeHint: 'Muzeum, galeria albo kościół. Dzieła, które tam są, zaznaczymy od razu.',
			placeRequired: 'Wybierz, gdzie była wizyta.',
			date: 'Data',
			dateHint: 'Wystarczy sam rok, jeśli dokładniej nie pamiętasz.',
			day: 'Dzień',
			month: 'Miesiąc',
			year: 'Rok',
			yearRequired: 'Wpisz, w którym roku była wizyta.',
			yearInvalid: 'Wpisz rok czterema cyframi, na przykład 2026.',
			monthRequired: 'Do dnia wybierz miesiąc albo usuń dzień.',
			dayInvalid: 'Taki dzień nie istnieje w tym miesiącu.',
			notes: 'Notatki',
			notesPlaceholder: 'Jak było? Co Cię zaskoczyło? Co warto zapamiętać?',
			artworks: 'Dzieła',
			ticked: 'Zaznaczyliśmy wszystko z tego miejsca. Odznacz to, czego tym razem nie było.',
			search: 'Udało się zobaczyć coś jeszcze? Szukaj w całej kolekcji',
			noMatch: 'W kolekcji nie ma takiego dzieła.',
			addArtwork: (title: string): string => `Dodaj „${title}”`,
			fromPlace: 'Z tego miejsca',
			fromElsewhere: 'Z innych miejsc',
			noPlace: 'Wybierz miejsce, a pokażemy jego dzieła.',
			placeEmpty:
				'W kolekcji nie ma jeszcze dzieł z tego miejsca. Te zobaczone dodasz przez wyszukiwarkę.',
			cancel: 'Anuluj',
			save: 'Zapisz',
			saving: 'Zapisywanie…',
			errorTitle: 'Nie udało się zapisać wizyty',
			discardDescription: 'Masz niezapisane zmiany. Jeśli wyjdziesz, znikną.',
			notFoundTitle: 'Nie ma takiej wizyty',
			loadErrorTitle: 'Nie udało się wczytać wizyty'
		},
		errors: {
			notFound: 'Nie ma takiej wizyty w kronice. Może została usunięta.',
			invalid: 'Nie udało się zapisać wizyty. Sprawdź miejsce, datę i dzieła.',
			network: 'Nie udało się połączyć. Sprawdź internet i spróbuj jeszcze raz.'
		}
	},
	timeline: {
		title: 'Kalendarium',
		lead: 'Twoje dzieła i wydarzenia w prawdziwej skali czasu, epoka po epoce.',
		add: 'Dodaj wydarzenie',
		addShort: 'Dodaj',
		saved: (name: string): string => `Zapisano wydarzenie „${name}”.`,
		form: {
			newTitle: 'Nowe wydarzenie',
			editTitle: 'Edycja wydarzenia',
			name: 'Nazwa',
			namePlaceholder: 'Np. wojny napoleońskie, chrzest Polski',
			nameRequired: 'Wpisz nazwę wydarzenia.',
			year: 'Rok',
			spanTitle: 'Lata',
			yearRequired: 'Wpisz rok wydarzenia.',
			description: 'Opis',
			descriptionPlaceholder: 'Co warto o nim pamiętać',
			cancel: 'Anuluj',
			save: 'Zapisz',
			saving: 'Zapisywanie…',
			errorTitle: 'Nie udało się zapisać wydarzenia',
			discardDescription: 'Masz niezapisane zmiany. Jeśli wyjdziesz, znikną.',
			notFoundTitle: 'Nie ma takiego wydarzenia',
			loadErrorTitle: 'Nie udało się wczytać wydarzenia',
			sourcePrefix: 'Na podstawie: Wikipedia, ',
			pickArticle: 'Wybierz inny artykuł',
			searchArticles: 'Szukaj w Wikipedii',
			removeSource: 'Usuń źródło'
		},
		articles: {
			description: (name: string): string =>
				`Wyniki z Wikipedii dla „${name}”. Wybierz ten, o który ci chodzi.`,
			none: 'Wikipedia nie zna tego wydarzenia. Wpisz daty sam.',
			failed:
				'Nie udało się połączyć z Wikipedią. Możesz wpisać daty sam albo spróbować jeszcze raz.'
		},
		replaceConfirm: {
			title: 'Zastąpić Twoje daty i opis?',
			description: 'Daty albo opis mają już Twoje zmiany. Dane z nowego artykułu je zastąpią.',
			keep: 'Zostaw moje',
			replace: 'Zastąp'
		},
		loadErrorTitle: 'Nie udało się wczytać kalendarium',
		strip: 'Pasek epok',
		previous: (era: string): string => `Poprzednia epoka: ${era}`,
		next: (era: string): string => `Następna epoka: ${era}`,
		steps: {
			label: 'Skala',
			era: 'Epoka',
			'10000': '10 tysiącleci',
			'1000': 'Tysiąclecie',
			'300': 'Trzy wieki',
			'100': 'Stulecie',
			'30': 'Pokolenie'
		},
		zoomIn: 'Przybliż o krok',
		zoomOut: 'Oddal o krok',
		stage: 'Oś czasu. Strzałki przesuwają czas, plus i minus zmieniają skalę o krok.',
		stageGroup: 'Oś czasu',
		card: {
			event: 'Wydarzenie',
			period: 'Okres',
			length: (years: number): string =>
				`${years} ${plural(years, { one: 'rok', few: 'lata', many: 'lat' })}`,
			artworksOfTime: 'Dzieła z tego czasu',
			noArtworks: 'W tym czasie nie masz żadnego dzieła.',
			showWhole: 'Pokaż cały okres na osi',
			sourcePrefix: 'Na podstawie: Wikipedia, ',
			edit: 'Edytuj',
			delete: 'Usuń'
		},
		deleteConfirm: {
			title: (name: string): string => `Usunąć wydarzenie „${name}”?`,
			description: 'Zniknie z kalendarium. Żadne dzieło się nie zmieni.',
			back: 'Wróć',
			confirm: 'Usuń',
			deleting: 'Usuwanie…'
		},
		deleted: (name: string): string => `Usunięto wydarzenie „${name}”.`,
		noEvents: 'Nie masz jeszcze żadnych dodanych wydarzeń',
		hiddenEvents: (count: number): string =>
			`${count} ${plural(count, { one: 'wydarzenie', few: 'wydarzenia', many: 'wydarzeń' })} poza widokiem. Przybliż, żeby je zobaczyć.`,
		now: (year: string, parts: string[]): string => [year, ...parts].join(' · '),
		nowEvents: (events: string): string => `w tym czasie: ${events}`,
		nowArtworks: (titles: string, more: number): string =>
			`dzieła: ${titles}${more > 0 ? ` (+${more})` : ''}`,
		readingArtworks: 'W linii czytania:',
		readingArtworksNone: 'W linii czytania nie ma dzieł.',
		readingMore: (count: number): string => `(+${count})`,
		lane: (name: string, count: number): string => `${name} · ${count}`,
		filters: {
			lanes: 'Okresy i style',
			lanesHint: (era: string): string => `Wybierz maksymalnie 5 z epoki ${era}.`,
			lanesFull: 'Wybrano 5. Odznacz któryś, żeby wybrać inny.',
			periods: 'Okresy',
			styles: 'Style',
			types: 'Typ dzieła',
			authors: 'Autor',
			searchAuthors: 'Szukaj autora',
			view: 'Widok',
			events: 'Wydarzenia',
			readingArtworks: 'Dzieła w linii czytania',
			empty: 'W tej epoce nie ma dzieł, które pasują do filtrów.'
		},
		zones: {
			events: 'Wydarzenia',
			artworks: 'Dzieła'
		},
		century: (numeral: string, beforeCommonEra: boolean): string =>
			`${numeral} w.${beforeCommonEra ? ' p.n.e.' : ''}`,
		millennium: (numeral: string, beforeCommonEra: boolean): string =>
			`${numeral} tysiąclecie${beforeCommonEra ? ' p.n.e.' : ''}`,
		errors: {
			notFound: 'Nie ma takiego wydarzenia w kalendarium. Może zostało usunięte.',
			invalid: 'Nie udało się zapisać wydarzenia. Sprawdź nazwę i datę.',
			network: 'Nie udało się połączyć. Sprawdź internet i spróbuj jeszcze raz.'
		}
	},
	valuePage: {
		back: 'Kartoteka',
		edit: 'Edytuj',
		notes: 'Notatki',
		delete: 'Usuń',
		deleteBlocked: (demonstrative: string, count: string, other: string): string =>
			`${demonstrative} ma jeszcze ${count}, więc nie da się go usunąć. Możesz go połączyć z ${other}.`,
		header: (kind: string, count: string): string => `${kind} · ${count}`,
		born: (year: string): string => `ur. ${year}`,
		died: (year: string): string => `zm. ${year}`,
		eraKind: 'Epoka',
		notFoundTitle: 'Nie ma takiej wartości',
		notFound: 'Nie ma takiej wartości w Kartotece. Może została usunięta albo połączona z inną.',
		loadErrorTitle: 'Nie udało się wczytać tej strony',
		saved: 'Zapisano zmiany.',
		kinds: {
			era: {
				artworks: 'Dzieła z tej epoki',
				noNotes: 'Nie masz jeszcze notatek o tej epoce.',
				noArtworks: 'Nie posiadasz w swojej kolekcji żadnego dzieła z tej epoki.'
			},
			period: {
				artworks: 'Dzieła z tego okresu',
				noNotes: 'Nie masz jeszcze notatek o tym okresie.',
				noArtworks: 'Nie posiadasz w swojej kolekcji żadnego dzieła z tego okresu.'
			},
			style: {
				artworks: 'Dzieła w tym stylu',
				noNotes: 'Nie masz jeszcze notatek o tym stylu.',
				noArtworks: 'Nie posiadasz w swojej kolekcji żadnego dzieła w tym stylu.'
			},
			material: {
				artworks: 'Dzieła z tego materiału',
				noNotes: 'Nie masz jeszcze notatek o tym materiale.',
				noArtworks: 'Nie posiadasz w swojej kolekcji żadnego dzieła z tego materiału.'
			},
			author: {
				artworks: 'Dzieła tego autora',
				noNotes: 'Nie masz jeszcze notatek o tym autorze.',
				noArtworks: 'Nie posiadasz w swojej kolekcji żadnego dzieła tego autora.'
			},
			location: {
				artworks: 'Dzieła z tego miejsca',
				noNotes: 'Nie masz jeszcze notatek o tym miejscu.',
				noArtworks: 'Nie posiadasz w swojej kolekcji żadnego dzieła z tego miejsca.'
			}
		}
	},
	valueForm: {
		name: 'Nazwa',
		nameRequired: 'Wpisz nazwę.',
		mergeHint: (kind: string, name: string, count: string): string =>
			`Masz już ${kind} „${name}” (${count}). Zapisz, a połączę je w jeden.`,
		eras: 'Epoki',
		periods: 'Okresy',
		noEras: 'Ten okres nie ma jeszcze epoki.',
		noPeriods: 'Ten styl nie ma jeszcze okresu.',
		addEra: 'Dodaj epokę',
		addPeriod: 'Dodaj okres',
		chooseEra: 'Wybierz epokę',
		choosePeriod: 'Wybierz okres',
		removeEra: (name: string): string => `Usuń epokę ${name}`,
		removePeriod: (name: string): string => `Usuń okres ${name}`,
		periodLocked: (period: string, count: number): string =>
			`Nie uda się odpiąć okresu „${period}” od tego stylu, bo ${workCount(count)} w tym stylu ${count === 1 ? 'ma' : 'mają'} przypisany taki okres.`,
		cancel: 'Anuluj',
		save: 'Zapisz',
		saving: 'Zapisywanie…',
		editTitle: (kind: string, name: string): string => `Edytuj ${kind} „${name}”`,
		eraAccusative: 'epokę',
		summary: 'Podsumowanie',
		summaryPlaceholder: 'Krótki opis do szybkiego podejrzenia przy oglądaniu dzieła.',
		notes: 'Notatki',
		notesPlaceholder: 'Wszystko, co warto zapamiętać',
		notesLinkHint:
			'Wpisz @, żeby dodać odnośnik do autora, epoki albo miejsca, albo #, żeby dodać odnośnik do dzieła.',
		errorTitle: 'Nie udało się zapisać zmian',
		discardDescription: 'Masz niezapisane zmiany. Jeśli wyjdziesz, znikną.',
		portrait: {
			label: 'Portret',
			find: 'Znajdź portret',
			findOther: 'Wybierz inny',
			findHint: 'Wpisz nazwę, żeby znaleźć portret.',
			own: 'Własny portret',
			changeOwn: 'Zmień własny',
			ownTitle: 'Dodaj własny portret',
			changeOwnTitle: 'Zmień własny portret',
			remove: 'Usuń portret'
		},
		lifeYears: 'Lata życia',
		birthYear: 'Rok urodzenia',
		deathYear: 'Rok śmierci',
		birthBeforeCommonEra: 'p.n.e. (urodzenie)',
		deathBeforeCommonEra: 'p.n.e. (śmierć)',
		lifeYearsOrder: 'Rok śmierci nie może być wcześniejszy niż rok urodzenia.',
		sortByOther: 'Sortuj inaczej niż po nazwie',
		sortName: 'Sortuj jako',
		sortNamePlaceholder: 'np. Vinci, Leonardo da',
		sortNameHint: 'Po tej wartości będą sortowani autorzy.',
		country: 'Kraj',
		countryPlaceholder: 'Zacznij pisać nazwę kraju',
		countryHint: 'Wybierz kraj z listy.',
		placeType: 'Typ miejsca',
		placeTypes: {
			museum: 'Muzeum',
			gallery: 'Galeria',
			private_collection: 'Kolekcja prywatna',
			on_site: 'Na miejscu'
		}
	},
	trash: {
		title: 'Kosz',
		emptyTitle: 'Kosz jest pusty.',
		back: 'Wróć do atelier',
		loadErrorTitle: 'Nie udało się wczytać kosza',
		actionErrorTitle: 'Nie udało się zmienić kosza',
		deletedOn: (date: string): string => `w koszu od ${date}`,
		today: 'dziś',
		restore: 'Przywróć',
		restoring: 'Przywracanie…',
		deleteForever: 'Usuń na zawsze',
		cancel: 'Anuluj',
		moveTitle: (number: string): string => `Przenieść ${number} do kosza?`,
		moveDescription: 'Dzieło zniknie z atelier. Przywrócisz je z kosza.',
		move: 'Przenieś do kosza',
		moving: 'Przenoszenie…',
		moved: (number: string): string => `Przeniesiono ${number} do kosza.`,
		restored: (number: string): string => `Przywrócono ${number}.`,
		deleteTitle: (number: string): string => `Usunąć ${number} na zawsze?`,
		deleteDescription: (number: string): string =>
			`Dzieło i Twój obraz znikną bezpowrotnie. Numer ${number} nie wróci do użycia.`,
		deleting: 'Usuwanie…',
		deleted: (number: string): string => `Usunięto ${number} na zawsze.`
	}
};

type PluralForms = Record<'one' | 'few' | 'many', string>;

const pluralRules = new Intl.PluralRules('pl');

function reviewedToday(count: number, minutes: number): string {
	return `Dziś udało się powtórzyć ${workCount(count)}, zajęło Ci to ${minuteCount(minutes)}.`;
}

function minuteCount(count: number): string {
	return `${count} ${plural(count, { one: 'minutę', few: 'minuty', many: 'minut' })}`;
}

function visitCount(count: number): string {
	return `${count} ${plural(count, { one: 'wizyta', few: 'wizyty', many: 'wizyt' })}`;
}

function workCount(count: number): string {
	return `${count} ${plural(count, { one: 'dzieło', few: 'dzieła', many: 'dzieł' })}`;
}

function plural(count: number, forms: PluralForms): string {
	const category = pluralRules.select(count);
	return category === 'one' || category === 'few' ? forms[category] : forms.many;
}
