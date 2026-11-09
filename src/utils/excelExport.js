import * as XLSX from 'xlsx'
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export async function exportWorkbookToExcel(workbook, fileName, dialogTitle = 'Simpan File Excel') {
  if (Capacitor.isNativePlatform()) {
    const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' })
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `export_${safeName}`
    await Filesystem.writeFile({
      path,
      data: base64,
      directory: Directory.Cache,
    })
    const { uri } = await Filesystem.getUri({
      path,
      directory: Directory.Cache,
    })
    await Share.share({
      title: fileName,
      files: [uri],
      dialogTitle,
    })
    return
  }

  XLSX.writeFile(workbook, fileName)
}

