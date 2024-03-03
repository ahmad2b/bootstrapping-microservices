import amqp from 'amqplib';
import express from 'express';
import fs from 'fs';

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

if (!process.env.DBHOST) {
	throw new Error(
		'Please specify the host name for the database in variable DBHOST.'
	);
}

if (!process.env.DBNAME) {
	throw new Error('Please specify the database name in variable DBNAME.');
}

if (!process.env.RABBIT) {
	throw new Error(
		'Please specify the name of the RabbitMQ host using environment variable RABBIT'
	);
}

const PORT = process.env.PORT;
const RABBIT = process.env.RABBIT;
const VIDEO_STORAGE_HOST = process.env.VIDEO_STORAGE_HOST;
const VIDEO_STORAGE_PORT = parseInt(process.env.VIDEO_STORAGE_PORT);
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;

// console.log(
// 	`Forwarding video requests to ${VIDEO_STORAGE_HOST}:${VIDEO_STORAGE_PORT}.`
// );

const sendViewedMessage = (videoPath: string, messageChannel: amqp.Channel) => {
	console.log(`Publishing message on "viewed" queue.`);
	const msg = { videoPath: videoPath };
	const jsonMsg = JSON.stringify(msg);
	messageChannel.publish('', 'viewed', Buffer.from(jsonMsg)); // Publishes message to the "viewed" queue.

	// const postOptions = {
	// 	method: 'POST',
	// 	headers: { 'Content-Type': 'application/json' },
	// };

	// const requestBody = {
	// 	videoPath,
	// };

	// const req = http.request(`http://history/viewed`, postOptions);

	// req.on('close', () => {
	// 	console.log('Sent "viewed" message to history microservice');
	// });

	// req.on('error', (err) => {
	// 	console.error('Failed to send "viewed" message to history microservice');
	// 	console.error((err && err.stack) || err);
	// });

	// req.write(JSON.stringify(requestBody));
	// req.end();
};

async function main() {
	console.log(`Connecting to RabbitMQ server at ${RABBIT}.`);

	const messagingConnection = await amqp.connect(RABBIT); // Connects to the RabbitMQ server.
	console.log('Connected to RabbitMQ.');

	const messageChannel = await messagingConnection.createChannel(); // Creates a RabbitMQ messaging channel.

	// const client = await MongoClient.connect(DBHOST);
	// const db = client.db(DBNAME);
	// const videoCollection = db.collection('videos');

	const app = express();

	app.get('/video', async (req, res) => {
		// const videoId = new mongodb.ObjectId(req.query.id as string);
		// const videoRecord = await videoCollection.findOne({ _id: videoId });

		// console.log(`Streaming video ${videoRecord?.videoPath}`);

		// if (!videoRecord) {
		// 	res.sendStatus(404);
		// 	return;
		// }

		// const forwardRequest = http.request(
		// 	{
		// 		hostname: VIDEO_STORAGE_HOST,
		// 		port: VIDEO_STORAGE_PORT,
		// 		path: `/video?path=${videoRecord.videoPath}`,
		// 		method: 'GET',
		// 		headers: req.headers,
		// 	},
		// 	(forwardResponse) => {
		// 		const statusCode = forwardResponse.statusCode ?? 502; // Using 502 as a generic "Bad Gateway" error
		// 		res.writeHead(statusCode, forwardResponse.headers);
		// 		forwardResponse.pipe(res);
		// 	}
		// );

		// req.pipe(forwardRequest);

		const videoPath = './videos/video.mp4';
		const stat = await fs.promises.stat(videoPath);

		res.writeHead(200, {
			'Content-Length': stat.size,
			'Content-Type': 'video/mp4',
		});

		fs.createReadStream(videoPath).pipe(res);

		sendViewedMessage(videoPath, messageChannel);
	});

	app.listen(PORT, () => {
		// console.log(
		// 	`Microservice listening, please load the data file db-fixture/videos.json into your database before testing this microservice.`
		// );
		console.log(`Microservice online.`);
	});
}

main().catch((err) => {
	console.error('Microservices failed to start');
	console.error((err && err.stack) || err);
});
