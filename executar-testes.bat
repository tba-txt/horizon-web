@echo off
echo ========================================================
echo   Horizon Web - Executando Testes Unitarios (Vitest)
echo ========================================================
cd /d "%~dp0"
set NODE_OPTIONS=--experimental-require-module
call npm test -- --watch=false
echo.
echo ========================================================
echo   Execucao concluida! Verifique os resultados acima.
echo ========================================================
pause
