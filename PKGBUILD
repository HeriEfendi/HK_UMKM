# PKGBUILD for HK UMKM (Arch Linux / CachyOS)
# Maintainer: Heri Efendi <heriefendi@github.com>

pkgname=hk-umkm-bin
_pkgname=hk-umkm
pkgver=0.21.8
pkgrel=1
pkgdesc="Aplikasi Kasir & Pembukuan UMKM (Vue + Tauri)"
arch=('x86_64')
url="https://github.com/HeriEfendi/HK_UMKM"
license=('MIT')
depends=('webkit2gtk-4.1' 'gtk3' 'cairo' 'gdk-pixbuf2' 'glib2' 'dbus' 'openssl')
provides=('hk-umkm')
conflicts=('hk-umkm')
source_x86_64=("https://github.com/HeriEfendi/HK_UMKM/releases/download/v${pkgver}/HK.UMKM_${pkgver}_amd64.AppImage")
sha256sums_x86_64=('SKIP') # Ganti dengan SHA256 file AppImage jika ingin verifikasi ketat

build() {
    chmod +x "${srcdir}/HK.UMKM_${pkgver}_amd64.AppImage"
    "${srcdir}/HK.UMKM_${pkgver}_amd64.AppImage" --appimage-extract
}

package() {
    cd "${srcdir}/squashfs-root"
    
    # Install binary & assets
    install -Dm755 "${srcdir}/squashfs-root/AppRun" "${pkgdir}/usr/bin/${_pkgname}"
    
    # Install desktop entry if present
    if [ -f "${srcdir}/squashfs-root/${_pkgname}.desktop" ]; then
        install -Dm644 "${srcdir}/squashfs-root/${_pkgname}.desktop" "${pkgdir}/usr/share/applications/${_pkgname}.desktop"
    fi
    
    # Install icons if present
    if [ -d "${srcdir}/squashfs-root/usr/share/icons" ]; then
        cp -r "${srcdir}/squashfs-root/usr/share/icons" "${pkgdir}/usr/share/"
    fi
}
