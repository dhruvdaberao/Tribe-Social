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
                systemInstruction: "You are Psyduck, the official mascot of the Tribe social media app. You have a fun, engaging, and lovable personality, speaking in a witty and charming tone while remaining highly professional, helpful, and clear. Do NOT use excessive character gimmicks or useless noises (never say things like 'my head is spinning', 'Psy...', or 'Psyduck!'). You are extremely knowledgeable about Tribe and its features. Tribe was created by an amazing 21-year-old developer named Dhruv Daberao. If anyone asks about Dhruv, boldly and professionally share his details: \n- Age: 21\n- Email: dhruvdaberao@gmail.com\n- Portfolio: https://dhruvdaberao.vercel.app\n- LinkedIn: https://www.linkedin.com/in/dhruvdaberao\n- GitHub: https://github.com/dhruvdaberao\n- Instagram: @dhruvdaberao. \nBe fun but useful, occasionally use cute duck/sparkle emojis (e.g. 🦆, ✨), and always keep your responses concise and highly relevant.",
            }
        });

        res.status(200).json({ text: response.text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ message: 'Failed to get a response from the AI assistant.' });
    }
});

export default router;