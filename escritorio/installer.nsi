; Galia Shop · Instalador para Windows (por usuario, no requiere administrador)
Unicode true
SetCompressor /SOLID lzma
!include "MUI2.nsh"

!define APPNAME "Galia Shop"
!define EXENAME "GaliaShop.exe"
!define VERSION "1.0.0"
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\GaliaShop"

Name "${APPNAME}"
OutFile "dist\GaliaShop-Instalador-${VERSION}.exe"
InstallDir "$LOCALAPPDATA\Programs\Galia Shop"
InstallDirRegKey HKCU "Software\GaliaShop" "InstallDir"
RequestExecutionLevel user
BrandingText "Galia Shop · Ventas e inventario"
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "${APPNAME}"
VIAddVersionKey "FileDescription" "Instalador de Galia Shop"
VIAddVersionKey "CompanyName" "Galia Shop"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"
VIAddVersionKey "LegalCopyright" "Galia Shop"

!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define MUI_ABORTWARNING
!define MUI_WELCOMEPAGE_TITLE "Instalar Galia Shop"
!define MUI_WELCOMEPAGE_TEXT "Este asistente instalará Galia Shop en esta computadora.$\r$\n$\r$\nLa app guarda ventas e inventario en la hoja de Google Drive de la tienda, por lo que necesita internet para funcionar.$\r$\n$\r$\nPulsa Siguiente para continuar."
!define MUI_FINISHPAGE_RUN "$INSTDIR\${EXENAME}"
!define MUI_FINISHPAGE_RUN_TEXT "Abrir Galia Shop ahora"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_LANGUAGE "Spanish"

Section "Galia Shop" SecMain
  ; Cierra la app si estaba abierta (actualización)
  nsExec::Exec 'taskkill /F /IM "${EXENAME}"'
  Sleep 500
  SetOutPath "$INSTDIR"
  File /r "dist\win-unpacked\*.*"
  File "icon.ico"
  WriteUninstaller "$INSTDIR\Desinstalar Galia Shop.exe"

  CreateShortCut "$DESKTOP\Galia Shop.lnk" "$INSTDIR\${EXENAME}" "" "$INSTDIR\${EXENAME}" 0
  CreateDirectory "$SMPROGRAMS\Galia Shop"
  CreateShortCut "$SMPROGRAMS\Galia Shop\Galia Shop.lnk" "$INSTDIR\${EXENAME}" "" "$INSTDIR\${EXENAME}" 0
  CreateShortCut "$SMPROGRAMS\Galia Shop\Desinstalar Galia Shop.lnk" "$INSTDIR\Desinstalar Galia Shop.exe"

  WriteRegStr HKCU "Software\GaliaShop" "InstallDir" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayName" "${APPNAME}"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINSTKEY}" "Publisher" "Galia Shop"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\icon.ico"
  WriteRegStr HKCU "${UNINSTKEY}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${UNINSTKEY}" "UninstallString" '"$INSTDIR\Desinstalar Galia Shop.exe"'
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  nsExec::Exec 'taskkill /F /IM "${EXENAME}"'
  Sleep 500
  Delete "$DESKTOP\Galia Shop.lnk"
  RMDir /r "$SMPROGRAMS\Galia Shop"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "${UNINSTKEY}"
  DeleteRegKey HKCU "Software\GaliaShop"
SectionEnd
