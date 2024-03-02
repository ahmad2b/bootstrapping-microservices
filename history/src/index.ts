import express from 'express';

if (!process.env.PORT) {
	throw new Error(
		'Please specify the port number for the HTTP server with the environment variable PORT.'
	);
}

const PORT = process.env.PORT;

async function main() {
	console.log('Starting history service...');
	const app = express();

	app.listen(PORT, () => {
		console.log(`History service is online!`, { port: PORT });
	});

	app.get('/history', (req, res) => {
		res.json({ message: 'Hello World!' });
	});
}

main().catch((err) => {
	console.error('History service failed to start');
	console.error((err && err.stack) || err);
	process.exit(1);
});
