// frontend/src/components/FileUploadBackground.jsx
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import FileUpload from './FileUpload';
import { uploadFile } from '../services/api';
import './FileUploadBackground.css';

/**
 * مكون لرفع الملفات في الخلفية تلقائياً
 * يرفع الملف فور اختياره ويسمح للمستخدم بالاستمرار في العمل
 */
export default function FileUploadBackground({
  value, // File أو null
  onChange, // (file: File | null) => void
  onUploaded, // (url: string) => void - يتم استدعاؤها عند اكتمال الرفع
  uploadEndpoint, // endpoint للرفع (مثل: `projects/${projectId}/siteplan/`)
  fieldName, // اسم الحقل (مثل: "application_file")
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
  projectId, // projectId للرفع
}) {
  const { t } = useTranslation();
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadedUrl, setUploadedUrl] = useState(null);
  const abortControllerRef = useRef(null);

  // رفع الملف تلقائياً عند الاختيار (معطّل مؤقتاً - يحتاج endpoint منفصل)
  // useEffect(() => {
  //   if (autoUpload && value instanceof File && uploadEndpoint && fieldName && projectId) {
  //     handleAutoUpload(value);
  //   } else if (!value) {
  //     // إعادة تعيين عند إزالة الملف
  //     setUploadProgress(0);
  //     setIsUploading(false);
  //     setUploadError('');
  //     setUploadedUrl(null);
  //     if (abortControllerRef.current) {
  //       abortControllerRef.current.abort();
  //       abortControllerRef.current = null;
  //     }
  //   }
  // }, [value, autoUpload, uploadEndpoint, fieldName, projectId]);

  const handleAutoUpload = async (file) => {
    if (!file || !uploadEndpoint || !fieldName || !projectId) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadError('');
    
    // إنشاء AbortController لإمكانية الإلغاء
    abortControllerRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append(fieldName, file, file.name);

      // رفع الملف مع تتبع التقدم
      const response = await uploadFile(
        uploadEndpoint,
        formData,
        (progress) => {
          setUploadProgress(progress);
        },
        {
          signal: abortControllerRef.current.signal,
        }
      );

      // استخراج URL من الاستجابة
      let fileUrl = null;
      if (response?.data) {
        fileUrl = response.data[fieldName] || 
                  response.data.file_url || 
                  response.data.url ||
                  (typeof response.data === 'string' ? response.data : null);
      }

      if (fileUrl) {
        setUploadedUrl(fileUrl);
        if (onUploaded) {
          onUploaded(fileUrl);
        }
      }

      setIsUploading(false);
      setUploadProgress(100);
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        // تم إلغاء الرفع
        setIsUploading(false);
        setUploadProgress(0);
        return;
      }

      console.error('خطأ في رفع الملف:', error);
      setUploadError(error.message || t('upload_error') || 'حدث خطأ في رفع الملف');
      setIsUploading(false);
      setUploadProgress(0);
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleFileChange = (file) => {
    onChange(file);
    setUploadError('');
    if (!file) {
      setUploadedUrl(null);
    }
  };

  const handleRemove = () => {
    // إلغاء الرفع إذا كان قيد التنفيذ
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    handleFileChange(null);
  };

  // استخدام URL المرفوع إذا كان موجوداً
  const displayUrl = uploadedUrl || existingFileUrl;
  const displayName = existingFileName || (displayUrl ? displayUrl.split('/').pop() : '');

  return (
    <div className={`file-upload-background ${className}`}>
      <FileUpload
        value={value}
        onChange={handleFileChange}
        accept={accept}
        maxSizeMB={maxSizeMB}
        label={label}
        disabled={disabled || isUploading}
        showPreview={showPreview}
        compressionOptions={compressionOptions}
        existingFileUrl={displayUrl}
        existingFileName={displayName}
        onRemoveExisting={() => {
          if (onRemoveExisting) {
            onRemoveExisting();
          }
          handleRemove();
        }}
      />

      {/* حالة الرفع */}
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

      {/* رسالة نجاح الرفع */}
      {uploadedUrl && !isUploading && (
        <div className="upload-success">
          ✓ {t('file_uploaded_successfully') || 'تم رفع الملف بنجاح - يمكنك الاستمرار في إدخال البيانات'}
        </div>
      )}

      {/* رسالة خطأ */}
      {uploadError && (
        <div className="upload-error">
          ✕ {uploadError}
        </div>
      )}
    </div>
  );
}

