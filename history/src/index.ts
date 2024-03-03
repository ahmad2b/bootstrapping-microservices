import amqp from 'amqplib';
import express from 'express';
import mongodb from 'mongodb';

if (!process.env.PORT) {
	throw new Error(
		'Please specify the port number for the HTTP server with the environment variable PORT.'
	);
}

if (!process.env.DBHOST) {
	throw new Error(
		'Please specify the database host using environment variable DBHOST.'
	);
}

if (!process.env.DBNAME) {
	throw new Error(
		'Please specify the name of the database using environment variable DBNAME'
	);
}

if (!process.env.RABBIT) {
	throw new Error(
		'Please specify the name of the RabbitMQ host using environment variable RABBIT'
	);
}

const RABBIT = process.env.RABBIT;

const PORT = process.env.PORT;
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;

async function main() {
	const app = express();
	app.use(express.json());

	const client = await mongodb.MongoClient.connect(DBHOST);
	const db = client.db(DBNAME);
	const historyCollection = db.collection('history');

	const messagingConnection = await amqp.connect(RABBIT);

	console.log('Connected to RabbitMQ');

	const messageChannel = await messagingConnection.createChannel();

	// await messageChannel.assertQueue('viewed', {});
	await messageChannel.assertExchange('viewed', 'fanout'); // Asserts that the "viewed" exchange exists.

	const { queue } = await messageChannel.assertQueue('', { exclusive: true });

	console.log(`Created queue ${queue}, binding it to "viewed" exchange.`);

	await messageChannel.bindQueue(queue, 'viewed', '');

	await messageChannel.consume('viewed', async (msg) => {
		console.log('Received "viewed" message');

		const parsedMsg = JSON.parse(msg?.content.toString() || '');

		await historyCollection.insertOne({ videoPath: parsedMsg.videoPath });

		console.log('Acknowledge message was handled');

		messageChannel.ack(msg as amqp.Message);
	});

	app.get('/history', async (req, res) => {
		const skip = parseInt(req.query.skip) || 0;
		const limit = parseInt(req.query.limit) || 20;

		const history = await historyCollection
			.find()
			.skip(skip)
			.limit(limit)
			.toArray();

		res.json({ history });
	});

	app.listen(PORT, () => {
		console.log(`Microservice online`);
	});

	app.post('/viewed', async (req, res) => {
		const videoPath = req.body.videoPath;
		await historyCollection.insertOne({ videoPath });
		res.sendStatus(200);
	});
}

main().catch((err) => {
	console.error('History service failed to start');
	console.error((err && err.stack) || err);
	process.exit(1);
});
