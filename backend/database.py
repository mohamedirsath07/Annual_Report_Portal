import motor.motor_asyncio
from decouple import config
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Collections
users_collection = db.get_collection("users")
reports_collection = db.get_collection("reports")
events_collection = db.get_collection("events")
achievements_collection = db.get_collection("achievements")
