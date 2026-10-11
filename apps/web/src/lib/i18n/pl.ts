export const pl = {
	app: {
		name: 'Study Atelier'
	},
	alert: {
		danger: 'Błąd',
		warning: 'Uwaga',
		success: 'Gotowe'
	},
	common: {
		email: 'E-mail',
		password: 'Hasło',
		showPassword: 'Pokaż',
		hidePassword: 'Ukryj',
		backToSignIn: 'Wróć do logowania',
		unexpectedError: 'Coś poszło nie tak. Spróbuj ponownie za chwilę.'
	},
	validation: {
		emailRequired: 'Wpisz adres e-mail.',
		emailInvalid: 'Wpisz pełny adres e-mail, np. anna@przyklad.pl.',
		passwordRequired: 'Wpisz hasło.',
		passwordTooShort: (min: number, length: number) =>
			`Hasło ma ${length} ${plural(length, 'znak', 'znaki', 'znaków')}. Potrzeba co najmniej ${min}.`,
		passwordHint: (min: number) => `Co najmniej ${min} znaków.`
	},
	authErrors: {
		invalidCredentials: 'Nieprawidłowy e-mail lub hasło. Sprawdź oba pola albo zresetuj hasło.',
		emailNotConfirmed:
			'Adres e-mail nie jest jeszcze potwierdzony. Kliknij link z wiadomości, którą wysłaliśmy po rejestracji.',
		weakPassword: 'Hasło jest za słabe. Użyj dłuższego hasła, najlepiej z cyframi i znakami.',
		samePassword: 'Nowe hasło musi być inne niż obecne.',
		rateLimited: 'Za dużo prób w krótkim czasie. Odczekaj chwilę i spróbuj ponownie.',
		emailRateLimited:
			'Wysłaliśmy już kilka wiadomości. Odczekaj chwilę, zanim poprosisz o kolejną.',
		network: 'Brak połączenia z serwerem. Sprawdź internet i spróbuj ponownie.'
	},
	artwork: {
		credit: 'Wikimedia Commons, domena publiczna'
	},
	signIn: {
		title: 'Zaloguj się',
		lead: 'Wróć do swojej kolekcji i powtórek.',
		forgotPassword: 'Nie pamiętasz hasła?',
		submit: 'Zaloguj się',
		submitting: 'Logowanie…',
		errorTitle: 'Nie udało się zalogować',
		noAccount: 'Nie masz jeszcze konta?',
		toSignUp: 'Załóż konto'
	},
	signUp: {
		title: 'Załóż konto',
		lead: 'Zacznij budować własną bazę dzieł sztuki.',
		submit: 'Załóż konto',
		submitting: 'Zakładanie konta…',
		errorTitle: 'Nie udało się założyć konta',
		haveAccount: 'Masz już konto?',
		toSignIn: 'Zaloguj się'
	},
	checkEmail: {
		title: 'Sprawdź skrzynkę',
		lead: 'Ostatni krok przed pierwszym dziełem w kolekcji.',
		sentTitle: 'Wysłaliśmy link',
		sent: (email: string) => `Na adres ${email}. Kliknij go, żeby potwierdzić konto.`,
		sentNoEmail: 'Kliknij link z wiadomości, żeby potwierdzić konto.',
		notReceived: 'Nic nie przyszło? Zajrzyj do spamu albo wyślij link ponownie.',
		resend: 'Wyślij link ponownie',
		resending: 'Wysyłanie…',
		resent: 'Wysłaliśmy nowy link.'
	},
	forgotPassword: {
		title: 'Nie pamiętasz hasła?',
		lead: 'Podaj e-mail konta. Wyślemy link do ustawienia nowego hasła.',
		submit: 'Wyślij link',
		submitting: 'Wysyłanie…',
		sentTitle: 'Sprawdź skrzynkę',
		sent: (email: string) =>
			`Jeśli konto ${email} istnieje, wysłaliśmy na nie link do ustawienia nowego hasła.`,
		errorTitle: 'Nie udało się wysłać linku'
	},
	updatePassword: {
		title: 'Ustaw nowe hasło',
		lead: 'Wpisz nowe hasło do swojego konta.',
		newPassword: 'Nowe hasło',
		submit: 'Zapisz hasło',
		submitting: 'Zapisywanie…',
		errorTitle: 'Nie udało się zapisać hasła',
		expiredTitle: 'Link wygasł',
		expired: 'Ten link do zmiany hasła jest nieważny albo został już użyty. Poproś o nowy.',
		requestNew: 'Wyślij nowy link'
	},
	home: {
		title: 'Moja kolekcja',
		signedInAs: (email: string) => `Zalogowano jako ${email}.`,
		placeholder: 'Tu pojawi się Twoja kolekcja dzieł sztuki.',
		signOut: 'Wyloguj się'
	}
};

function plural(count: number, one: string, few: string, many: string) {
	if (count === 1) return one;
	const lastDigit = count % 10;
	const lastTwo = count % 100;
	if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) return few;
	return many;
}
