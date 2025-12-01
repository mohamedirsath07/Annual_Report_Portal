import asyncio
from database import users_collection
from auth import get_password_hash

async def create_admin():
    try:
        # Check if admin already exists
        existing = await users_collection.find_one({"email": "admin@college.edu"})
        if existing:
            print("Admin user already exists!")
            return
        
        # Create admin user
        admin_user = {
            "name": "Super Admin",
            "email": "admin@college.edu",
            "password": get_password_hash("admin123"),
            "role": "admin",
            "department": None
        }
        
        result = await users_collection.insert_one(admin_user)
        print(f"✅ Admin user created successfully!")
        print(f"   Email: admin@college.edu")
        print(f"   Password: admin123")
        print(f"   Role: admin")
        print(f"   User ID: {result.inserted_id}")
        
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(create_admin())
