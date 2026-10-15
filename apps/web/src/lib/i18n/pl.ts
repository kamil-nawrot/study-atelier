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
		noImage: 'Brak zdjęcia',
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
			numberedList: 'Lista numerowana'
		},
		valueField: {
			existing: 'Już używane',
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
		sessionEnded: 'Twoja sesja wygasła. Zaloguj się jeszcze raz.',
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
		trash: 'Kosz',
		signOut: 'Wyloguj się'
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
			period: 'Według epok',
			author: 'Według autorów'
		},
		periods: {
			label: 'Epoki',
			emptyTitle: 'Żadne dzieło nie ma jeszcze epoki',
			empty:
				'W tej kolejności widać tylko dzieła z wpisaną epoką. Dopisz epokę w dziele albo wróć do ostatnio dodanych.',
			showRecent: 'Pokaż ostatnio dodane'
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
		imagesUnavailableTitle: 'Nie wszystkie zdjęcia się wczytały',
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
				missing: 'Do uzupełnienia'
			},
			tagFields: {
				eras: 'Epoka',
				types: 'Typ',
				years: 'Rok',
				authors: 'Autor',
				periods: 'Okres',
				styles: 'Styl',
				materials: 'Materiał',
				locations: 'Miejsce',
				missing: 'Do uzupełnienia'
			},
			tag: (field: string, value: string): string => `${field} ${value}`,
			unknownAuthor: 'Autor nieznany',
			missing: {
				image: 'bez zdjęcia',
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
		goBack: 'Wróć',
		notFoundTitle: (number: string): string => `Nie ma dzieła ${number}`,
		loadErrorTitle: 'Nie udało się wczytać dzieła',
		image: 'Zdjęcie',
		findImage: 'Znajdź zdjęcie',
		ownImage: 'Dodaj własne',
		changeOwnImage: 'Zmień własne',
		ownImageTitle: 'Dodaj własne zdjęcie',
		changeOwnImageTitle: 'Zmień własne zdjęcie',
		removeImage: 'Usuń zdjęcie',
		chooseFile: 'Wybierz plik z dysku',
		fileHint: (formats: string, maxMegabytes: number): string =>
			`${formats}, do ${maxMegabytes} MB.`,
		pasteFromClipboard: 'Wklej ze schowka',
		pasteHintLead: 'Masz obraz w schowku? Po prostu naciśnij',
		pasteHintForm: 'Obraz ze schowka możesz też wkleić tutaj:',
		replaceImageTitle: 'Zastąpić obecne zdjęcie?',
		replaceImageDescription: 'Wklejony obraz zajmie jego miejsce.',
		replaceImage: 'Zastąp',
		keepImage: 'Zostaw obecne',
		imageUrl: 'Jeśli wolisz, podaj po prostu adres obrazka',
		imageUrlPlaceholder: 'https://…',
		useImageUrl: 'Użyj',
		usingImageUrl: 'Wczytywanie…',
		ownImageCredit: 'Twoje zdjęcie, widoczne tylko dla Ciebie.',
		ownImageUrlCredit: (host: string): string =>
			`Twoje zdjęcie z adresu ${host}, widoczne tylko dla Ciebie.`,
		findImageHint: 'Wpisz tytuł i autora, żeby znaleźć zdjęcie.',
		chooseOtherImage: 'Wybierz inne',
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
		typeNone: 'Nie wybrano',
		era: 'Epoka',
		period: 'Okres',
		periodLocked: 'Najpierw wybierz epokę.',
		style: 'Styl',
		styleLocked: 'Najpierw wybierz okres.',
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
		back: 'Atelier',
		edit: 'Edytuj',
		delete: 'Usuń',
		addImage: 'Dodaj zdjęcie',
		information: 'Informacje',
		showInformation: 'Pokaż informacje',
		hideInformation: 'Zamknij informacje',
		openImage: 'Powiększ zdjęcie',
		closeImage: 'Zamknij powiększenie',
		empty: 'Nie wpisano',
		previous: 'Poprzednie dzieło',
		next: 'Następne dzieło'
	},
	imageSearch: {
		title: 'Które to dzieło?',
		description: (title: string, authors: string): string =>
			`Wyniki z Wikidata dla „${title}”${authors ? `, ${authors}` : ''}. Kliknij to, które dodajesz.`,
		searching: 'Szukamy w Wikidata…',
		noImage: 'W Wikimedia nie ma wolnego zdjęcia tego dzieła',
		empty: 'Wikidata nie zna dzieła o takim tytule. Sprawdź pisownię albo dodaj własne zdjęcie.',
		none: 'Żadne z tych',
		errorTitle: 'Nie udało się przeszukać Wikidata',
		retry: 'Szukaj jeszcze raz',
		century: (century: string, beforeCommonEra: boolean): string =>
			`${century} w.${beforeCommonEra ? ' p.n.e.' : ''}`
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
		invalid: 'Niektóre pola się nie zgadzają. Sprawdź je i zapisz jeszcze raz.',
		conflict:
			'Nie udało się zapisać, bo dane zmieniły się w międzyczasie. Odśwież stronę i spróbuj jeszcze raz.',
		notFound: 'Nie ma takiego dzieła w Twoim atelier. Mogło trafić do kosza.',
		network: 'Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj jeszcze raz.'
	},
	ownImageErrors: {
		fileType: (formats: string): string =>
			`Tego pliku nie da się dodać jako zdjęcia. Wybierz ${formats}.`,
		fileTooLarge: (maxMegabytes: number): string =>
			`Ten plik ma więcej niż ${maxMegabytes} MB. Wybierz mniejszy albo zmniejsz zdjęcie.`,
		fileUnreadable: 'Nie udało się otworzyć tego zdjęcia. Wybierz inny plik.',
		clipboardEmpty:
			'W schowku nie ma teraz obrazu. Skopiuj go albo zrób zrzut ekranu i spróbuj jeszcze raz.',
		clipboardDenied:
			'Przeglądarka nie pozwoliła zajrzeć do schowka. Naciśnij Ctrl+V albo wybierz plik z dysku.',
		urlRequired: 'Wklej adres obrazka.',
		urlInvalid: 'Wklej pełny adres obrazka, zaczynający się od https://.',
		urlUnreadable:
			'Nie udało się wczytać obrazka z tego adresu. Sprawdź, czy prowadzi wprost do obrazka.',
		uploadNetwork: 'Nie udało się wysłać zdjęcia. Sprawdź internet i spróbuj jeszcze raz.',
		uploadFailed: 'Nie udało się wysłać zdjęcia. Spróbuj jeszcze raz za chwilę.'
	},
	cardIndex: {
		title: 'Kartoteka',
		lead: 'Tu porządkujesz swoje epoki, okresy, style i inne wartości, które wpisujesz przy dziełach.',
		loadErrorTitle: 'Nie udało się wczytać Kartoteki',
		actionErrorTitle: 'Nie udało się zapisać zmian',
		tabsLabel: 'Rodzaje wartości',
		tabs: {
			timeline: 'Okresy i style',
			material: 'Materiały',
			author: 'Autorzy',
			location: 'Miejsca'
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
		dialog: {
			description: (kind: string, count: string): string => `${kind} · ${count}`,
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
			delete: 'Usuń',
			deleteBlocked: (demonstrative: string, count: string, other: string): string =>
				`${demonstrative} ma jeszcze ${count}, więc nie da się go usunąć. Możesz go połączyć z ${other}.`,
			cancel: 'Anuluj',
			save: 'Zapisz',
			saving: 'Zapisywanie…',
			merge: 'Połącz'
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
			irreversible: 'Tej akcji nie będzie można cofnąć!',
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
		saved: (name: string): string => `Zapisano „${name}”.`,
		merged: (name: string): string => `Połączono z „${name}”.`,
		deleted: (name: string): string => `Usunięto „${name}”.`,
		errors: {
			network: 'Nie udało się połączyć z serwerem. Sprawdź internet i spróbuj jeszcze raz.',
			notFound: 'Nie ma już takiej wartości. Odśwież stronę.',
			changed:
				'Coś zmieniło się w międzyczasie. Zamknij okno, sprawdź Kartotekę i spróbuj jeszcze raz.'
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
			`Dzieło i Twoje zdjęcie znikną bezpowrotnie. Numer ${number} nie wróci do użycia.`,
		deleting: 'Usuwanie…',
		deleted: (number: string): string => `Usunięto ${number} na zawsze.`
	}
};

type PluralForms = Record<'one' | 'few' | 'many', string>;

const pluralRules = new Intl.PluralRules('pl');

function workCount(count: number): string {
	return `${count} ${plural(count, { one: 'dzieło', few: 'dzieła', many: 'dzieł' })}`;
}

function plural(count: number, forms: PluralForms): string {
	const category = pluralRules.select(count);
	return category === 'one' || category === 'few' ? forms[category] : forms.many;
}
