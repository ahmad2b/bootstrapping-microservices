import express from 'express';
import http from 'http';

const app = express();

if (!process.env.PORT) {
	throw new Error(
		'Please specify the port number for the HTTP server with the environment variable PORT.'
	);
}

if (!process.env.VIDEO_STORAGE_HOST) {
	throw new Error(
		'Please specify the host name for the video storage microservice in variable VIDEO_STORAGE_HOST.'
	);
}

if (!process.env.VIDEO_STORAGE_PORT) {
	throw new Error(
		'Please specify the port number for the video storage microservice in variable VIDEO_STORAGE_PORT.'
	);
}

const PORT = process.env.PORT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);

console.log(
	`Forwarding video requests to ${VIDEO_STORAGE_HOST}:${VIDEO_STORAGE_PORT}.`
);

app.get('/video', async (req, res) => {
	const forwardRequest = http.request(
		{
			hostname: VIDEO_STORAGE_HOST,
			port: VIDEO_STORAGE_PORT,
			path: '/video?path=video.mp4',
			method: 'GET',
			headers: req.headers,
		},
		(forwardResponse) => {
			const statusCode = forwardResponse.statusCode ?? 502; // Using 502 as a generic "Bad Gateway" error
			res.writeHead(statusCode, forwardResponse.headers);
			forwardResponse.pipe(res);
		}
	);

	req.pipe(forwardRequest);
});

app.listen(PORT, () => {
	console.log(`Video Streaming service is online`);
});
