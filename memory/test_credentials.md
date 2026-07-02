# Test Credentials — LUMYO

No authentication in this app (frontend-only marketing site + public leads endpoint).

## Backend
- Leads API: `POST {REACT_APP_BACKEND_URL}/api/leads`  body: {name,email,service,message,language}
- List leads: `GET {REACT_APP_BACKEND_URL}/api/leads`
- MongoDB: local (MONGO_URL / DB_NAME=lumyo), collection `leads`

## Email (Resend)
- RESEND_API_KEY in /app/backend/.env is EMPTY until the user provides it.
- While empty, leads are stored with `notified:false` and NO email is sent (by design, no error).
