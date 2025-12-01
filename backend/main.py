from fastapi import FastAPI, HTTPException, Depends, status
from typing import List, Optional
from fastapi.middleware.cors import CORSMiddleware
from database import users_collection
from models import UserLogin, UserCreate, UserResponse
from auth import verify_password, get_password_hash, create_access_token
from bson import ObjectId

app = FastAPI()

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
