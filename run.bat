@echo off
echo "starting process"
"bin\electron.exe" "bin\resources\app.asar" --dummy=arg --config="%CD%\config.json" %*
echo "done!"
pause
