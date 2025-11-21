// frontend/src/components/FileUploadAuto.jsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import FileUpload from './FileUpload';
import { useFileUpload } from '../hooks/useFileUpload';
import './FileUploadAuto.css';

/**
 * مكون لرفع الملفات تلقائياً في الخلفية
 * يرفع الملف فور اختياره ويسمح للمستخدم بالاستمرار في العمل
 */
export default function FileUploadAuto({
  value, // File أو null
  onChange, // (file: File | null) => void
  onUploadComplete, // (url: string) => void (اختياري)
  endpoint, // endpoint للرفع (مثل: `projects/${projectId}/upload/`)
  fieldName, // اسم الحقل في الرفع (مثل: "application_file")
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
  autoUpload = true, // رفع تلقائي عند الاختيار
}) {
  const { t } = useTranslation();
  const [localFile, setLocalFile] = useState(value);
  const [uploadError, setUploadError] = useState('');
  const { uploadFile, getUploadStatus, cancelUpload } = useFileUpload(endpoint || '', {
    autoUpload,
  });

  // مزامنة value الخارجي
  useEffect(() => {
    setLocalFile(value);
  }, [value]);

  // رفع الملف تلقائياً عند الاختيار
  useEffect(() => {
    if (autoUpload && localFile instanceof File && endpoint && fieldName) {
      handleAutoUpload(localFile);
    }
  }, [localFile, autoUpload, endpoint, fieldName]);

  const handleAutoUpload = async (file) => {
    if (!file || !endpoint || !fieldName) return;

    setUploadError('');
    try {
      const url = await uploadFile(file, fieldName, (progress) => {
        // يمكن إضافة callback للتقدم هنا إذا لزم الأمر
      });
      if (url && onUploadComplete) {
        onUploadComplete(url);
      }
    } catch (error) {
      console.error('خطأ في رفع الملف:', error);
      setUploadError(error.message || t('upload_error') || 'حدث خطأ في رفع الملف');
    }
  };

  const handleFileChange = (file) => {
    setLocalFile(file);
    onChange(file);
    setUploadError('');
  };

  const handleRemove = () => {
    if (localFile instanceof File) {
      const status = getUploadStatus(localFile, fieldName);
      if (status?.status === 'uploading') {
        const fileKey = `${fieldName}_${localFile.name}_${localFile.size}`;
        cancelUpload(fileKey);
      }
    }
    handleFileChange(null);
  };

  const uploadStatus = localFile instanceof File && fieldName 
    ? getUploadStatus(localFile, fieldName)
    : null;

  return (
    <div className={`file-upload-auto ${className}`}>
      <FileUpload
        value={localFile}
        onChange={handleFileChange}
        accept={accept}
        maxSizeMB={maxSizeMB}
        label={label}
        disabled={disabled || (uploadStatus?.status === 'uploading')}
        showPreview={showPreview}
        compressionOptions={compressionOptions}
        existingFileUrl={existingFileUrl}
        existingFileName={existingFileName}
        onRemoveExisting={() => {
          if (onRemoveExisting) {
            onRemoveExisting();
          }
          handleFileChange(null);
        }}
      />

      {/* حالة الرفع */}
      {uploadStatus && (
        <div className="upload-status">
          {uploadStatus.status === 'uploading' && (
            <div className="upload-progress-container">
              <div className="upload-progress-bar">
                <div 
                  className="upload-progress-fill"
                  style={{ width: `${uploadStatus.progress}%` }}
                />
              </div>
              <span className="upload-progress-text">
                {uploadStatus.progress}%
              </span>
              <button
                type="button"
                className="cancel-upload-btn"
                onClick={handleRemove}
                title={t('cancel_upload') || 'إلغاء الرفع'}
              >
                ✕
              </button>
            </div>
          )}
          {uploadStatus.status === 'completed' && (
            <div className="upload-success">
              ✓ {t('file_uploaded_successfully') || 'تم رفع الملف بنجاح'}
            </div>
          )}
          {uploadStatus.status === 'error' && (
            <div className="upload-error">
              ✕ {uploadStatus.error || t('upload_error') || 'حدث خطأ في رفع الملف'}
            </div>
          )}
        </div>
      )}

      {/* رسالة خطأ عامة */}
      {uploadError && (
        <div className="upload-error">
          {uploadError}
        </div>
      )}
    </div>
  );
}

