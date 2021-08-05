"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.handler = void 0;
const serverless_http_1 = __importDefault(require("serverless-http"));
const express_1 = __importDefault(require("express"));
const app = express_1.default();
app.get('/', (req, res, next) => res.status(200).json({
    message: 'Hello from root!',
}));
app.get('/hello', (req, res, next) => res.status(200).json({
    message: 'Hello from path!',
}));
app.use((req, res, next) => res.status(404).json({
    error: 'Not Found',
}));
const serverlessHandler = serverless_http_1.default(app);
async function handler(event, context) {
    // To fix the `Cannot GET null` issue.
    // eslint-disable-next-line no-param-reassign
    event.path = event.path === '' ? '/' : event.path;
    return await serverlessHandler(event, context);
}
exports.handler = handler;
exports.default = handler;
