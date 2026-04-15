import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Download, Copy, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';

const QRCodeModal = ({ queue, onClose }) => {
  const qrRef = useRef();
  
  // URL that customers will scan
  const joinUrl = `${window.location.origin}/q/${queue._id}`;

  const downloadQR = () => {
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${queue.name}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(joinUrl);
    toast.success('Link copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition"
        >
          <X className="w-6 h-6 text-slate-400" />
        </button>

        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-slate-900">{queue.name}</h3>
          <p className="text-sm text-slate-500">Scan to join this queue</p>
        </div>

        <div 
          ref={qrRef}
          className="bg-indigo-50 p-6 rounded-2xl flex justify-center mb-6"
        >
          <QRCodeSVG 
            value={joinUrl} 
            size={200}
            includeMargin={true}
            level="H"
          />
        </div>

        <div className="space-y-3">
          <button 
            onClick={downloadQR}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition"
          >
            <Download className="w-5 h-5" />
            <span>Download PNG</span>
          </button>
          
          <div className="flex space-x-2">
            <button 
              onClick={copyLink}
              className="flex-1 flex items-center justify-center space-x-2 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
            >
              <Copy className="w-5 h-5" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>

        <p className="mt-6 text-[10px] text-center text-slate-400 uppercase tracking-widest font-bold">
          Powered by QueueLess
        </p>
      </motion.div>
    </div>
  );
};

export default QRCodeModal;
