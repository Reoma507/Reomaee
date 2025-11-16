
import React, { useState, useCallback, ChangeEvent } from 'react';
import { extractTextFromImage } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { UploadIcon, SparklesIcon, CopyIcon, ClipboardCheckIcon } from './components/Icons';

// --- Helper Components (defined outside App to prevent re-creation on re-renders) ---

interface UploaderProps {
  onImageSelect: (file: File) => void;
  imageUrl: string | null;
}

const Uploader: React.FC<UploaderProps> = ({ onImageSelect, imageUrl }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className="w-full lg:w-1/2 p-4 flex flex-col items-center">
      <div className="w-full border-2 border-dashed border-secondary rounded-lg p-4 transition-all hover:border-accent">
        <label
          htmlFor="file-upload"
          className="flex flex-col items-center justify-center w-full h-64 cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadIcon />
            <p className="mb-2 text-sm text-dark-text"><span className="font-semibold">اضغط للرفع</span> أو اسحب وأفلت الصورة</p>
            <p className="text-xs text-dark-text">PNG, JPG, WEBP</p>
          </div>
          <input id="file-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      </div>
      {imageUrl && (
        <div className="mt-4 w-full max-h-[80vh] overflow-y-auto rounded-lg border border-secondary">
          <img src={imageUrl} alt="معاينة المانهوا" className="w-full h-auto" />
        </div>
      )}
    </div>
  );
};

const LEGEND_ITEMS = [
  { char: '#', description: 'نص داخل فقاعة كلام عادية', color: 'text-cyan-400' },
  { char: '$', description: 'نص داخل فقاعة تفكير أو همس', color: 'text-purple-400' },
  { char: '&', description: 'نص داخل مربع السرد', color: 'text-amber-400' },
  { char: '(', description: 'مؤثرات صوتية (SFX)', color: 'text-orange-400' },
  { char: ')', description: 'نص داخل فقاعة صراخ', color: 'text-red-400' },
  { char: '/', description: 'نص داخل فقاعة نظام أو شاشة معلومات', color: 'text-green-400' },
  { char: '_', description: 'نص آخر غير مصنف', color: 'text-gray-400' },
];

const Legend: React.FC = () => (
  <div className="mb-4 p-4 bg-gray-900/50 border border-secondary rounded-lg">
    <h3 className="text-lg font-bold mb-3 text-light-text">دليل العلامات</h3>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 gap-2 text-sm">
      {LEGEND_ITEMS.map(item => (
        <div key={item.char} className="flex items-center space-x-2 space-x-reverse">
          <span className={`font-mono font-bold text-lg ${item.color}`}>{item.char}</span>
          <span className="text-dark-text">{item.description}</span>
        </div>
      ))}
    </div>
  </div>
);


interface ResultDisplayProps {
  extractedText: string;
  isLoading: boolean;
  error: string | null;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ extractedText, isLoading, error }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(extractedText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const renderText = (text: string) => {
        return text.split('\n').map((line, index) => {
            const marker = LEGEND_ITEMS.find(item => line.startsWith(item.char));
            if (marker) {
                return (
                    <div key={index} className="flex items-start">
                        <span className={`w-6 flex-shrink-0 font-mono font-bold text-lg ${marker.color}`}>{marker.char}</span>
                        <span className="flex-1">{line.substring(1).trim()}</span>
                    </div>
                );
            }
            return <div key={index}>{line}</div>;
        });
    };

  return (
    <div className="w-full lg:w-1/2 p-4 flex flex-col">
      <Legend />
      <div className="relative flex-grow bg-gray-900 border border-secondary rounded-lg p-4 h-full min-h-[400px] lg:min-h-0">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-primary/80 backdrop-blur-sm z-10">
            <SparklesIcon className="animate-pulse" />
            <p className="mt-2 text-lg text-dark-text">...جاري تحليل الصورة واستخراج النصوص</p>
          </div>
        )}
        {error && <div className="text-red-400 text-center">{error}</div>}
        {!isLoading && !error && (
          <>
            {extractedText ? (
                <>
                    <button
                        onClick={handleCopy}
                        className="absolute top-3 left-3 bg-secondary hover:bg-accent text-light-text p-2 rounded-lg transition-colors"
                        aria-label="نسخ النص"
                    >
                        {copied ? <ClipboardCheckIcon /> : <CopyIcon />}
                    </button>
                    <pre className="whitespace-pre-wrap break-words font-sans text-base text-light-text overflow-y-auto h-full pr-10">
                        {renderText(extractedText)}
                    </pre>
                </>
            ) : (
              <div className="flex items-center justify-center h-full text-dark-text">
                <p>ستظهر النتائج هنا بعد اختيار صورة وبدء عملية الاستخراج.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};


// --- Main App Component ---

export default function App() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageSelect = useCallback((file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    setExtractedText('');
    setError(null);
  }, []);

  const handleExtractText = async () => {
    if (!imageFile) {
      setError("الرجاء اختيار صورة أولاً.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setExtractedText('');

    try {
      const base64Image = await fileToBase64(imageFile);
      const mimeType = imageFile.type;
      const result = await extractTextFromImage(base64Image, mimeType);
      setExtractedText(result);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء استخراج النص. الرجاء المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary text-light-text flex flex-col">
      <header className="p-4 text-center border-b border-secondary">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
          <SparklesIcon />
          مستخرج نصوص المانهوا
        </h1>
        <p className="text-dark-text mt-1">استخرج وصنف النصوص من صور المانهوا الطويلة بسهولة</p>
      </header>
      
      <main className="flex-grow container mx-auto p-4 flex flex-col lg:flex-row">
        <Uploader onImageSelect={handleImageSelect} imageUrl={imageUrl} />
        <ResultDisplay extractedText={extractedText} isLoading={isLoading} error={error} />
      </main>

      {imageUrl && (
        <div className="sticky bottom-0 w-full bg-primary/80 backdrop-blur-md p-4 border-t border-secondary flex justify-center">
            <button
                onClick={handleExtractText}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 bg-accent hover:bg-indigo-500 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:bg-secondary disabled:cursor-not-allowed transform hover:scale-105"
            >
                <SparklesIcon />
                {isLoading ? '...جاري الاستخراج' : 'استخراج النص'}
            </button>
        </div>
      )}

       <footer className="text-center p-4 text-xs text-dark-text border-t border-secondary">
        <p>تم التطوير بواسطة Gemini</p>
      </footer>
    </div>
  );
}
