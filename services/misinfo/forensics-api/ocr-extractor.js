import fetch from 'node-fetch';

/**
 * Extract text from image using OCR
 * Note: Requires tesseract binary installed
 * Fallback to message about installation
 */

export async function extractOCR(imageUrl) {
  try {
    // Check if tesseract is available
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    // Test if tesseract is installed
    try {
      await execAsync('tesseract --version');
    } catch (error) {
      return {
        available: false,
        text: '',
        message: 'Tesseract not installed. Install it for OCR functionality.',
        installCmd: 'sudo apt-get install tesseract-ocr  # or brew install tesseract on macOS'
      };
    }

    // Download image
    const response = await fetch(imageUrl);
    const buffer = await response.buffer();

    // Save to temp file
    const fs = await import('fs');
    const path = await import('path');
    const os = await import('os');

    const tempPath = path.join(os.tmpdir(), `temp-${Date.now()}.jpg`);
    const outputBase = path.join(os.tmpdir(), `temp-${Date.now()}`);

    fs.writeFileSync(tempPath, buffer);

    try {
      // Run tesseract
      await execAsync(`tesseract "${tempPath}" "${outputBase}"`);

      // Read output
      const textContent = fs.readFileSync(`${outputBase}.txt`, 'utf-8');

      // Clean up
      fs.unlinkSync(tempPath);
      fs.unlinkSync(`${outputBase}.txt`);

      return {
        available: true,
        text: textContent.trim(),
        tool: 'tesseract',
        length: textContent.length
      };
    } catch (error) {
      // Clean up on error
      if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
      if (fs.existsSync(`${outputBase}.txt`)) fs.unlinkSync(`${outputBase}.txt`);
      throw error;
    }
  } catch (error) {
    console.error('OCR extraction error:', error);
    return {
      available: false,
      text: '',
      error: error.message
    };
  }
}
