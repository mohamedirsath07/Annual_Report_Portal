# MongoDB Atlas Setup Guide

## Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for a free account
3. Click "Create" to create a new cluster

## Step 2: Create a Cluster
1. Choose **FREE** tier (M0)
2. Select your preferred **Cloud Provider** (AWS, Google Cloud, or Azure)
3. Choose a **Region** close to you
4. Click **Create Cluster** (takes 3-5 minutes)

## Step 3: Create Database User
1. In the left sidebar, click **Database Access**
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Enter:
   - Username: `admin`
   - Password: `YourSecurePassword123` (remember this!)
5. Set **Database User Privileges** to: `Read and write to any database`
6. Click **Add User**

## Step 4: Whitelist Your IP Address
1. In the left sidebar, click **Network Access**
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (for development)
   - This adds `0.0.0.0/0`
   - ⚠️ For production, use your specific IP
4. Click **Confirm**

## Step 5: Get Connection String
1. Go back to **Database** (left sidebar)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Select **Driver**: Python, **Version**: 3.12 or later
5. Copy the connection string, it looks like:
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 6: Update Your .env File
Open `backend/.env` and update:

```env
# MongoDB Atlas Configuration
MONGO_URI=mongodb+srv://admin:YourSecurePassword123@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
DB_NAME=annual_report_portal
```

**Important:** Replace:
- `admin` with your database username
- `YourSecurePassword123` with your actual password
- `cluster0.xxxxx.mongodb.net` with your cluster URL

## Step 7: Test Connection
Run this command to test:
```powershell
cd backend
python -c "from database import client; print(client.server_info())"
```

If successful, you'll see MongoDB server information!

## Step 8: Restart Backend
After updating `.env`, restart your backend server:
1. Stop the current backend (Ctrl+C in the terminal)
2. Run: `python main.py`

## ✅ Your app is now connected to MongoDB Atlas!

---

## Troubleshooting

### Error: "Authentication failed"
- Check username and password in MONGO_URI
- Make sure password doesn't contain special characters like `@`, `#`, `:` (URL encode them if needed)

### Error: "Connection timeout"
- Check Network Access settings in Atlas
- Ensure `0.0.0.0/0` is added (or your specific IP)

### Error: "dnspython module not found"
- Run: `pip install dnspython`

---

## Current Setup (Local MongoDB)
Your current `.env` is set to use **local MongoDB**:
```
MONGO_URI=mongodb://localhost:27017
DB_NAME=annual_report_portal
```

This works if you have MongoDB installed locally and running.

To check if local MongoDB is running:
```powershell
Get-Process -Name mongod
```

---

## Achievements API & File Uploads

- Uploaded proofs are stored inside the backend `uploads/` folder and served statically at `http://<backend-host>/uploads/<fileName>`.
- Keep `uploads/` out of version control (already listed in `.gitignore`). Ensure the folder exists on the server and has write permissions.
- Endpoints (all require a valid `Authorization: Bearer <token>` header):
   - `POST /api/achievements` — `multipart/form-data` payload with `title`, `description`, `category`, `event_date`, optional `department`, and optional `proof` file. Automatically ties the record to the authenticated student.
   - `GET /api/achievements?mine=true` — students fetch their own submissions. Faculty/Admin can add `status=pending|approved|rejected` to filter across the department.
   - `PATCH /api/achievements/{id}` — faculty/admin approve or reject a submission by sending `{ "status": "approved" | "rejected", "reviewer_note": "optional" }`.

> 🔐 The backend now decodes JWT tokens via `get_current_user` to secure these routes, so make sure the frontend always sends the token (Axios interceptor already handles this).
