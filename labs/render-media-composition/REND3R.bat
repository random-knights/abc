@echo off
setlocal enabledelayedexpansion
REM =====================================================
REM  REND3R by RAND0M KN1GHTS, XYZ  (classroom edition)
REM  Ambient video generator - loops a video over an audio bed.
REM  PATH-based + self-contained: NO ffmpeg binary lives in the repo.
REM =====================================================
set "VER=v1.2.3-classroom"

REM ----- ffmpeg must be installed and on PATH (see README.md, step 1) -----
where ffmpeg >nul 2>nul
if errorlevel 1 (
  echo [!] ffmpeg was not found on your PATH.
  echo     Install it once, then re-run this script:
  echo       winget install Gyan.FFmpeg     ^(Windows^)
  echo       choco  install ffmpeg          ^(Windows, alt^)
  echo       brew   install ffmpeg          ^(macOS^)
  echo     or download from https://ffmpeg.org/download.html and add it to PATH.
  pause
  exit /b 1
)

REM ----- duration in seconds: 8 = quick test, 480 = 8 min, 28800 = 8 hours -----
set "TARGET_DURATION=8"

REM ----- paths are relative to THIS script (classroom-safe, portable) -----
set "ROOT=%~dp0"
set "IN=%ROOT%workspace\input"
set "OUT=%ROOT%workspace\output"
if not exist "%IN%"  mkdir "%IN%"
if not exist "%OUT%" mkdir "%OUT%"

set "VIDEO=%IN%\sample-video.mp4"
set "AUDIO=%IN%\sample-audio.mp3"

REM video first, audio second; copy video stream, re-encode audio to aac
set "FFMPEG_COMMON=-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -t %TARGET_DURATION% -movflags +faststart"

REM ----- timestamp for the output filename -----
for /f "tokens=1-3 delims=/ " %%a in ("%date%") do (
  set "YYYY=%%c"
  set "MM=%%a"
  set "DD=%%b"
)
for /f "tokens=1-3 delims=:." %%a in ("%time%") do (
  set "HH=%%a"
  set "MN=%%b"
  set "SS=%%c"
)
set "TS=%YYYY%-%MM%-%DD%_%HH%-%MN%-%SS%"
set "TS=%TS: =0%"

title REND3R by RK, XYZ [%VER%]
echo ============================================
echo  REND3R by RAND0M KN1GHTS, XYZ  [%VER%]
echo  ambient render : video loop + audio bed
echo ============================================
echo.
echo  duration : %TARGET_DURATION%s   ^(edit TARGET_DURATION at top^)
echo  video    : %VIDEO%
echo  audio    : %AUDIO%
echo  output   : %OUT%
echo.

if not exist "%VIDEO%" (
  echo [!] Missing %VIDEO%
  echo     Add a classroom-safe sample - see README.md, step 2.
  pause
  exit /b 1
)
if not exist "%AUDIO%" (
  echo [!] Missing %AUDIO%
  echo     Add a classroom-safe sample - see README.md, step 2.
  pause
  exit /b 1
)

set "RENDER=%OUT%\rand0m_render_%TS%.mp4"
echo Rendering -^> %RENDER%
echo.
ffmpeg -stream_loop -1 -i "%VIDEO%" -stream_loop -1 -i "%AUDIO%" %FFMPEG_COMMON% "%RENDER%"

echo.
if exist "%RENDER%" (
  echo Done. Output: %RENDER%
) else (
  echo [!] Render did not produce an output - check the ffmpeg log above.
)
pause
endlocal
