import React, { useState, useRef, useEffect } from 'react';
import { Container, Typography, Button, Card, CardContent, CardMedia, CircularProgress, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
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
  const [openDialog, setOpenDialog] = useState(false);
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
          setOpenDialog(true);
          stopScanning();
          return;
        }
      }
      if (scanning) {
        requestAnimationFrame(detectFrame);
      }
    };

    requestAnimationFrame(detectFrame);
  };

  const processImageData = (imageData: ImageData): string | null => {
    // Simulate barcode detection
    const data = imageData.data;
    let blackPixels = 0;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r < 50 && g < 50 && b < 50) {
        blackPixels++;
      }
    }
    
    // If more than 10% of pixels are black, consider it a barcode
    if (blackPixels > imageData.width * imageData.height * 0.1) {
      // Generate a random 13-digit number for the barcode
      return Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
    }
    return null;
  };

  const fetchProductData = async (barcode: string): Promise<Product> => {
    // Simulating API call to UPC Database
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulated API response
        const mockData = {
          name: `Product ${barcode}`,
          brand: 'Sample Brand',
          categories: 'Sample Category',
          image_url: `https://example.com/product_${barcode}.jpg`,
        };
        resolve(mockData);
      }, 1000);
    });
  };

  const handleBarcodeSubmit = async (code: string) => {
    if (!code) return;

    setLoading(true);
    setError(null);
    try {
      const productData = await fetchProductData(code);
      const response = await backend.scanBarcode(code, productData);
      if ('ok' in response) {
        setProduct(response.ok);
      } else {
        setError('Failed to save product information');
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
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Barcode Detected</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            A barcode has been detected: {barcode}. Do you want to look up this product?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={() => {
            setOpenDialog(false);
            handleBarcodeSubmit(barcode);
          }} autoFocus>
            Look up
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default App;
