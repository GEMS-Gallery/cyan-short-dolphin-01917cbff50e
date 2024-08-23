import React, { useState, useRef, useEffect } from 'react';
import { Container, Typography, Button, List, ListItem, ListItemText, CircularProgress, TextField, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { backend } from 'declarations/backend';
import * as THREE from 'three';

type BarcodeEntry = {
  barcode: string;
  timestamp: number;
};

const App: React.FC = () => {
  const [scanning, setScanning] = useState(false);
  const [barcodeHistory, setBarcodeHistory] = useState<BarcodeEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [barcode, setBarcode] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchBarcodeHistory();
  }, []);

  const fetchBarcodeHistory = async () => {
    try {
      const history = await backend.getHistory();
      setBarcodeHistory(history);
    } catch (err) {
      console.error('Failed to fetch barcode history:', err);
    }
  };

  const startScanning = async () => {
    setScanning(true);
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
    const width = imageData.width;
    const height = imageData.height;
    const data = imageData.data;

    // Convert to grayscale
    const grayData = new Uint8Array(width * height);
    for (let i = 0; i < data.length; i += 4) {
      const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
      grayData[i / 4] = gray;
    }

    // Apply threshold
    const threshold = 128;
    const binaryData = new Uint8Array(width * height);
    for (let i = 0; i < grayData.length; i++) {
      binaryData[i] = grayData[i] < threshold ? 0 : 1;
    }

    // Scan for barcode pattern
    const middleRow = Math.floor(height / 2);
    let barWidths = [];
    let currentWidth = 0;
    let currentColor = binaryData[middleRow * width];

    for (let x = 0; x < width; x++) {
      if (binaryData[middleRow * width + x] === currentColor) {
        currentWidth++;
      } else {
        barWidths.push(currentWidth);
        currentWidth = 1;
        currentColor = binaryData[middleRow * width + x];
      }
    }

    if (barWidths.length < 30) return null; // Not enough bars for a valid barcode

    // Decode barcode
    const unitWidth = Math.min(...barWidths);
    let code = '';
    for (let i = 0; i < barWidths.length; i += 4) {
      const digit = Math.round((barWidths[i] + barWidths[i + 1] + barWidths[i + 2] + barWidths[i + 3]) / unitWidth) - 4;
      if (digit >= 0 && digit <= 9) {
        code += digit.toString();
      }
    }

    return code.length >= 8 ? code : null;
  };

  const handleBarcodeSubmit = async (code: string) => {
    if (!code) return;

    setLoading(true);
    setError(null);
    try {
      await backend.recordBarcode(code);
      await fetchBarcodeHistory();
    } catch (err) {
      console.error(err);
      setError('Failed to record barcode');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" component="h1" gutterBottom>
        Barcode Scanner App
      </Typography>
      {!scanning && (
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
        Record Barcode
      </Button>
      {loading && <CircularProgress />}
      {error && (
        <Typography color="error" variant="body1">
          {error}
        </Typography>
      )}
      <Typography variant="h6" component="h2" gutterBottom style={{ marginTop: '20px' }}>
        Barcode History
      </Typography>
      <List>
        {barcodeHistory.map((entry, index) => (
          <ListItem key={index}>
            <ListItemText
              primary={entry.barcode}
              secondary={new Date(entry.timestamp / 1000000).toLocaleString()}
            />
          </ListItem>
        ))}
      </List>
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">Barcode Detected</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            A barcode has been detected: {barcode}. Do you want to record this barcode?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={() => {
            setOpenDialog(false);
            handleBarcodeSubmit(barcode);
          }} autoFocus>
            Record
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default App;
