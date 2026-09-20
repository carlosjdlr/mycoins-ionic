import { useState } from 'react';
import {
	IonContent,
	IonPage,
	IonInput,
	IonButton,
	IonText,
	IonSpinner,
	IonHeader,
	IonToolbar,
	IonTitle,
} from '@ionic/react';
import { mobileLogin, ApiError, API_BASE_URL } from '../services/api';
import { saveSessionToken } from '../services/storage';

type LoginPageProps = {
	onLoggedIn: () => void;
};

const LoginPage = ({ onLoggedIn }: LoginPageProps): JSX.Element => {
	const [username, setUsername] = useState('estudiante');
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (): Promise<void> => {
		setError(null);

		if (!username || !password) {
			setError('Ingresa usuario y contraseña.');
			return;
		}

		setLoading(true);
		try {
			const sessionToken = await mobileLogin(username, password);
			await saveSessionToken(sessionToken);
			onLoggedIn();
		} catch (err) {
			if (err instanceof ApiError) {
				setError(err.message);
			} else {
				setError('No se pudo conectar con el backend. Revisa la URL de la API y tu conexión.');
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<IonPage>
			<IonHeader>
				<IonToolbar>
					<IonTitle>MyCoins</IonTitle>
				</IonToolbar>
			</IonHeader>
			<IonContent className="ion-padding" style={{ '--background': '#f4f7f5' }}>
				<div style={{ margin: '2.5rem auto 0', maxWidth: '440px' }}>
					<div style={{ background: '#18332f', borderRadius: '20px 20px 0 0', color: '#fff', padding: '1.5rem 1.35rem 1.7rem' }}>
						<p style={{ color: '#b9f4d5', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.14em', margin: 0, textTransform: 'uppercase' }}>Espacio personal</p>
						<h1 style={{ fontSize: '2rem', margin: '0.5rem 0 0.35rem' }}>Tu dinero, más claro.</h1>
						<p style={{ color: '#d2e3dc', lineHeight: 1.5, margin: 0 }}>Organiza tus cuentas y entiende tus movimientos desde un solo lugar.</p>
					</div>
					<div style={{ background: '#fff', borderRadius: '0 0 20px 20px', boxShadow: '0 12px 30px rgba(24, 51, 47, .08)', padding: '1.35rem' }}>
					<IonText color="medium">
						<p style={{ fontSize: '0.85rem', margin: '0 0 1.1rem' }}>Inicia sesión para ver tu resumen financiero.</p>
					</IonText>

					<IonInput
						label="Usuario"
						labelPlacement="stacked"
						fill="outline"
						value={username}
						onIonInput={(e) => setUsername(e.detail.value ?? '')}
						autocomplete="username"
						style={{ marginBottom: '0.85rem' }}
					/>

					<IonInput
						label="Contraseña"
						labelPlacement="stacked"
						fill="outline"
						type="password"
						value={password}
						onIonInput={(e) => setPassword(e.detail.value ?? '')}
						autocomplete="current-password"
						style={{ marginBottom: '0.85rem' }}
					/>

					{error && (
						<div style={{ background: '#fff1ed', borderRadius: '8px', color: '#a44835', fontSize: '0.85rem', marginBottom: '0.85rem', padding: '0.75rem' }}>{error}</div>
					)}

					<IonButton expand="block" shape="round" onClick={handleSubmit} disabled={loading}>
						{loading ? <IonSpinner name="dots" /> : 'Iniciar sesión'}
					</IonButton>
					<p style={{ color: '#8a9691', fontSize: '0.72rem', margin: '1rem 0 0', textAlign: 'center' }}>Conectado a MyCoins · {API_BASE_URL.replace('http://127.0.0.1:3000', 'servidor local')}</p>
					</div>
				</div>
			</IonContent>
		</IonPage>
	);
};

export default LoginPage;
