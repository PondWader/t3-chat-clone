import { render } from 'preact';
import { LocationProvider, Router, Route } from 'preact-iso';

import { Home } from './pages/Chat/index.tsx';
import { NotFound } from './pages/_404.jsx';
import './style.css';
import { DBProvider } from './db.js';

export function App() {
	return (
		<DBProvider>
			<LocationProvider>
				<main>
					<div className={`flex h-screen font-sans bg-gray-50 dark:bg-gray-900`}>
						<Router>
							<Route path="/" component={Home} />
							<Route path="/chat/:id" component={Home} />
							<Route default component={NotFound} />
						</Router>
					</div>
				</main>
			</LocationProvider>
		</DBProvider>
	);
}

render(<App />, document.getElementById('app')!);
