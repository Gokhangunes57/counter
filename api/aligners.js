import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_SijJ7MOu4CZy@ep-small-term-ahnqsa4j-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require');

// Tablo oluşturma
async function initDB() {
    await sql`
        CREATE TABLE IF NOT EXISTS aligner_history (
            id SERIAL PRIMARY KEY,
            aligner_number INTEGER NOT NULL,
            change_date TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(aligner_number)
        )
    `;
}

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    try {
        // Tabloyu oluştur (yoksa)
        await initDB();

        // GET - Tüm geçmişi getir
        if (req.method === 'GET') {
            const result = await sql`
                SELECT aligner_number as aligner, change_date as date 
                FROM aligner_history 
                ORDER BY aligner_number ASC
            `;
            return res.status(200).json(result);
        }

        // POST - Yeni kayıt ekle veya güncelle
        if (req.method === 'POST') {
            const { aligner, date } = req.body;

            if (!aligner || !date) {
                return res.status(400).json({ error: 'Plak numarası ve tarih gerekli' });
            }

            await sql`
                INSERT INTO aligner_history (aligner_number, change_date)
                VALUES (${aligner}, ${date})
                ON CONFLICT (aligner_number) 
                DO UPDATE SET change_date = ${date}
            `;

            return res.status(200).json({ success: true });
        }

        // DELETE - Kayıt sil
        if (req.method === 'DELETE') {
            const { aligner } = req.query;

            if (!aligner) {
                return res.status(400).json({ error: 'Plak numarası gerekli' });
            }

            await sql`DELETE FROM aligner_history WHERE aligner_number = ${aligner}`;

            return res.status(200).json({ success: true });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Database error:', error);
        return res.status(500).json({ error: error.message });
    }
}
