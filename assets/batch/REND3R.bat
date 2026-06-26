@echo off

REM =====================================================
REM REND3R by RAND0M KN1GHTS, XYZ
REM Ambient Video Generator (v1.1.3)
REM =====================================================
set "VER=v1.2.3"

REM ===== CONFIG =====
REM 28800 = 8 hours
REM 480 = 8 minutes
set TARGET_DURATION=28800

REM ===== DEFAULT VIDEO FILE =====
set VIDEO=00.mp4
set FIRE=fire.mp3
set BREEZE=breeze.mp3
set CRICKETS=crickets.mp3
set FOREST=forest.mp3
set RAIN=rain.mp3
set CAFE=cafe.mp3
set BEACH=beach.mp3
set CITY=city.mp3
set MAIN=rand0m_
set CAT=knight1y-8hr

REM Always map video first, audio second
set FFMPEG_COMMON=-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -t %TARGET_DURATION% -movflags +faststart

REM ===== TIMESTAMP =====
for /f "tokens=1-3 delims=/ " %%a in ("%date%") do (
  set YYYY=%%c
  set MM=%%a
  set DD=%%b
)
for /f "tokens=1-3 delims=:." %%a in ("%time%") do (
  set HH=%%a
  set MN=%%b
  set SS=%%c
)
set TS=%YYYY%-%MM%-%DD%_%HH%-%MN%-%SS%
set TS=%TS: =0%

setlocal
title R3NDER by RK, XYZ
cd /d C:\ffmpeg\bin

cls
echo.
echo.
echo                 _J1      .T--__-T_.
echo        72_     JAAA_     .-11__11_.
echo       5AA8_    BAAA_.5B3J .^^^^^. _
echo       78AAA_   5AA8--AAAB     -1YG88P
echo        _8AA8_ .PAA3. A A B.-75B8AAAA3_
echo         JAAA3A8AAA3. BAA88AAAAAA5-1T.
echo       1P8AAAA8G8AA8. BAAAA3P3AAAJ
echo      PAAAPY7_. BAA8- BAA3T. -PAAAY
echo     .3AA8_     PAAA- 3AA3     PAAA_
echo      _3AA8J171_PAAA-.3AA8.    TAAA8_
echo       .J3AAAAAAAAP .8AA8.     YAAA8.
echo         .-2YY5YYJ-  TAAAAT      Y8A3T
echo                     .BAA8-       .T.
echo                      .17T
echo.
echo by Rand0m AI and Random Knights, XYZ [%VER%]
ping localhost -n 3 >nul

:menu
cls
echo ============================================
echo REND3R by RAND0M KN1GHTS, XYZ [%VER%]
echo ============================================
echo.
echo [1] Fire
echo [2] Beach
echo [3] Breeze
echo [4] Cafe
echo [5] City
echo [6] Crickets
echo [7] Forest
echo [8] Rain
echo [9] CUSTOM
echo [10] EXIT
echo.
set /p op=Run:

if "%op%"=="1" goto fire
if "%op%"=="2" goto beach
if "%op%"=="3" goto breeze
if "%op%"=="4" goto cafe
if "%op%"=="5" goto city
if "%op%"=="6" goto crickets
if "%op%"=="7" goto forest
if "%op%"=="8" goto rain
if "%op%"=="9" goto custom
if "%op%"=="10" goto ex1t
goto menu

REM =====================================================
REM PRESETS (USE VIDEO VAR)
REM =====================================================

:fire
call :render "%VIDEO%" %FIRE% %MAIN%%CAT%-fire
goto menu

:beach
call :render "%VIDEO%" %BEACH% %MAIN%%CAT%-beach
goto menu

:breeze
call :render "%VIDEO%" %BREEZE% %MAIN%%CAT%-breeze
goto menu

:cafe
call :render "%VIDEO%" %CAFE% %MAIN%%CAT%-cafe
goto menu

:city
call :render "%VIDEO%" %CITY% %MAIN%%CAT%-city
goto menu

:crickets
call :render "%VIDEO%" %CRICKETS% %MAIN%%CAT%-crickets
goto menu

:forest
call :render "%VIDEO%" %FOREST% %MAIN%%CAT%-forest
goto menu

:rain
call :render "%VIDEO%" %RAIN% %MAIN%%CAT%-rain
goto menu

REM =====================================================
REM CUSTOM
REM =====================================================

:custom
cls
echo ----- CUSTOM RENDER -----
set /p CV=Enter MP4 filename (default: %VIDEO%):
set /p CA=Enter MP3 filename:
set /p CN=Enter output file base name:

if "%CV%"=="" set CV=%VIDEO%

if not exist "%CV%" (
  echo ERROR: Video file not found.
  pause
  goto menu
)

if not exist "%CA%" (
  echo ERROR: Audio file not found.
  pause
  goto menu
)

call :render "%CV%" "%CA%" "%CN%"
goto menu

REM =====================================================
REM RENDER CORE
REM =====================================================

:render
set V=%~1
set A=%~2
set N=%~3
set OUT=%N%_%TS%.mp4

if exist "%OUT%" (
  echo ERROR: Output already exists.
  pause
  exit /b
)

echo.
echo Rendering: %OUT%
echo Video: %V%
echo Audio: %A%
echo Duration: %TARGET_DURATION% seconds
echo.

ffmpeg ^
  -stream_loop -1 -i "%V%" ^
  -stream_loop -1 -i "%A%" ^
  %FFMPEG_COMMON% ^
  "%OUT%"

echo.
echo Render complete.
pause
exit /b

REM =====================================================
REM EXIT (WITH ASCII ART)
REM =====================================================

:ex1t
echo REND3R by RAND0M KN1GHTS, XYZ brought to you by...
echo Rand0m AI and Randomly Engineering 2025-2030 version [%VER%]
ping localhost -n 3 >nul
cls
echo.
echo.
echo      notEVILCORPEVILCORPEVILCORPEVILCORP
echo      LCORPEVILCORPEVILhCORPEVILCORPEVILC
echo      EVILCORPEVILCNd+` .yORPEVILCORPEVIL
echo      CORPEVILCORms-      /PEVILCORPEVILC
echo      ORPEVILCOh/`     `:yRPEVILCORPEVILC
echo      ORPEVIms-      .odMms--yLCORPEVILCO
echo      RPEVh/`      /hILh/`    /mCORPEVILC
echo      ORPE:       `odo-      -omVILCORPEV
echo      ILCORy.       `     ./hPEd+..yVILCO
echo      RPEVILm+`         -smCms-`    :mORP
echo      EVILCORPd:        +mh/.     `/yEVIL
echo      CORPEVILCOy.       .      -omRPEVIL
echo      CORPEVILCORm+`         `/hPEVILCORP
echo      EVILCORPEVILCd:      :smORPEVILCORP
echo      EVILCORPEVILCORy. .+dPEVILCORPEVILC
echo      ORPEVILCORPEVILCOhRPEVILCORPEVILCOR
echo      PEVILCORPEVILCORPEVILCORPEVILCORPEV
echo.
echo      ******** NOT an EVIL CORP *********
ping 127.0.0.1 -n 2 >nul
endlocal
exit
