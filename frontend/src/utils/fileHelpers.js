// دوال موحدة للتعامل مع الملفات
/**
 * استخراج اسم الملف من URL مع فك الترميز
 * @param {string} fileUrl - URL الملف
 * @returns {string} اسم الملف
 */
export function extractFileNameFromUrl(fileUrl) {
  if (!fileUrl || typeof fileUrl !== "string") return "";
  
  const parts = fileUrl.split("/");
  const fileName = parts[parts.length - 1] || "";
  
  try {
    return decodeURIComponent(fileName);
  } catch {
    return fileName;
  }
}

