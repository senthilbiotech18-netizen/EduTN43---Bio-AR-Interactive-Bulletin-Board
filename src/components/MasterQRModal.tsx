import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { 
  X, 
  QrCode, 
  Printer, 
  Copy, 
  Check, 
  ExternalLink, 
  Sparkles, 
  Smartphone, 
  Eye,
  Download,
  Share2,
  Info
} from 'lucide-react';
import { Project } from '../types';

interface MasterQRModalProps {
  projects: Project[];
  onClose: () => void;
}

export const MasterQRModal: React.FC<MasterQRModalProps> = ({ projects, onClose }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [bannerTitle, setBannerTitle] = useState('GSIS Biology AR Exhibition');
  const [bannerSubtitle, setBannerSubtitle] = useState('Scan once with your camera to view all student posters in live 3D AR');
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Direct WebAR link (points straight to root / scanner)
  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bioar-board.app';

  useEffect(() => {
    QRCode.toDataURL(appUrl, {
      width: 480,
      margin: 2,
      color: {
        dark: '#132A13',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        setQrDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code:', err);
      });
  }, [appUrl]);

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrintBanner = () => {
    window.print();
  };

  const handleDownloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.href = qrDataUrl;
    link.download = 'BioAR_Classroom_Master_QR.png';
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#0E1B10]/80 backdrop-blur-xl animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-auto bg-white dark:bg-[#1A2E1A] rounded-3xl shadow-2xl border border-[#2D5A27]/25 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D5A27]/15 bg-white/90 dark:bg-[#1A2E1A]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-400">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#1A2E1A] dark:text-white text-base">
                Classroom Master QR Banner
              </h3>
              <p className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80">
                1 QR code for the whole bulletin board — parents scan once with regular camera
              </p>
            </div>
          </div>

          <button
            id="btn-close-qr-modal"
            type="button"
            onClick={onClose}
            className="p-2 rounded-2xl text-[#2D5A27]/70 hover:text-[#1A2E1A] dark:hover:text-white hover:bg-[#E8F0E8] dark:hover:bg-[#223D23] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#F4F7F5]/50 dark:bg-[#132416]/50">
          
          {/* How it works Banner Callout */}
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-600 text-white shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-emerald-950 dark:text-emerald-200 text-sm">
                No Individual Poster Stickers Needed!
              </h4>
              <p className="text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Stick or hang this <strong>one banner</strong> at the top of your bulletin board. When parents aim their phone's native camera at this QR code, it opens the AR scanner. From there, they simply aim at <em>any student's drawing</em> on the board to see that student's 3D model and hear their recorded video explanation!
              </p>
            </div>
          </div>

          {/* Printable Classroom Poster / Header Preview */}
          <div 
            ref={printAreaRef}
            className="p-6 sm:p-8 bg-white dark:bg-[#1C321E] rounded-3xl border-2 border-[#2D5A27]/30 shadow-xl flex flex-col sm:flex-row items-center gap-6 justify-between text-center sm:text-left"
          >
            <div className="flex-1 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F0E8] dark:bg-[#223D23] text-[#2D5A27] dark:text-emerald-300 font-bold text-[11px] uppercase tracking-wider border border-[#2D5A27]/20">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Interactive AR Exhibition</span>
              </div>
              
              <div>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  className="font-extrabold text-xl sm:text-2xl text-[#1A2E1A] dark:text-white bg-transparent border-b border-transparent hover:border-[#2D5A27]/30 focus:border-[#2D5A27] focus:outline-hidden w-full transition"
                  title="Click to edit banner title"
                />
                <input
                  type="text"
                  value={bannerSubtitle}
                  onChange={(e) => setBannerSubtitle(e.target.value)}
                  className="text-xs text-[#2D5A27]/80 dark:text-emerald-300/80 bg-transparent border-b border-transparent hover:border-[#2D5A27]/30 focus:border-[#2D5A27] focus:outline-hidden w-full mt-1 transition"
                  title="Click to edit banner subtitle"
                />
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-2 justify-center sm:justify-start text-[11px] text-[#2D5A27]/70 dark:text-emerald-400/80">
                <span className="font-semibold">{projects.length} Student Posters Ready</span>
                <span>•</span>
                <span>Works on iOS & Android</span>
                <span>•</span>
                <span>No App Download</span>
              </div>
            </div>

            {/* QR Code Container */}
            <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200 shrink-0 flex flex-col items-center">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Classroom Master QR Code"
                  className="w-40 h-40 object-contain block rounded-lg"
                />
              ) : (
                <div className="w-40 h-40 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-xs">
                  Generating QR...
                </div>
              )}
              <span className="text-[10px] font-bold text-slate-700 mt-2 tracking-wide uppercase">
                Scan with Phone Camera
              </span>
            </div>
          </div>

          {/* Quick Copy & Live URL */}
          <div className="p-4 rounded-2xl bg-white dark:bg-[#1A2E1A] border border-[#2D5A27]/15 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-[#2D5A27]/70 dark:text-emerald-400 uppercase tracking-wider block">
                WebAR Direct URL
              </span>
              <p className="text-xs font-mono text-[#1A2E1A] dark:text-white truncate mt-0.5">
                {appUrl}
              </p>
            </div>

            <button
              id="btn-copy-webar-link"
              type="button"
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#E8F0E8] dark:bg-[#223D23] hover:bg-[#d8e6d8] text-[#2D5A27] dark:text-emerald-300 font-bold text-xs transition shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#2D5A27]/15 bg-white dark:bg-[#1A2E1A] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[#2D5A27]/70 dark:text-emerald-400/80">
            Tip: Print this banner in landscape and tape it to your classroom board!
          </div>

          <div className="flex items-center gap-2.5">
            <button
              id="btn-download-qr-img"
              type="button"
              onClick={handleDownloadQR}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white dark:bg-[#223D23] hover:bg-[#E8F0E8] text-[#1A2E1A] dark:text-white font-bold text-xs border border-[#2D5A27]/20 shadow-xs transition"
            >
              <Download className="w-4 h-4 text-[#2D5A27] dark:text-emerald-400" />
              <span>Download QR</span>
            </button>

            <button
              id="btn-print-master-banner"
              type="button"
              onClick={handlePrintBanner}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-[#2D5A27] hover:bg-[#23461e] text-white font-bold text-xs shadow-md shadow-[#2D5A27]/25 transition"
            >
              <Printer className="w-4 h-4" />
              <span>Print Bulletin Banner</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
