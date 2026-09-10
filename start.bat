@echo off
echo ========================================================
echo  Starting BISAG-N (MeitY) VAPT Dashboard Platform...
echo ========================================================
start cmd /k "cd /d E:\VAPT\backend && npm start"
start cmd /k "cd /d E:\VAPT\frontend && npm run dev"
echo Backend running on http://localhost:5000
echo Frontend running on http://localhost:5173
