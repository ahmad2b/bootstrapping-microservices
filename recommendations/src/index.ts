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
		'Please specify the databse host using environment variable DBHOST.'
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

const PORT = process.env.PORT;
const DBHOST = process.env.DBHOST;
const DBNAME = process.env.DBNAME;
const RABBIT = process.env.RABBIT;

async function main() {
	const app = express();

	app.use(express.json());

	const client = await mongodb.MongoClient.connect(DBHOST);
	const db = client.db(DBNAME);

	const videoCollection = db.collection('videos');

	const messagingConnection = await amqp.connect(RABBIT);

	const messageChannel = await messagingConnection.createChannel();

	async function consumeViewedMessage(msg: amqp.ConsumeMessage | null) {
		if (msg === null) {
			console.log('No message returned');
			return;
		}

		const parsedMsg = JSON.parse(msg.content.toString());

		console.log(`Received message from "viewed" queue:`);
		console.log(JSON.stringify(parsedMsg, null, 4));

		console.log('Acknowledging message was handled');

		messageChannel.ack(msg);
	}

	await messageChannel.assertExchange('viewed', 'fanout');

	const { queue } = await messageChannel.assertQueue('', { exclusive: true });

	console.log(`Created queue ${queue}, binding it to  "viewed" exchange`);

	await messageChannel.bindQueue(queue, 'viewed', '');

	await messageChannel.consume(queue, consumeViewedMessage);

	app.listen(PORT, () => {
		console.log(`Microservice online.`);
	});
}

main().catch((err) => {
	console.error('Microservice failed to start');
	console.error((err && err.stack) || err);
	process.exit(1);
});
