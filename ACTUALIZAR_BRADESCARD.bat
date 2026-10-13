@echo off
cd /d "%~dp0"
set "BRADESCARD_PYTHON=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
if not exist "%BRADESCARD_PYTHON%" set "BRADESCARD_PYTHON=python"
set /p "BRADESCARD_PERIODO=Periodo (AAAA-MM, por ejemplo 2026-10): "
"%BRADESCARD_PYTHON%" actualizar.py --base "inputs/BASE DE TIENDAS BRADESCARD (7).xlsx" --asistencia "inputs/ASISTENCIA BRADESCARD.xlsb" --periodo "%BRADESCARD_PERIODO%"
if errorlevel 1 goto failed
echo Actualizacion completada. Abre site\index.html y recarga el panel.
pause
exit /b 0
:failed
echo No se pudo actualizar. Se conserva el panel anterior.
pause
exit /b 1
