// Desktop App Installation & Launcher Utilities for Chromebook, Windows, and Mac

export type SupportedOS = 'chromebook' | 'windows' | 'mac' | 'other';

/**
 * Detect user's current operating system
 */
export function detectUserOS(): SupportedOS {
  if (typeof window === 'undefined') return 'other';
  const ua = navigator.userAgent.toLowerCase();
  
  if (ua.includes('cros') || ua.includes('chromebook')) {
    return 'chromebook';
  }
  if (ua.includes('win')) {
    return 'windows';
  }
  if (ua.includes('mac') || ua.includes('macintosh') || ua.includes('darwin')) {
    return 'mac';
  }
  return 'other';
}

/**
 * Check if the application is currently running as an installed standalone app
 */
export function isRunningInStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // @ts-expect-error navigator.standalone is standard on iOS/WebKit PWA
    Boolean(window.navigator.standalone) ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Generate and download a Windows Desktop Shortcut (.url / .bat)
 */
export function downloadWindowsDesktopLauncher(appUrl: string = window.location.href) {
  const cleanUrl = appUrl.split('#')[0];
  
  // Windows .url Internet Shortcut file
  const urlContent = `[InternetShortcut]\r\nURL=${cleanUrl}\r\nIconIndex=0\r\nIconFile=${cleanUrl}/icon.svg\r\nHotKey=0\r\n[{000214A0-0000-0000-C000-000000000046}]\r\nProp3=19,0\r\n`;
  
  const blob = new Blob([urlContent], { type: 'application/octet-stream' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'BioAR_Board_Desktop.url';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/**
 * Generate and download a Windows Standalone Window Batch Launcher (.bat)
 * Opens Edge or Chrome directly in standalone kiosk/app window mode without browser address bar
 */
export function downloadWindowsAppLauncher(appUrl: string = window.location.href) {
  const cleanUrl = appUrl.split('#')[0];
  
  const batContent = `@echo off
title Launching BioAR Board Desktop App...
echo Starting BioAR Board in Standalone App Window...
start msedge --app="${cleanUrl}" 2>nul || start chrome --app="${cleanUrl}" 2>nul || start "" "${cleanUrl}"
exit
`;
  
  const blob = new Blob([batContent], { type: 'application/x-bat' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Launch_BioAR_Board_Windows.bat';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/**
 * Generate and download a Mac Desktop Shortcut (.webloc)
 */
export function downloadMacDesktopLauncher(appUrl: string = window.location.href) {
  const cleanUrl = appUrl.split('#')[0];
  
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>URL</key>
	<string>${cleanUrl}</string>
</dict>
</plist>`;
  
  const blob = new Blob([plistContent], { type: 'application/xml' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'BioAR_Board_Mac.webloc';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/**
 * Generate and download a Mac Standalone Command Script (.command)
 */
export function downloadMacCommandLauncher(appUrl: string = window.location.href) {
  const cleanUrl = appUrl.split('#')[0];
  
  const shContent = `#!/bin/bash
# BioAR Board macOS Standalone Window Launcher
open -na "Google Chrome" --args --app="${cleanUrl}" || open -na "Microsoft Edge" --args --app="${cleanUrl}" || open "${cleanUrl}"
`;
  
  const blob = new Blob([shContent], { type: 'application/x-sh' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Launch_BioAR_Board_Mac.command';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}

/**
 * Generate and download a Linux / Chromebook Desktop Entry file (.desktop)
 */
export function downloadChromebookDesktopEntry(appUrl: string = window.location.href) {
  const cleanUrl = appUrl.split('#')[0];
  
  const desktopContent = `[Desktop Entry]
Version=1.0
Type=Application
Name=BioAR Board
Comment=Image Recognition AR Biology Bulletin Board App
Exec=google-chrome --app=${cleanUrl}
Icon=applications-science
Terminal=false
Categories=Education;Science;
StartupWMClass=bioar-board
`;

  const blob = new Blob([desktopContent], { type: 'application/x-desktop' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bioar-board.desktop';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(a.href);
}
