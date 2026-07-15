; =============================================================================
; AutoCore ERP — Script NSIS Customizado
; Personaliza o assistente de instalação para Português do Brasil
; =============================================================================

; Verificar se Node.js está instalado (necessário para o servidor interno)
!macro customInit
  ; Verificar versão do Windows (mínimo: Windows 10)
  ${If} ${AtLeastWin10}
    ; OK
  ${Else}
    MessageBox MB_OK|MB_ICONEXCLAMATION "O AutoCore ERP requer Windows 10 ou superior."
    Quit
  ${EndIf}
!macroend

; Ações após instalação
!macro customInstall
  ; Criar regra no firewall para a porta 3333 (API interna)
  nsExec::ExecToLog 'netsh advfirewall firewall add rule name="AutoCore ERP API" dir=in action=allow protocol=TCP localport=3333 profile=private'
  
  ; Criar chave de registro para associação de arquivos .autocore
  WriteRegStr HKLM "Software\AutoCore\ERP" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "Software\AutoCore\ERP" "Version" "${VERSION}"
!macroend

; Ações ao desinstalar
!macro customUnInstall
  ; Remover regra do firewall
  nsExec::ExecToLog 'netsh advfirewall firewall delete rule name="AutoCore ERP API"'
  
  ; Remover chaves de registro
  DeleteRegKey HKLM "Software\AutoCore\ERP"
!macroend
