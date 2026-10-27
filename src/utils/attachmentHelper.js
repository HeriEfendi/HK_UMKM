import { Camera, CameraSource, CameraResultType } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

/**
 * Excel cell character limit is 32,767.
 * We use 30,000 to keep a safe buffer.
 */
export const EXCEL_CHUNK_SIZE = 30000;

/**
 * Check if user cancelled photo picker/camera
 */
function isUserCancelled(err) {
  const msg = err?.message ?? '';
  return (
    msg === 'User cancelled photos app' ||
    msg === 'User cancelled' ||
    msg === 'No image picked' ||
    err?.code === 'userCancelled' ||
    msg.toLowerCase().includes('cancel')
  );
}

/**
 * Convert a File, Blob, or DataURL/Base64 to an HTMLImageElement
 */
function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Gagal memuat gambar: ' + (err?.message || 'Format tidak didukung')));

    if (typeof source === 'string') {
      img.src = source.startsWith('data:') ? source : `data:image/jpeg;base64,${source}`;
    } else if (source instanceof Blob || source instanceof File) {
      const url = URL.createObjectURL(source);
      img.src = url;
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
    } else {
      reject(new Error('Sumber gambar tidak valid.'));
    }
  });
}

/**
 * Compress and resize an image proportionally to WebP Blob (with JPEG fallback)
 * @param {File|Blob|string} source - Image source (file, blob, data URL, base64)
 * @param {number} maxDimension - Max width or height (default 1200px)
 * @param {number} quality - Compression quality 0.1 - 1.0 (default 0.75)
 * @returns {Promise<{ blob: Blob, mimeType: string, size: number, width: number, height: number }>}
 */
export async function compressReceiptImage(source, maxDimension = 1200, quality = 0.75) {
  const img = await loadImage(source);

  let { width, height } = img;

  // Scale down proportionally while preserving aspect ratio
  if (width > height) {
    if (width > maxDimension) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    }
  } else {
    if (height > maxDimension) {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, width, height);

  // Try WebP first
  const webpBlob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/webp', quality);
  });

  if (webpBlob && webpBlob.type === 'image/webp') {
    return {
      blob: webpBlob,
      mimeType: 'image/webp',
      size: webpBlob.size,
      width,
      height,
    };
  }

  // Fallback to JPEG if WebP is not supported by older webview
  const jpegBlob = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
  });

  if (!jpegBlob) {
    throw new Error('Gagal mengompres gambar.');
  }

  return {
    blob: jpegBlob,
    mimeType: 'image/jpeg',
    size: jpegBlob.size,
    width,
    height,
  };
}

/**
 * Capture photo directly using Camera
 */
export async function capturePhotoFromCamera() {
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Camera,
      saveToGallery: false,
      correctOrientation: true,
      webUseInput: false,
    });

    const src = photo.dataUrl || (photo.base64String ? `data:image/jpeg;base64,${photo.base64String}` : null);
    if (!src) return null;

    return await compressReceiptImage(src);
  } catch (err) {
    if (isUserCancelled(err)) return null;
    const msg = err?.message ?? '';
    if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
      throw new Error('Izin kamera ditolak. Harap izinkan akses kamera di pengaturan aplikasi.');
    }
    throw err;
  }
}

/**
 * Pick photo from device Gallery
 */
export async function pickPhotoFromGallery() {
  try {
    const photo = await Camera.getPhoto({
      quality: 85,
      allowEditing: false,
      resultType: CameraResultType.Base64,
      source: CameraSource.Photos,
      correctOrientation: true,
      webUseInput: true,
    });

    const src = photo.dataUrl || (photo.base64String ? `data:image/jpeg;base64,${photo.base64String}` : null);
    if (!src) return null;

    return await compressReceiptImage(src);
  } catch (err) {
    if (isUserCancelled(err)) return null;
    const msg = err?.message ?? '';
    if (msg.toLowerCase().includes('permission') || msg.toLowerCase().includes('denied')) {
      throw new Error('Izin galeri ditolak. Harap izinkan akses galeri di pengaturan aplikasi.');
    }
    throw err;
  }
}

/**
 * Convert a Blob to a Base64 data URL
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert a Base64 string / Data URL back to a binary Blob
 * @param {string} base64Data
 * @param {string} defaultMime
 * @returns {Blob}
 */
export function base64ToBlob(base64Data, defaultMime = 'image/webp') {
  if (!base64Data || typeof base64Data !== 'string') return null;

  let base64 = base64Data;
  let mimeType = defaultMime;

  if (base64Data.includes(',')) {
    const parts = base64Data.split(',');
    const match = parts[0].match(/:(.*?);/);
    if (match) mimeType = match[1];
    base64 = parts[1];
  }

  const byteCharacters = atob(base64);
  const byteArrays = [];
  const sliceSize = 2048;

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: mimeType });
}

/**
 * Split a string into chunks of chunkSize
 */
export function chunkString(str, chunkSize = EXCEL_CHUNK_SIZE) {
  if (!str) return [];
  const chunks = [];
  for (let i = 0; i < str.length; i += chunkSize) {
    chunks.push(str.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Prepare an array of records for Excel export:
 * - Detects fields with `instanceof Blob`
 * - Converts them to Base64
 * - Chunks large strings/base64 so no single cell exceeds 32,000 characters
 * @param {Array<Object>} records
 * @returns {Promise<Array<Object>>}
 */
export async function prepareRecordsForExcel(records) {
  if (!Array.isArray(records)) return [];

  const prepared = [];

  for (const record of records) {
    const row = { ...record };

    for (const key of Object.keys(row)) {
      const val = row[key];

      // 1. Handle Blobs
      if (val instanceof Blob) {
        const base64 = await blobToBase64(val);
        const mime = val.type || 'image/webp';
        delete row[key];

        if (base64.length <= EXCEL_CHUNK_SIZE) {
          row[`__blob_single__${key}`] = base64;
          row[`__blob_mime__${key}`] = mime;
        } else {
          const chunks = chunkString(base64, EXCEL_CHUNK_SIZE);
          row[`__blob_chunks__${key}`] = chunks.length;
          row[`__blob_mime__${key}`] = mime;
          chunks.forEach((chunk, idx) => {
            row[`__blob_${key}_chunk_${idx}`] = chunk;
          });
        }
        continue;
      }

      // 2. Handle large string values (e.g. JSON strings or long notes > 30,000 chars)
      if (typeof val === 'string' && val.length > EXCEL_CHUNK_SIZE) {
        const chunks = chunkString(val, EXCEL_CHUNK_SIZE);
        delete row[key];
        row[`__str_chunks__${key}`] = chunks.length;
        chunks.forEach((chunk, idx) => {
          row[`__str_${key}_chunk_${idx}`] = chunk;
        });
        continue;
      }
    }

    prepared.push(row);
  }

  return prepared;
}

/**
 * Restore an array of records from Excel:
 * - Detects `__blob_*` metadata and reconstructs genuine `Blob` objects
 * - Detects `__str_*` metadata and reassembles chunked long strings
 * @param {Array<Object>} rows
 * @returns {Array<Object>}
 */
export function restoreRecordsFromExcel(rows) {
  if (!Array.isArray(rows)) return [];

  return rows.map((rawRow) => {
    const cleaned = { ...rawRow };
    delete cleaned.__rowNum__;

    // 1. Reconstruct chunked Blobs
    const blobKeysFound = new Set();

    for (const key of Object.keys(cleaned)) {
      if (key.startsWith('__blob_single__')) {
        const fieldName = key.replace('__blob_single__', '');
        const base64 = cleaned[key];
        const mime = cleaned[`__blob_mime__${fieldName}`] || 'image/webp';
        cleaned[fieldName] = base64ToBlob(base64, mime);
        delete cleaned[key];
        delete cleaned[`__blob_mime__${fieldName}`];
        blobKeysFound.add(fieldName);
      } else if (key.startsWith('__blob_chunks__')) {
        const fieldName = key.replace('__blob_chunks__', '');
        const chunkCount = Number(cleaned[key]) || 0;
        const mime = cleaned[`__blob_mime__${fieldName}`] || 'image/webp';

        let fullBase64 = '';
        for (let i = 0; i < chunkCount; i++) {
          const chunkKey = `__blob_${fieldName}_chunk_${i}`;
          fullBase64 += cleaned[chunkKey] || '';
          delete cleaned[chunkKey];
        }

        cleaned[fieldName] = base64ToBlob(fullBase64, mime);
        delete cleaned[key];
        delete cleaned[`__blob_mime__${fieldName}`];
        blobKeysFound.add(fieldName);
      } else if (key.startsWith('__str_chunks__')) {
        const fieldName = key.replace('__str_chunks__', '');
        const chunkCount = Number(cleaned[key]) || 0;

        let fullStr = '';
        for (let i = 0; i < chunkCount; i++) {
          const chunkKey = `__str_${fieldName}_chunk_${i}`;
          fullStr += cleaned[chunkKey] || '';
          delete cleaned[chunkKey];
        }

        cleaned[fieldName] = fullStr;
        delete cleaned[key];
      }
    }

    // 2. Parse JSON fields & convert ID / numeric fields
    for (const key of Object.keys(cleaned)) {
      if (blobKeysFound.has(key)) continue;

      const val = cleaned[key];
      if (typeof val === 'string') {
        if (
          (val.startsWith('[') && val.endsWith(']')) ||
          (val.startsWith('{') && val.endsWith('}'))
        ) {
          try {
            cleaned[key] = JSON.parse(val);
            continue;
          } catch {
            // keep as string
          }
        }

        const isIdField = key === 'id' || key.endsWith('Id') || key.endsWith('_id');
        const isNumericField = /price|stock|amount|qty|quantity|discount|balance|total|sum|count|hours|minutes|rate/i.test(key);

        if (isIdField || isNumericField) {
          const num = Number(val);
          if (!isNaN(num) && val.trim() !== '') {
            cleaned[key] = num;
          }
        }
      }
    }

    return cleaned;
  });
}
