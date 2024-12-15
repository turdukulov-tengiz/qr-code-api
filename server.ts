const express = require('express');
const fs = require('fs');
const sharp = require('sharp');
const {
  QRCodeStyling,
} = require('qr-code-styling/lib/qr-code-styling.common.js');
const nodeCanvas = require('canvas');
const { JSDOM } = require('jsdom');
const path = require('path');

const app = express();
const PORT = 3000;

const imagePath = path.resolve(__dirname, 'logo.png');
const imageBase64 = fs.existsSync(imagePath)
  ? `data:image/png;base64,${fs.readFileSync(imagePath).toString('base64')}`
  : null;

app.use(express.json());

app.post('/generate-qr', async (req, res) => {
  const {
    url,
    img,
    width,
    height,
    dotsColor,
    dotsType,
    cornerSquareColor,
    cornerSquareType,
    cornerDotsColor,
    cornerDotsType,
    bgColor,
    margin,
    outerMargin,
    cropSize
  } = req.body;

  const defaultOptions = {
    width: width,
    height: height,
    image: img,
    dotsOptions: {
      color: dotsColor,
      type: dotsType,
    },
    cornersSquareOptions: {
      color: cornerSquareColor,
      type: cornerSquareType,
    },
    cornersDotOptions: {
      color: cornerDotsColor,
      type: cornerDotsType,
    },
    backgroundOptions: {
      color: bgColor,
    },
  };

  if (!url) {
    return res
      .status(400)
      .json({ error: 'Please provide a URL in the request body' });
  }

  try {
    const qrCode = new QRCodeStyling({
      jsdom: JSDOM,
      nodeCanvas,
      type: 'svg',
      data: url,
      margin: outerMargin,
      ...defaultOptions,
      imageOptions: {
        saveAsBlob: true,
        crossOrigin: 'anonymous',
        margin: margin,
        hideBackgroundDots: true,
      },
    });

    const svgBuffer = await qrCode.getRawData('svg');

    const pngBuffer = await sharp(svgBuffer).extract({ width: width - cropSize * 2, height: height - cropSize * 2, left: cropSize, top: cropSize }).png().toBuffer();

    const pngBase64 = pngBuffer.toString('base64');

    res.json({ image: `${pngBase64}` });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

app.listen(PORT, () => {
  console.log(`QR Code API is running`);
});
