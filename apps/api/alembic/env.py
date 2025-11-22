import asyncio
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlmodel import SQLModel
from app.models import User, PayoutAccount, ParkingLot, ParkingSpot, Amenity, LotAmenity, Review, Booking, SpotAvailability, PricingRule, Payment, OTPVerification, UserPreferences, NotificationSettings, UserSession
import geoalchemy2
from alembic import context
from app.config import settings

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata

# OVERRIDE URL FROM CONFIG
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://"))

# --- NEW: Filter Function to Ignore PostGIS Tables ---
def include_object(object, name, type_, reflected, compare_to):
    if type_ == "table" and name in [
        "spatial_ref_sys", "geometry_columns", "geography_columns", "raster_columns", "raster_overviews",
        "addr", "edges", "faces", "loader_lookuptables", "loader_platform", "loader_variables",
        "pagc_gaz", "pagc_lex", "pagc_rules", "place", "secondary_unit_lookup", "state_lookup",
        "street_type_lookup", "tabblock", "tabblock20", "tract", "zcta5", "zip_lookup", "zip_state", "zip_state_loc",
        "layer", "topology"
    ]:
        return False
    return True

def run_migrations_offline():
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_object=include_object, # <--- ADDED
    )

    with context.begin_transaction():
        context.run_migrations()

def do_run_migrations(connection: Connection):
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_object=include_object # <--- ADDED
    )

    with context.begin_transaction():
        context.run_migrations()

async def run_migrations_online():
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()

if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
