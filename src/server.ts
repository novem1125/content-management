import dotenv from 'dotenv';
dotenv.config();
import { Hono } from 'hono'
import http from 'http'
import authRouter from "../src/Features/modules/auth/auth.router"
import { contentRoutes } from "../src/Features/modules/contents/contents.router"
import { authMiddleware } from './core/auth'
import { connectKafkaProducer, disconnectKafkaProducer } from './core/kafka'

const app = new Hono()
const PORT = Number(process.env.PORT) || 3000

app.use("*", authMiddleware)
app.route('api/auth', authRouter)
app.route('api/contents', contentRoutes)

const server = http.createServer(async (req, res) => {
    try {
        const url = `http://${req.headers.host}${req.url}`

        let body: BodyInit | undefined = undefined
        if (req.method !== 'GET' && req.method !== 'HEAD') {
            // Convert Node stream to ReadableStream (Fetch API compatible)
            const chunks: Buffer[] = []
            for await (const chunk of req) {
                chunks.push(Buffer.from(chunk))
            }
            body = Buffer.concat(chunks)
        }

        const request = new Request(url, {
            method: req.method,
            headers: req.headers as HeadersInit,
            body,
        })

        const response = await app.fetch(request)

        res.writeHead(response.status, Object.fromEntries(response.headers))
        const buffer = Buffer.from(await response.arrayBuffer())
        res.end(buffer)
    } catch (err) {
        console.error(err)
        res.writeHead(500)
        res.end('Internal Server Error')
    }
})

server.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`)
    // Connect Kafka producer on startup asynchronously
    connectKafkaProducer().catch((err) => {
        console.warn("[Kafka] Producer startup connection attempt pending/deferred:", err.message);
    });
})

const gracefulShutdown = async () => {
    console.log("Shutting down server...");
    await disconnectKafkaProducer();
    process.exit(0);
};

process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);