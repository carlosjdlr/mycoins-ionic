import { useEffect, useState } from 'react';
import { IonApp, setupIonicReact } from '@ionic/react';

import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

import LoginPage from './pages/Login';
import HomePage from './pages/Home';
import { getSessionToken } from './services/storage';

setupIonicReact();

const App = (): JSX.Element => {
	const [checkingSession, setCheckingSession] = useState(true);
	const [isLoggedIn, setIsLoggedIn] = useState(false);

	useEffect(() => {
		const check = async (): Promise<void> => {
			const token = await getSessionToken();
			setIsLoggedIn(Boolean(token));
			setCheckingSession(false);
		};
		void check();
	}, []);

	if (checkingSession) {
		return <IonApp />;
	}

	return (
		<IonApp>
			{isLoggedIn ? (
				<HomePage onLoggedOut={() => setIsLoggedIn(false)} />
			) : (
				<LoginPage onLoggedIn={() => setIsLoggedIn(true)} />
			)}
		</IonApp>
	);
};

export default App;
