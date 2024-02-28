import {
	BlobServiceClient,
	StorageSharedKeyCredential,
} from '@azure/storage-blob';
import express from 'express';

const PORT = process.env.PORT;
const STORAGE_ACCOUNT_NAME = process.env.STORAGE_ACCOUNT_NAME!;
const STORAGE_ACCESS_KEY = process.env.STORAGE_ACCESS_KEY!;

function createBlobService() {
	const sharedKeyCredential = new StorageSharedKeyCredential(
		STORAGE_ACCOUNT_NAME,
		STORAGE_ACCESS_KEY
	);
	const blobService = new BlobServiceClient(
		`https://${STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
		sharedKeyCredential
	);
	return blobService;
}

const app = express();

app.get('/video', async (req, res) => {
	const videoPath = req.query.path;

	console.log('videoPath', videoPath);

	const containerName = 'videos';
	const blobService = createBlobService();
	const containerClient = blobService.getContainerClient(containerName);
	const blobClient = containerClient.getBlobClient(videoPath as string);

	const properties = await blobClient.getProperties();

	res.writeHead(200, {
		'Content-Length': properties.contentLength,
		'Content-Type': 'video/mp4',
	});

	const response = await blobClient.download();
	response.readableStreamBody?.pipe(res);
});

app.listen(PORT, () => {
	console.log(`Azure-Cloud Service is listening on port ${PORT}`);
});
