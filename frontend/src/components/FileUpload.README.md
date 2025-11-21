# FileUpload Component - دليل الاستخدام

## المميزات

✅ **ضغط تلقائي للصور** - تقليل حجم الصور قبل الرفع لتسريع العملية  
✅ **شريط تقدم** - عرض تقدم عملية الرفع  
✅ **معاينة الملفات** - معاينة الصور قبل الرفع  
✅ **التحقق من الحجم** - منع رفع الملفات الكبيرة جداً  
✅ **واجهة مستخدم محسّنة** - تصميم جميل وسهل الاستخدام  

## الاستخدام الأساسي

```jsx
import FileUpload from '../components/FileUpload';

function MyComponent() {
  const [file, setFile] = useState(null);

  return (
    <FileUpload
      value={file}
      onChange={setFile}
      accept=".pdf,.jpg,.jpeg,.png"
      maxSizeMB={10}
      label="رفع ملف"
    />
  );
}
```

## الخصائص (Props)

| الخاصية | النوع | الوصف | افتراضي |
|---------|------|-------|---------|
| `value` | `File \| null` | الملف المختار | - |
| `onChange` | `(file: File \| null) => void` | دالة تحديث الملف | - |
| `accept` | `string` | أنواع الملفات المقبولة | `".pdf,.jpg,.jpeg,.png,.doc,.docx"` |
| `maxSizeMB` | `number` | الحد الأقصى للحجم بالميجابايت | `10` |
| `label` | `string` | تسمية الحقل | - |
| `showPreview` | `boolean` | عرض معاينة للصور | `true` |
| `compressionOptions` | `object` | خيارات الضغط | `{ maxSizeMB: 1, maxWidthOrHeight: 1920 }` |
| `existingFileUrl` | `string` | رابط الملف الموجود | - |
| `existingFileName` | `string` | اسم الملف الموجود | - |
| `onRemoveExisting` | `() => void` | دالة حذف الملف الموجود | - |
| `disabled` | `boolean` | تعطيل الحقل | `false` |

## مثال متقدم

```jsx
<FileUpload
  value={form.attachment}
  onChange={(file) => setForm({ ...form, attachment: file })}
  accept=".pdf,.jpg,.jpeg,.png"
  maxSizeMB={5}
  showPreview={true}
  existingFileUrl={existingFileUrl}
  existingFileName={existingFileName}
  onRemoveExisting={() => {
    setForm({ ...form, attachment: null });
    setExistingFileUrl(null);
  }}
  compressionOptions={{
    maxSizeMB: 0.5,        // ضغط إلى 0.5MB
    maxWidthOrHeight: 1280, // تقليل الدقة
    initialQuality: 0.7     // جودة أقل قليلاً
  }}
/>
```

## FileUploadWithProgress

لرفع الملفات مع شريط تقدم:

```jsx
import FileUploadWithProgress from '../components/FileUploadWithProgress';
import { uploadFile } from '../services/api';

function MyComponent() {
  const handleUpload = async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return await uploadFile('/api/upload/', formData, onProgress);
  };

  return (
    <FileUploadWithProgress
      onUpload={handleUpload}
      onSuccess={(result) => console.log('تم الرفع:', result)}
      onError={(error) => console.error('خطأ:', error)}
      autoUpload={true} // رفع تلقائي بعد الاختيار
    />
  );
}
```

## ملاحظات مهمة

1. **ضغط الصور**: يتم ضغط الصور تلقائياً قبل الرفع لتقليل الوقت والحجم
2. **التحقق من الحجم**: يتم رفض الملفات التي تتجاوز `maxSizeMB`
3. **المعاينة**: تظهر معاينة للصور فقط، وليس للملفات الأخرى
4. **الملفات الموجودة**: يمكن عرض وإزالة الملفات المرفقة سابقاً

