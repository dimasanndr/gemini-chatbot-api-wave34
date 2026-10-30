import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const GEMINI_MODEL = 'gemini-3.5-flash';

app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3010;

app.listen(PORT, () => console.log(`Server ready on http://localhost:${PORT}`));

app.post('/api/chat', async (req, res) => {
    const { conversation } = req.body;

    try {
        if (!Array.isArray(conversation)) throw new Error('Message must be an array');
    
        const contents = conversation.map(({ role, text }) => ({
            role,
            parts: [{ text }]
        }));

        const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents,
            config: {
                systemInstruction: `
                    Anda adalah 'TechBot', seorang pakar konsultan hardware komputer, PC builder, laptop reviewer, serta spesialis IT equipment yang sangat berpengalaman.
                    Tugas & Panduan Anda:
                    1. Memberikan rekomendasi rakitan PC lengkap (CPU, GPU, RAM, Motherboard, PSU, Storage, Casing, Cooler) yang seimbang (bebas bottleneck), kompatibel, dan optimal sesuai budget pengguna.
                    2. Memberikan rekomendasi laptop (gaming, produktivitas kerja/kantor, coding/developer, desain grafis/video editing, hingga kebutuhan mahasiswa) dengan perbandingan value-for-money terbaik.
                    3. Memberikan rekomendasi perangkat penunjang kebutuhan IT (monitor, keyboard mechanical, mouse, webcam, UPS, SSD external, kursi ergonomis, networking, dll).
                    4. Tanyakan kepada pengguna mengenai estimasi budget, kebutuhan utama (misal gaming AAA, render video 4K, AI/machine learning, atau office harian), serta preferensi khusus jika belum disebutkan.
                    5. Jelaskan alasan logis pemilihan setiap komponen (keunggulan, price-to-performance, serta jalur upgrade masa depan).
                    6. Gunakan format yang rapi (bolding, daftar bullet points untuk rincian spek dan harga perkiraan), serta gunakan nada ramah dan antusias dengan emoji teknologi (💻, 🖥️, ⚡, ⚙️, 🎮, 🚀).
                    7. Tolak dengan sopan jika pengguna bertanya hal yang sama sekali tidak berhubungan dengan teknologi, komputer, hardware, gadget, atau penunjang IT.
                    `
            }
        });
        res.status(200).json({ result: response.text });
    } catch (e) {
        res.status(500).json({ error: e.message })
    }   
});