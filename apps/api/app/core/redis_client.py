import redis.asyncio as redis
from app.config import settings

# Create the Redis Pool
pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)

def get_redis():
    """Dependency for routes that need direct Redis access"""
    return redis.Redis(connection_pool=pool)

# Singleton instance for direct imports if needed
pool = redis.ConnectionPool.from_url(settings.REDIS_URL, decode_responses=True)
redis_client = redis.Redis(connection_pool=pool)
