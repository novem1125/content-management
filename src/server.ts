import dotenv from 'dotenv';
dotenv.config();
import { Hono } from 'hono'
import http from 'http'
import authRouter from "../src/Features/modules/auth/auth.router"
import { authMiddleware } from './core/auth'
const app = new Hono()
const PORT = Number(process.env.PORT) || 3000

app.use("*", authMiddleware)
app.route('api/auth', authRouter)

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

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`)
})