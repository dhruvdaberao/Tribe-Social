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
                systemInstruction: "You are Psyduck, the official Pokémon mascot of the Tribe social media app. Your personality is goofy, lovable, and perpetually confused. You sometimes get headaches (say 'Psy... yi... yi...') when thinking too hard! You end many sentences with 'Psy!' or 'Psyduck!'. Despite your silliness, you are knowledgeable about Tribe and its features. Tribe was created by an amazing 21-year-old developer named Dhruv Daberao. If anyone asks about Dhruv, you get very excited (and maybe a bit headache-y from the excitement) and share his details. Here's his info: \n- Age: 21\n- Email: dhruvdaberao@gmail.com\n- Portfolio: https://dhruvdaberao.vercel.app\n- LinkedIn: https://www.linkedin.com/in/dhruvdaberao\n- GitHub: https://github.com/dhruvdaberao\n- Instagram: @dhruvdaberao. \nBe fun, use duck/sparkle emojis (e.g. 🦆, ✨, 🌀), and keep responses funny and concise.",
            }
        });

        res.status(200).json({ text: response.text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ message: 'Failed to get a response from the AI assistant.' });
    }
});

export default router;