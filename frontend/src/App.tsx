import React, { useState, useRef } from 'react';
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

  const handleBarcodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;

    setLoading(true);
    try {
      const response = await backend.scanBarcode(barcode);
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
          Start Camera
        </Button>
      )}
      {scanning && (
        <div>
          <video ref={videoRef} style={{ width: '100%', maxWidth: '500px' }} />
          <Button variant="contained" color="secondary" onClick={stopScanning}>
            Stop Camera
          </Button>
        </div>
      )}
      <form onSubmit={handleBarcodeSubmit}>
        <TextField
          fullWidth
          label="Enter Barcode"
          variant="outlined"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary">
          Lookup Product
        </Button>
      </form>
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
