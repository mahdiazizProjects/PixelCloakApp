/**
 * Chaos-based Steganography Service
 * Implements the cycling chaos-based algorithm for image steganography
 */

class ChaosPRNG {
  /**
   * Initialize the PRNG with chaos-based seed generation
   * @param {string} key - Secret key for seed generation
   * @param {number} width - Image width
   * @param {number} height - Image height
   */
  constructor(key, width, height) {
    this.key = key;
    this.width = width;
    this.height = height;
    this.totalPixels = width * height;
    
    // Generate initial seed from key using cycling chaos function
    this.seed = this.generateSeed(key);
    this.state = this.seed;
  }

  /**
   * Cycling chaos function to generate seed
   * Uses logistic map with cycling parameters
   * @param {string} key - Secret key
   * @returns {number} Seed value between 0 and 1
   */
  generateSeed(key) {
    let value = 0;
    // Convert key to numeric value
    for (let i = 0; i < key.length; i++) {
      value += key.charCodeAt(i);
      value = (value * 17) % 1000;
    }
    
    // Normalize to 0-1 range
    value = value / 1000;
    
    // Ensure value is in valid range for logistic map (0 < x < 1)
    if (value <= 0 || value >= 1) {
      value = 0.5;
    }
    
    // Cycling chaos: logistic map iterations
    const r = 3.9; // Chaos parameter
    for (let i = 0; i < 100; i++) {
      value = r * value * (1 - value);
    }
    
    return value;
  }

  /**
   * Generate next pseudorandom number using chaos-based PRNG
   * @returns {number} Random number between 0 and 1
   */
  next() {
    // Logistic map for chaos-based PRNG
    const r = 3.9;
    this.state = r * this.state * (1 - this.state);
    
    // Ensure state stays in valid range
    if (this.state <= 0 || this.state >= 1) {
      this.state = 0.5;
    }
    
    return this.state;
  }

  /**
   * Get next random integer in range [0, max)
   * @param {number} max - Maximum value (exclusive)
   * @returns {number} Random integer
   */
  nextInt(max) {
    return Math.floor(this.next() * max);
  }

  /**
   * Generate sequence of pixel positions using PRNG
   * @param {number} count - Number of positions to generate
   * @returns {Array<{x: number, y: number, channel: number}>} Array of pixel positions
   */
  generatePixelSequence(count) {
    const sequence = [];
    const usedPositions = new Set();
    
    for (let i = 0; i < count; i++) {
      let x, y, channel, positionKey;
      
      // Generate unique position
      do {
        x = this.nextInt(this.width);
        y = this.nextInt(this.height);
        channel = this.nextInt(3); // 0: R, 1: G, 2: B
        positionKey = `${x},${y},${channel}`;
      } while (usedPositions.has(positionKey));
      
      usedPositions.add(positionKey);
      sequence.push({ x, y, channel });
    }
    
    return sequence;
  }
}

class SteganographyService {
  /**
   * Encode message into image using chaos-based algorithm
   * @param {ImageData} imageData - Image data from canvas
   * @param {string} message - Message to hide
   * @param {string} key - Secret key for encryption
   * @returns {ImageData} Modified image data with hidden message
   */
  encode(imageData, message, key) {
    const { data, width, height } = imageData;
    const prng = new ChaosPRNG(key, width, height);
    
    // Convert message to binary string
    const messageBinary = this.stringToBinary(message);
    const messageLength = messageBinary.length;
    
    // Add length header (32 bits)
    const lengthBinary = messageLength.toString(2).padStart(32, '0');
    const fullBinary = lengthBinary + messageBinary;
    const totalBits = fullBinary.length;
    
    // Generate pixel sequence for embedding
    const pixelSequence = prng.generatePixelSequence(totalBits);
    
    // Embed data
    const newData = new Uint8ClampedArray(data);
    
    for (let i = 0; i < totalBits; i++) {
      const { x, y, channel } = pixelSequence[i];
      const pixelIndex = (y * width + x) * 4;
      const bit = parseInt(fullBinary[i]);
      
      // LSB (Least Significant Bit) steganography
      const currentValue = newData[pixelIndex + channel];
      const newValue = (currentValue & 0xFE) | bit; // Clear LSB, set to message bit
      newData[pixelIndex + channel] = newValue;
    }
    
    return new ImageData(newData, width, height);
  }

  /**
   * Decode message from image using chaos-based algorithm
   * @param {ImageData} imageData - Image data from canvas
   * @param {string} key - Secret key for decryption
   * @returns {string} Extracted message or null if failed
   */
  decode(imageData, key) {
    const { data, width, height } = imageData;
    const prng = new ChaosPRNG(key, width, height);
    
    try {
      // First, extract message length (32 bits)
      const lengthSequence = prng.generatePixelSequence(32);
      let lengthBinary = '';
      
      for (const { x, y, channel } of lengthSequence) {
        const pixelIndex = (y * width + x) * 4;
        const bit = data[pixelIndex + channel] & 0x01; // Extract LSB
        lengthBinary += bit.toString();
      }
      
      const messageLength = parseInt(lengthBinary, 2);
      
      if (messageLength <= 0 || messageLength > width * height * 3) {
        throw new Error('Invalid message length');
      }
      
      // Generate pixel sequence for message extraction
      const messageSequence = prng.generatePixelSequence(messageLength);
      let messageBinary = '';
      
      for (const { x, y, channel } of messageSequence) {
        const pixelIndex = (y * width + x) * 4;
        const bit = data[pixelIndex + channel] & 0x01; // Extract LSB
        messageBinary += bit.toString();
      }
      
      // Convert binary to string
      const message = this.binaryToString(messageBinary);
      
      return message;
    } catch (error) {
      console.error('Decoding error:', error);
      return null;
    }
  }

  /**
   * Convert string to binary representation
   * @param {string} str - Input string
   * @returns {string} Binary string
   */
  stringToBinary(str) {
    let binary = '';
    for (let i = 0; i < str.length; i++) {
      const charCode = str.charCodeAt(i);
      // Use 16 bits per character to support Unicode
      binary += charCode.toString(2).padStart(16, '0');
    }
    return binary;
  }

  /**
   * Convert binary string to original string
   * @param {string} binary - Binary string
   * @returns {string} Original string
   */
  binaryToString(binary) {
    let str = '';
    for (let i = 0; i < binary.length; i += 16) {
      const charCode = parseInt(binary.substr(i, 16), 2);
      str += String.fromCharCode(charCode);
    }
    return str;
  }

  /**
   * Load image from file and return ImageData
   * @param {File} file - Image file
   * @returns {Promise<ImageData>} Image data
   */
  async loadImageData(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(imageData);
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  /**
   * Convert ImageData to blob for download
   * @param {ImageData} imageData - Image data
   * @returns {Promise<Blob>} Image blob
   */
  async imageDataToBlob(imageData) {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      ctx.putImageData(imageData, 0, 0);
      
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  }
}

export default new SteganographyService();

