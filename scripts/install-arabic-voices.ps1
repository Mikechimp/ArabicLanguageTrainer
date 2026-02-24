#Requires -RunAsAdministrator
<#
.SYNOPSIS
    Installs Arabic language features required for TTS in the Arabic Language Trainer.

.DESCRIPTION
    This script installs the Windows language capabilities needed for Arabic
    text-to-speech to work with the Arabic Language Trainer application.

    The application uses Chromium's Web Speech API which delegates to Windows
    SAPI/OneCore voices. These voices must be installed as Windows capabilities.

    Required capabilities:
      - Language.Basic~~~ar-SA~0.0.1.0        (Arabic base language)
      - Language.TextToSpeech~~~ar-SA~0.0.1.0  (Arabic TTS voice - Naayf)
      - Language.Handwriting~~~ar-SA~0.0.1.0   (Arabic handwriting, optional)

.NOTES
    Must be run as Administrator (elevated PowerShell).
    May require internet access to download language packs.
    A restart may be required after installation.
#>

param(
    [switch]$IncludeHandwriting,
    [switch]$CheckOnly
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Arabic Language Trainer - Voice Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "ERROR: This script must be run as Administrator." -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'." -ForegroundColor Yellow
    exit 1
}

# Define required capabilities
$capabilities = @(
    @{ Name = "Language.Basic~~~ar-SA~0.0.1.0"; Description = "Arabic (Saudi Arabia) Base Language" },
    @{ Name = "Language.TextToSpeech~~~ar-SA~0.0.1.0"; Description = "Arabic Text-to-Speech Voice (Naayf)" }
)

if ($IncludeHandwriting) {
    $capabilities += @{ Name = "Language.Handwriting~~~ar-SA~0.0.1.0"; Description = "Arabic Handwriting Recognition" }
}

# Check current state
Write-Host "Checking current Arabic language capabilities..." -ForegroundColor White
Write-Host ""

$allInstalled = $true
foreach ($cap in $capabilities) {
    $status = Get-WindowsCapability -Online -Name $cap.Name -ErrorAction SilentlyContinue
    if ($status.State -eq "Installed") {
        Write-Host "  [INSTALLED] $($cap.Description)" -ForegroundColor Green
    } elseif ($status.State -eq "NotPresent") {
        Write-Host "  [MISSING]   $($cap.Description)" -ForegroundColor Yellow
        $allInstalled = $false
    } else {
        Write-Host "  [$($status.State)] $($cap.Description)" -ForegroundColor Yellow
        $allInstalled = $false
    }
}

Write-Host ""

if ($CheckOnly) {
    if ($allInstalled) {
        Write-Host "All required capabilities are installed." -ForegroundColor Green
    } else {
        Write-Host "Some capabilities are missing. Run without -CheckOnly to install." -ForegroundColor Yellow
    }

    # Also show SAPI voices
    Write-Host ""
    Write-Host "Checking installed SAPI voices..." -ForegroundColor White
    try {
        Add-Type -AssemblyName System.Speech
        $synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
        $voices = $synth.GetInstalledVoices() | Where-Object { $_.Enabled }
        foreach ($voice in $voices) {
            $info = $voice.VoiceInfo
            $isArabic = $info.Culture.Name.StartsWith("ar")
            $color = if ($isArabic) { "Green" } else { "Gray" }
            $prefix = if ($isArabic) { ">> " } else { "   " }
            Write-Host "  ${prefix}$($info.Name) | $($info.Culture.Name) | $($info.Gender) | $($info.Age)" -ForegroundColor $color
        }
        if ($voices.Count -eq 0) {
            Write-Host "  No SAPI voices found." -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  Could not query SAPI voices: $_" -ForegroundColor Yellow
    }

    # Check OneCore registry
    Write-Host ""
    Write-Host "Checking OneCore voice registry..." -ForegroundColor White
    $regPath = "HKLM:\SOFTWARE\Microsoft\Speech_OneCore\Voices\Tokens"
    if (Test-Path $regPath) {
        $tokens = Get-ChildItem $regPath
        foreach ($token in $tokens) {
            $name = (Get-ItemProperty $token.PSPath).'(default)'
            $attrs = "$($token.PSPath)\Attributes"
            $lang = if (Test-Path $attrs) { (Get-ItemProperty $attrs -ErrorAction SilentlyContinue).Language } else { "unknown" }
            # Arabic language codes start with 0401
            $isArabic = $lang -like "0401*" -or $name -like "*Arabic*" -or $name -like "*Naayf*" -or $name -like "*Hoda*"
            $color = if ($isArabic) { "Green" } else { "Gray" }
            $prefix = if ($isArabic) { ">> " } else { "   " }
            Write-Host "  ${prefix}$name | LangID=$lang" -ForegroundColor $color
        }
    } else {
        Write-Host "  OneCore voice registry not found at $regPath" -ForegroundColor Yellow
    }

    exit 0
}

if ($allInstalled) {
    Write-Host "All required capabilities are already installed!" -ForegroundColor Green
} else {
    Write-Host "Installing missing capabilities..." -ForegroundColor White
    Write-Host "(This may take a few minutes and requires internet access)" -ForegroundColor Gray
    Write-Host ""

    $restartNeeded = $false
    foreach ($cap in $capabilities) {
        $status = Get-WindowsCapability -Online -Name $cap.Name -ErrorAction SilentlyContinue
        if ($status.State -ne "Installed") {
            Write-Host "  Installing: $($cap.Description)..." -ForegroundColor Cyan -NoNewline
            try {
                $result = Add-WindowsCapability -Online -Name $cap.Name -ErrorAction Stop
                if ($result.RestartNeeded) {
                    $restartNeeded = $true
                    Write-Host " Done (restart required)" -ForegroundColor Yellow
                } else {
                    Write-Host " Done" -ForegroundColor Green
                }
            } catch {
                Write-Host " FAILED: $_" -ForegroundColor Red
            }
        }
    }

    Write-Host ""
    if ($restartNeeded) {
        Write-Host "A restart is required to complete installation." -ForegroundColor Yellow
        Write-Host "Please restart your computer, then launch the Arabic Language Trainer." -ForegroundColor Yellow
    } else {
        Write-Host "Installation complete!" -ForegroundColor Green
        Write-Host "You may need to restart the Arabic Language Trainer for voices to appear." -ForegroundColor White
    }
}

Write-Host ""
Write-Host "Tip: In the Arabic Language Trainer, go to Settings to verify TTS voice detection." -ForegroundColor Gray
Write-Host ""
