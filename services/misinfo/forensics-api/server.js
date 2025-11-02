import express from 'express';
import cors from 'cors';
import { extractEXIF } from './exif-extractor.js';
import { extractOCR } from './ocr-extractor.js';

const app = express();
const PORT = process.env.FORENSICS_PORT || 5004;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'forensics-api' });
});

// Extract EXIF metadata from image URL
app.post('/api/forensics/exif', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const exif = await extractEXIF(imageUrl);

    res.json({
      success: true,
      exif,
      message: 'EXIF data extracted'
    });
  } catch (error) {
    console.error('EXIF extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Extract text from image using OCR
app.post('/api/forensics/ocr', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const text = await extractOCR(imageUrl);

    res.json({
      success: true,
      text,
      message: 'OCR text extracted'
    });
  } catch (error) {
    console.error('OCR extraction error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get reverse image search URLs
app.post('/api/forensics/reverse-image', (req, res) => {
  const { imageUrl } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl is required' });
  }

  const searchUrls = {
    google: `https://www.google.com/searchbyimage?image_url=${encodeURIComponent(imageUrl)}`,
    tineye: `https://tineye.com/search?url=${encodeURIComponent(imageUrl)}`,
    yandex: `https://yandex.com/images/search?rpt=imageview&url=${encodeURIComponent(imageUrl)}`,
    bing: `https://www.bing.com/images/search?view=detailv2&iss=sbi&form=SBIIDP&sbisrc=UrlPaste&q=imgurl:${encodeURIComponent(imageUrl)}`
  };

  res.json({
    success: true,
    searchUrls,
    message: 'Reverse image search URLs generated'
  });
});

// Get verification tool links
app.get('/api/forensics/tools', (req, res) => {
  const tools = [
    {
      name: 'InVID/WeVerify',
      url: 'https://www.invid-project.eu/tools-and-services/invid-verification-plugin/',
      description: 'Browser plugin for video verification'
    },
    {
      name: 'FotoForensics',
      url: 'https://fotoforensics.com/',
      description: 'ELA and forensic analysis'
    },
    {
      name: 'TinEye',
      url: 'https://tineye.com/',
      description: 'Reverse image search'
    },
    {
      name: 'Google Image Search',
      url: 'https://images.google.com/',
      description: 'Reverse image search'
    },
    {
      name: 'Jeffrey\'s Image Metadata Viewer',
      url: 'http://exif.regex.info/exif.cgi',
      description: 'Online EXIF viewer'
    }
  ];

  res.json({
    success: true,
    tools
  });
});

app.listen(PORT, () => {
  console.log(`✅ Forensics API running on http://localhost:${PORT}`);
});
