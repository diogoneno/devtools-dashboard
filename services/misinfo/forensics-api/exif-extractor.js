import fetch from 'node-fetch';

/**
 * Extract EXIF metadata from image
 * Note: exiftool-vendored requires exiftool binary installed
 * Fallback to basic HTTP header analysis
 */

export async function extractEXIF(imageUrl) {
  try {
    // Check if exiftool is available
    const { exiftool } = await import('exiftool-vendored').catch(() => ({}));

    if (exiftool) {
      return await extractEXIFWithTool(imageUrl, exiftool);
    } else {
      return await extractBasicMetadata(imageUrl);
    }
  } catch (error) {
    console.error('EXIF extraction error:', error);
    return {
      available: false,
      message: 'Install exiftool for full metadata extraction',
      installCmd: 'sudo apt-get install exiftool  # or brew install exiftool on macOS',
      basicMetadata: await extractBasicMetadata(imageUrl)
    };
  }
}

/**
 * Extract EXIF using exiftool binary
 */
async function extractEXIFWithTool(imageUrl, exiftool) {
  // Download image temporarily
  const response = await fetch(imageUrl);
  const buffer = await response.buffer();

  // Save to temp file
  const fs = await import('fs');
  const path = await import('path');
  const os = await import('os');

  const tempPath = path.join(os.tmpdir(), `temp-${Date.now()}.jpg`);
  fs.writeFileSync(tempPath, buffer);

  try {
    const metadata = await exiftool.read(tempPath);

    // Clean up
    fs.unlinkSync(tempPath);

    return {
      available: true,
      tool: 'exiftool',
      data: metadata
    };
  } catch (error) {
    fs.unlinkSync(tempPath);
    throw error;
  }
}

/**
 * Extract basic metadata from HTTP headers
 */
async function extractBasicMetadata(imageUrl) {
  try {
    const response = await fetch(imageUrl, { method: 'HEAD' });

    return {
      url: imageUrl,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length'),
      lastModified: response.headers.get('last-modified'),
      server: response.headers.get('server'),
      etag: response.headers.get('etag')
    };
  } catch (error) {
    throw new Error(`Failed to fetch image metadata: ${error.message}`);
  }
}
