import serverless from 'serverless-http';
import express from 'express';
import { APIGatewayProxyEvent, Context } from 'aws-lambda';

const app = express();

app.get('/', (req, res, next) => res.status(200).json({
  message: 'Hello from root!',
}));

app.get('/hello', (req, res, next) => res.status(200).json({
  message: 'Hello from path!',
}));

app.use((req, res, next) => res.status(404).json({
  error: 'Not Found',
}));

const serverlessHandler = serverless(app);

export async function handler(event: APIGatewayProxyEvent, context: Context) {
  // To fix the `Cannot GET null` issue.
  // eslint-disable-next-line no-param-reassign
  event.path = event.path === '' ? '/' : event.path;

  return await serverlessHandler(event, context);
}

export { handler as default };
