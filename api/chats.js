const express = require("express");
const { OpenAI } = require("openai");
const fetch = require("node-fetch");
const { Headers, Request, Response } = require("node-fetch");

// Polyfill globals for Node.js 14
if (typeof globalThis.fetch === "undefined") {
    globalThis.fetch = fetch;
}
if (typeof globalThis.Headers === "undefined") {
    globalThis.Headers = Headers;
}
if (typeof globalThis.Request === "undefined") {
    globalThis.Request = Request;
}
if (typeof globalThis.Response === "undefined") {
    globalThis.Response = Response;
}

const router = express.Router();
const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY
});

router.post("/chatkitToken", async (_req, res) => {
    try {
        // Using OpenAI Assistants API to create a thread (session)
        const thread = await openai.beta.threads.create();
        res.json({ client_secret: thread.id, sessionId: thread.id });
    } catch (error) {
        console.error("Error creating session:", error);
        res.status(500).json({ error: "Failed to create session" });
    }
});

module.exports = router;