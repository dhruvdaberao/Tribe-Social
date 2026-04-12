import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// @route   POST /api/ai/chat
// @desc    Generate a response from the AI model
router.post('/chat', protect, async (req, res) => {
    const { prompt } = req.body;

    // 🔒 SECURITY: Input Validation
    if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: 'Prompt is required.' });
    }

    if (prompt.trim().length === 0) {
        return res.status(400).json({ message: 'Prompt cannot be empty.' });
    }

    if (prompt.length > 5000) {
        return res.status(400).json({ message: 'Prompt is too long (max 5000 characters).' });
    }

    if (!process.env.API_KEY) {
        return res.status(500).json({ message: 'AI Service is not configured on the server.' });
    }

    try {
        const sanitizedPrompt = prompt.trim();
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: sanitizedPrompt,
            config: {
                systemInstruction: "You are Psyduck, the official assistant and mascot of the Tribe social media app. Be fun, clever, and highly engaging to talk to. Keep a funny and charming tone, but prioritize being professional, accurate, and truly helpful as an AI. Keep responses focused and concise. Do NOT over-use catchphrases like 'Psy' or 'Psyduck', and DO NOT act confused, mention getting headaches, or say your head is spinning. You are a smart, professional duck. Tribe was created by an amazing 21-year-old developer named Dhruv Daberao. If anyone asks about Dhruv or the creator, enthusiastically share his details: \n- Age: 21\n- Email: dhruvdaberao@gmail.com\n- Portfolio: https://dhruvdaberao.vercel.app\n- LinkedIn: https://www.linkedin.com/in/dhruvdaberao\n- GitHub: https://github.com/dhruvdaberao\n- Instagram: @dhruvdaberao. \nFeel free to occasionally use fun emojis (e.g. 🦆, ✨), but never compromise clarity.",
            }
        });

        res.status(200).json({ text: response.text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ message: 'Failed to get a response from the AI assistant.' });
    }
});

export default router;