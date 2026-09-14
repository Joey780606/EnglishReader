@echo off
setlocal

cd /d "%~dp0"

if not exist "backend\venv" (
    echo Creating Python virtual environment...
    python -m venv backend\venv
)

call backend\venv\Scripts\activate.bat
pip install -q -r backend\requirements.txt

echo Building frontend...
pushd frontend
call npm install
call npm run build
popd

echo Starting server at http://localhost:8000
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8000
