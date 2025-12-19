
# Backend start
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Frontend start
cd ../frontend
npm install
npm run start
