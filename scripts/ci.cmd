@echo off

FOR /F "tokens=* usebackq" %%F IN (`powershell -Command "& { Import-Module %~dp0GetCI; Get-CICommand %* }"`) DO (
    SET args=%%F
)

echo ^> cmd /c %args%
cmd /c %args%
