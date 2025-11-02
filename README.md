# HiddenCanvas

A React web application for image steganography based on the chaos-based algorithm described in the paper "A cycling chaos-based cryptic-free algorithm for image steganography".

## Features

- **Encode Messages**: Hide secret messages inside images using chaos-based steganography
- **Decode Messages**: Extract hidden messages from encoded images
- **Modern UI**: Beautiful, responsive user interface
- **Secure**: Uses chaos-based pseudorandom number generation for secure embedding
- **Client-Side Only**: All processing happens in the browser - no data is sent to any server

## Algorithm Overview

HiddenCanvas implements a chaos-based steganography algorithm that:

1. **Chaos-Based PRNG**: Uses a cycling chaos function (logistic map) to generate seeds for a pseudorandom number generator
2. **Secure Positioning**: The PRNG determines pixel positions and color channels (R, G, B) where data is embedded
3. **LSB Steganography**: Embeds data in the least significant bit of selected pixels
4. **High Capacity**: Supports embedding messages of various lengths while maintaining image quality

### Key Components

- **Cycling Chaos Function**: Generates initial seed from secret key using logistic map iterations
- **PRNG**: Pseudorandom number generator based on chaotic dynamics
- **Pixel Sequence Generation**: Creates unique sequence of pixel positions for embedding/extraction
- **LSB Embedding**: Modifies least significant bits to store message data

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd PixelCloakApp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Encoding a Message

1. Click on "Encode Message" tab
2. Upload an image by clicking or dragging it to the upload area
3. Enter a secret key (remember this key - you'll need it to decode)
4. Enter the message you want to hide
5. Click "Encode Message"
6. Download the encoded image

### Decoding a Message

1. Click on "Decode Message" tab
2. Upload the encoded image
3. Enter the same secret key used for encoding
4. Click "Decode Message"
5. View the extracted message

## Technical Details

### Chaos-Based PRNG

The algorithm uses a logistic map for chaos-based pseudorandom number generation:

```
x_{n+1} = r * x_n * (1 - x_n)
```

where `r = 3.9` and the initial seed is generated from the secret key using a cycling chaos function.

### Message Format

- **Header**: 32 bits indicating message length
- **Body**: Binary representation of the message (16 bits per character for Unicode support)

### Pixel Selection

The PRNG generates a unique sequence of pixel positions `(x, y, channel)` where:
- `x`: X coordinate (0 to width-1)
- `y`: Y coordinate (0 to height-1)
- `channel`: Color channel (0=R, 1=G, 2=B)

## Browser Compatibility

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.

## License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.

## References

- Paper: "A cycling chaos-based cryptic-free algorithm for image steganography"
- Algorithm implementation based on chaos theory and LSB steganography techniques

## Security Notes

- Always use strong, unique keys for encoding messages
- The security relies on the secret key - keep it secure
- This implementation is for educational and demonstration purposes
- For production use, consider additional security measures

