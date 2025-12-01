import asyncio
from database import client

async def test_connection():
    try:
        # Test connection
        await client.admin.command('ping')
        print('✅ Successfully connected to MongoDB Atlas!')
        
        # Get server info
        info = await client.server_info()
        print(f'MongoDB version: {info["version"]}')
        print(f'Connection: {info["ok"]}')
        
        return True
    except Exception as e:
        print(f'❌ Connection failed: {e}')
        return False

if __name__ == "__main__":
    asyncio.run(test_connection())
