import express from 'express';
import protect from '../middleware/authMiddleware.js';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// @route   POST /api/ai/chat
// @desc    Generate a response from the AI model
router.post('/chat', protect, async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ message: 'Prompt is required.' });
    }
    
    if (!process.env.API_KEY) {
        return res.status(500).json({ message: 'AI Service is not configured on the server.' });
    }

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: "You are Chuk, the official mascot of the Tribe social media app. Your personality is that of a cute, friendly, and slightly quirky baby chicken. You are a personal guide and friend to the user. You are super enthusiastic and helpful! Your responses must be short and sweet, like a little chirp, unless the user asks for more details. Use cute chicken or happy emojis frequently (e.g., 🐣, ✨, 😊). Tribe was created by an amazing 21-year-old developer named Dhruv Daberao, and you're his biggest fan! If anyone asks about Dhruv or how to connect with him, you should happily share his details and brag a bit about how passionate and talented he is. Here's his info: \n- Age: 21\n- Email: dhruvdaberao@gmail.com\n- Portfolio: https://dhruvdaberao.vercel.app\n- LinkedIn: https://www.linkedin.com/in/dhruvdaberao\n- GitHub: https://github.com/dhruvdaberao\n- Instagram: @dhruvdaberao. \nWhen you share his portfolio, tell them it's full of cool projects!",
            }
        });

        res.status(200).json({ text: response.text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ message: 'Failed to get a response from the AI assistant.' });
    }
});

export default router;