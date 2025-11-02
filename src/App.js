import React, { useState, useRef } from 'react';
import './App.css';
import steganographyService from './services/steganographyService';

function App() {
  const [activeTab, setActiveTab] = useState('encode');
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [message, setMessage] = useState('');
  const [key, setKey] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setResult(null);
      setError(null);
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('dragover');
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('dragover');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('dragover');
    
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setImageUrl(url);
      setResult(null);
      setError(null);
      
      // Update file input
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      fileInputRef.current.files = dataTransfer.files;
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleEncode = async () => {
    if (!image) {
      setError('Please select an image');
      return;
    }
    
    if (!message.trim()) {
      setError('Please enter a message to hide');
      return;
    }
    
    if (!key.trim()) {
      setError('Please enter a secret key');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Load image data
      const imageData = await steganographyService.loadImageData(image);
      
      // Encode message
      const encodedData = steganographyService.encode(imageData, message, key);
      
      // Convert to blob and create download URL
      const blob = await steganographyService.imageDataToBlob(encodedData);
      const url = URL.createObjectURL(blob);
      
      setResult({
        type: 'encoded',
        url: url,
        blob: blob
      });
    } catch (err) {
      setError('Encoding failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecode = async () => {
    if (!image) {
      setError('Please select an image');
      return;
    }
    
    if (!key.trim()) {
      setError('Please enter the secret key');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Load image data
      const imageData = await steganographyService.loadImageData(image);
      
      // Decode message
      const decodedMessage = steganographyService.decode(imageData, key);
      
      if (decodedMessage === null) {
        setError('Failed to decode message. Please check your key and image.');
      } else {
        setResult({
          type: 'decoded',
          message: decodedMessage
        });
      }
    } catch (err) {
      setError('Decoding failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (result && result.blob) {
      const url = result.url;
      const link = document.createElement('a');
      link.href = url;
      link.download = 'hidden_image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleReset = () => {
    setImage(null);
    setImageUrl(null);
    setMessage('');
    setKey('');
    setResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (result && result.url) {
      URL.revokeObjectURL(result.url);
    }
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>HiddenCanvas</h1>
        <p>Chaos-based Image Steganography</p>
      </div>

      <div className="main-container">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'encode' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('encode');
              setResult(null);
              setError(null);
            }}
          >
            Encode Message
          </button>
          <button
            className={`tab ${activeTab === 'decode' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('decode');
              setResult(null);
              setError(null);
            }}
          >
            Decode Message
          </button>
        </div>

        <div className="tab-content">
          <div className="upload-section">
            <div
              className="upload-area"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="upload-icon">📷</div>
              <div className="upload-text">
                {image ? (
                  <strong>{image.name}</strong>
                ) : (
                  <>
                    <strong>Click or drag</strong> an image here to upload
                  </>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="file-input"
            />
            {imageUrl && (
              <div className="image-preview">
                <img src={imageUrl} alt="Preview" />
              </div>
            )}
          </div>

          <div className="input-section">
            <label htmlFor="key">Secret Key</label>
            <input
              id="key"
              type="text"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter a secret key (same key needed for decoding)"
            />
          </div>

          {activeTab === 'encode' && (
            <div className="input-section">
              <label htmlFor="message">Message to Hide</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter the secret message you want to hide in the image"
                rows="4"
              />
            </div>
          )}

          {loading ? (
            <div className="loading">Processing</div>
          ) : (
            <div className="button-group">
              <button
                className="btn btn-primary"
                onClick={activeTab === 'encode' ? handleEncode : handleDecode}
                disabled={!image || !key.trim()}
              >
                {activeTab === 'encode' ? 'Encode Message' : 'Decode Message'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          )}

          {error && (
            <div className="message-section error">
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          )}

          {result && (
            <div className="message-section success">
              {result.type === 'encoded' ? (
                <>
                  <h3>Message Encoded Successfully!</h3>
                  <p>Your image has been encoded with the hidden message.</p>
                  <div className="image-preview" style={{ marginTop: '1rem' }}>
                    <img src={result.url} alt="Encoded" />
                  </div>
                  <div className="button-group" style={{ marginTop: '1rem' }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleDownload}
                    >
                      Download Encoded Image
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h3>Message Decoded Successfully!</h3>
                  <p><strong>Hidden Message:</strong></p>
                  <p style={{ marginTop: '0.5rem', fontSize: '1.1rem' }}>
                    {result.message}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;

