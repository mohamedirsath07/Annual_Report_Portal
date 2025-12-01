from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from uuid import uuid4
from datetime import datetime
from bson import ObjectId
from pymongo import ReturnDocument

from database import users_collection, achievements_collection
from models import (
    UserLogin,
    UserCreate,
    UserResponse,
    AchievementResponse,
    AchievementStatusUpdate,
)
from auth import verify_password, get_password_hash, create_access_token, get_current_user
from report_generator import generate_pdf_report

app = FastAPI()

UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# Enable CORS for React
origins = ["http://localhost:5173", "http://localhost:3000"] # Vite default port and custom port
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Authentication Routes ---

@app.post("/api/register", response_model=UserResponse)
async def register(user: UserCreate):
    existing_user = await users_collection.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = get_password_hash(user.password)
    new_user = user.dict()
    new_user["password"] = hashed_pw
    
    result = await users_collection.insert_one(new_user)
    created_user = await users_collection.find_one({"_id": result.inserted_id})
    created_user["_id"] = str(created_user["_id"])
    return UserResponse(**created_user)


@app.get("/api/users", response_model=List[UserResponse])
async def get_users(role: Optional[str] = None):
    query = {}
    if role:
        query["role"] = role

    records = await users_collection.find(query, {"password": 0}).to_list(100)
    for record in records:
        record["_id"] = str(record["_id"])
    return records


@app.delete("/api/users/{user_id}")
async def delete_user(user_id: str):
    try:
        result = await users_collection.delete_one({"_id": ObjectId(user_id)})
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid user id")
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"msg": "User deleted"}

@app.post("/api/login")
async def login(user: UserLogin):
    db_user = await users_collection.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": db_user["email"], "role": db_user["role"], "id": str(db_user["_id"])})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {
            "name": db_user["name"],
            "role": db_user["role"],
            "department": db_user.get("department")
        }
    }

# --- Data Routes (Placeholders for now) ---

@app.get("/api/stats")
async def get_stats():
    # In real app, perform count_documents() on collections
    return {
        "students": 1250,
        "faculty": 85,
        "reports": 42,
        "pending": 15
    }


# --- Achievement Routes ---

@app.post("/api/achievements", response_model=AchievementResponse)
async def create_achievement(
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    event_date: str = Form(...),
    department: Optional[str] = Form(None),
    proof: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in ("student", "faculty"):
        raise HTTPException(status_code=403, detail="Only students can submit achievements")

    file_url = None
    if proof:
        extension = Path(proof.filename).suffix
        file_name = f"{uuid4().hex}{extension}"
        file_path = UPLOAD_DIR / file_name
        with open(file_path, "wb") as buffer:
            while True:
                chunk = await proof.read(1024 * 1024)
                if not chunk:
                    break
                buffer.write(chunk)
        await proof.close()
        file_url = f"/uploads/{file_name}"

    achievement_doc = {
        "title": title,
        "description": description,
        "category": category,
        "event_date": event_date,
        "department": department or current_user.get("department"),
        "file_url": file_url,
        "student_id": current_user["_id"],
        "student_name": current_user.get("name"),
        "status": "pending",
        "reviewer_note": None,
        "reviewed_by": None,
        "created_at": datetime.utcnow(),
        "reviewed_at": None,
    }

    result = await achievements_collection.insert_one(achievement_doc)
    achievement_doc["_id"] = str(result.inserted_id)
    return AchievementResponse(**achievement_doc)


@app.get("/api/achievements", response_model=List[AchievementResponse])
async def list_achievements(
    status: Optional[str] = None,
    mine: bool = False,
    current_user: dict = Depends(get_current_user),
):
    query = {}
    if mine or current_user.get("role") == "student":
        query["student_id"] = current_user["_id"]
    if status:
        query["status"] = status

    cursor = achievements_collection.find(query).sort("created_at", -1)
    achievements: List[dict] = []
    async for record in cursor:
        record["_id"] = str(record["_id"])
        achievements.append(record)
    return achievements


@app.patch("/api/achievements/{achievement_id}", response_model=AchievementResponse)
async def review_achievement(
    achievement_id: str,
    payload: AchievementStatusUpdate,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in ("faculty", "admin"):
        raise HTTPException(status_code=403, detail="Only faculty/admin can review achievements")

    try:
        obj_id = ObjectId(achievement_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid achievement id")

    updated = await achievements_collection.find_one_and_update(
        {"_id": obj_id},
        {
            "$set": {
                "status": payload.status,
                "reviewer_note": payload.reviewer_note,
                "reviewed_by": current_user["_id"],
                "reviewed_at": datetime.utcnow(),
            }
        },
        return_document=ReturnDocument.AFTER,
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Achievement not found")
    updated["_id"] = str(updated["_id"])
    return AchievementResponse(**updated)


@app.get("/api/reports/annual")
@app.get("/api/reports/generate")
async def download_annual_report(
    department: Optional[str] = None,
    year: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
    allowed_roles = {"admin", "hod"}
    if current_user.get("role") not in allowed_roles:
        raise HTTPException(status_code=403, detail="Only admin or HOD can generate reports")

    query: dict = {"status": "approved"}
    if department and department.lower() != "all departments":
        query["department"] = department

    approved: List[dict] = []
    cursor = achievements_collection.find(query).sort("created_at", -1)
    async for record in cursor:
        record["_id"] = str(record["_id"])
        approved.append(record)

    stats = {"total": len(approved), "academic": 0, "research": 0, "cultural": 0}
    for record in approved:
        category = (record.get("category") or "").lower()
        if category == "academic":
            stats["academic"] += 1
        elif category == "research":
            stats["research"] += 1
        elif category in {"sports", "cultural", "sports/cultural"}:
            stats["cultural"] += 1

    achievement_payload = [
        {
            "title": item.get("title", "Untitled"),
            "category": item.get("category", "N/A"),
            "date": item.get("event_date", ""),
            "user_name": item.get("student_name", "N/A"),
            "description": item.get("description", ""),
        }
        for item in approved
    ]

    dept_label = department or "All Departments"
    target_year = year or str(datetime.utcnow().year)
    pdf_buffer = generate_pdf_report(dept_label, target_year, stats, achievement_payload)
    filename = f"{dept_label.replace(' ', '_').lower()}-{target_year.replace(' ', '_')}".strip("-")
    headers = {"Content-Disposition": f'attachment; filename="{filename or "department-report"}.pdf"'}

    return StreamingResponse(pdf_buffer, media_type="application/pdf", headers=headers)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
