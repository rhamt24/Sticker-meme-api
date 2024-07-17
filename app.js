const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const path = require('path');
const crypto = require('crypto');
const app = express();
const port = 3000;

// Daftarkan font Bebas Neue
registerFont(path.join(__dirname, 'fonts', 'BebasNeue-Bold.ttf'), { family: 'BebasNeue' });

const images = new Map();

async function createMeme(imageUrl, topText, bottomText) {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const image = await loadImage(Buffer.from(response.data, 'binary'));

    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    ctx.drawImage(image, 0, 0, image.width, image.height);

    ctx.font = '48px "BebasNeue"';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 8;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    const wrapText = (text, y) => {
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            ctx.strokeText(line, image.width / 2, y + index * 50);
            ctx.fillText(line, image.width / 2, y + index * 50);
        });
    };

    if (topText) {
        wrapText(topText, 10);
    }

    if (bottomText) {
        ctx.textBaseline = 'bottom';
        wrapText(bottomText, image.height - 10 - 48);
    }

    return canvas.toBuffer();
}

app.get('/meme', async (req, res) => {
    const { url, text } = req.query;
    const [topText, bottomText] = text.split('|');

    if (!url || !text) {
        return res.status(400).json({ error: 'Missing url or text query parameter' });
    }

    try {
        const memeBuffer = await createMeme(url, topText, bottomText);
        const memeId = crypto.randomBytes(16).toString('hex');
        images.set(memeId, memeBuffer);

        const memeUrl = `${req.protocol}://${req.get('host')}/image/${memeId}`;
        res.json({ memeUrl });
    } catch (error) {
        res.status(500).json({ error: 'Something went wrong' });
    }
});

app.get('/image/:id', (req, res) => {
    const memeBuffer = images.get(req.params.id);

    if (memeBuffer) {
        res.set('Content-Type', 'image/png');
        res.send(memeBuffer);
    } else {
        res.status(404).json({ error: 'Image not found' });
    }
});

app.listen(port, () => {
    console.log(`Meme generator API listening at http://localhost:${port}`);
});
        
