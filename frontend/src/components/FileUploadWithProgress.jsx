// frontend/src/components/FileUploadWithProgress.jsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import FileUpload from './FileUpload';
import './FileUploadWithProgress.css';

/**
 * مكون لرفع الملفات مع شريط تقدم
 * يستخدم FileUpload للاختيار والمعالجة
 * ويعرض شريط تقدم أثناء الرفع
 */
export default function FileUploadWithProgress({
  onUpload, // async (file: File, onProgress: (progress: number) => void) => Promise<any>
  onSuccess, // (result: any) => void
  onError, // (error: Error) => void
  value,
  onChange,
  accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx",
  maxSizeMB = 10,
  label,
  disabled = false,
  showPreview = true,
  compressionOptions = {},
  existingFileUrl,
  existingFileName,
  onRemoveExisting,
  className = "",
  autoUpload = false, // إذا كان true، يرفع الملف تلقائياً بعد الاختيار
}) {
  const { t } = useTranslation();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = async (file) => {
    onChange(file);
    setUploadError('');
    setUploadProgress(0);

    if (autoUpload && file && onUpload) {
      await handleUpload(file);
    }
  };

  const handleUpload = async (file) => {
    if (!file || !onUpload) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');

    try {
      const result = await onUpload(file, (progress) => {
        setUploadProgress(progress);
      });

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error('خطأ في رفع الملف:', error);
      setUploadError(error.message || t('upload_error') || 'حدث خطأ في رفع الملف');
      if (onError) {
        onError(error);
      }
    } finally {
      setIsUploading(false);
      // إعادة تعيين التقدم بعد ثانية
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  return (
    <div className={`file-upload-with-progress ${className}`}>
      <FileUpload
        value={value}
        onChange={handleFileChange}
        accept={accept}
        maxSizeMB={maxSizeMB}
        label={label}
        disabled={disabled || isUploading}
        showPreview={showPreview}
        compressionOptions={compressionOptions}
        existingFileUrl={existingFileUrl}
        existingFileName={existingFileName}
        onRemoveExisting={onRemoveExisting}
      />

      {/* شريط التقدم */}
      {isUploading && (
        <div className="upload-progress-container">
          <div className="upload-progress-bar">
            <div 
              className="upload-progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <span className="upload-progress-text">
            {uploadProgress}%
          </span>
        </div>
      )}

      {/* زر الرفع اليدوي */}
      {!autoUpload && value instanceof File && !isUploading && onUpload && (
        <button
          type="button"
          onClick={() => handleUpload(value)}
          className="upload-button"
          disabled={disabled}
        >
          {t('upload_file') || 'رفع الملف'}
        </button>
      )}

      {/* رسالة خطأ الرفع */}
      {uploadError && (
        <div className="upload-error">
          {uploadError}
        </div>
      )}
    </div>
  );
}

