import React, { useState, useRef, useEffect } from 'react';
import { Container, Typography, Button, Card, CardContent, CardMedia, CircularProgress, TextField } from '@mui/material';
import { backend } from 'declarations/backend';

type Product = {
  name: string;
  brand: string;
  categories: string;
  image_url: string;
};

const App: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const startScanning = async () => {
    setScanning(true);
    setProduct(null);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      detectBarcode();
    } catch (err) {
      console.error(err);
      setError('Failed to access camera');
      setScanning(false);
    }
  };

  const stopScanning = () => {
    setScanning(false);
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const detectBarcode = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    const detectFrame = () => {
      if (videoRef.current) {
        context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = processImageData(imageData);
        if (code) {
          setBarcode(code);
          handleBarcodeSubmit(code);
          return;
        }
      }
      requestAnimationFrame(detectFrame);
    };

    requestAnimationFrame(detectFrame);
  };

  const processImageData = (imageData: ImageData): string | null => {
    // This is a placeholder for actual barcode detection logic
    // In a real implementation, you'd use a barcode detection library here
    return null;
  };

  const fetchProductData = async (barcode: string): Promise<Product> => {
    const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    if (!response.ok) {
      throw new Error('Failed to fetch product data');
    }
    const data = await response.json();
    return {
      name: data.product.product_name || 'Unknown',
      brand: data.product.brands || 'Unknown',
      categories: data.product.categories || 'Unknown',
      image_url: data.product.image_url || 'https://example.com/placeholder.jpg',
    };
  };

  const handleBarcodeSubmit = async (code: string) => {
    if (!code) return;

    setLoading(true);
    try {
      const productData = await fetchProductData(code);
      const response = await backend.scanBarcode(code, productData);
      if ('ok' in response) {
        setProduct(response.ok);
      } else {
        setError('Product not found');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to fetch product information');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        Barcode Scanner App
      </Typography>
      {!scanning && !product && (
        <Button variant="contained" color="primary" onClick={startScanning}>
          Start Scanning
        </Button>
      )}
      {scanning && (
        <div>
          <video ref={videoRef} style={{ width: '100%', maxWidth: '500px' }} />
          <canvas ref={canvasRef} style={{ display: 'none' }} width="640" height="480" />
          <Button variant="contained" color="secondary" onClick={stopScanning}>
            Stop Scanning
          </Button>
        </div>
      )}
      <TextField
        fullWidth
        label="Detected Barcode"
        variant="outlined"
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        margin="normal"
      />
      <Button variant="contained" color="primary" onClick={() => handleBarcodeSubmit(barcode)}>
        Lookup Product
      </Button>
      {loading && <CircularProgress />}
      {error && (
        <Typography color="error" variant="body1">
          {error}
        </Typography>
      )}
      {product && (
        <Card>
          <CardMedia
            component="img"
            height="140"
            image={product.image_url}
            alt={product.name}
          />
          <CardContent>
            <Typography gutterBottom variant="h5" component="div">
              {product.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Brand: {product.brand}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Categories: {product.categories}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Container>
  );
};

export default App;
