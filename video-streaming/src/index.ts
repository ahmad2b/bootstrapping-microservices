import { Request, Response } from 'express';
import fs from 'fs';

import express from 'express';

const app = express();

if (!process.env.PORT) {
	throw new Error(
		'Please specify the port number for the HTTP server with the environment variable PORT.'
	);
}

const port = process.env.PORT;

app.get('/video', async (req: Request, res: Response) => {
	const videoPath = './videos/video.mp4';
	const stats = await fs.promises.stat(videoPath);

	res.writeHead(200, {
		'Content-Length': stats.size,
		'Content-Type': 'video/mp4',
	});
	fs.createReadStream(videoPath).pipe(res);
});

app.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
