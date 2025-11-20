"""add_account_settings_tables

Revision ID: e4f2a9b1c8d3
Revises: d1a81eb5cbbd
Create Date: 2025-11-20 16:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'e4f2a9b1c8d3'
down_revision: Union[str, None] = 'd1a81eb5cbbd' # Ensure this matches your last migration ID
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create UserPreferences Table
    op.create_table(
        'userpreferences',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('currency', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default='INR'),
        sa.Column('language', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default='en'),
        sa.Column('timezone', sqlmodel.sql.sqltypes.AutoString(), nullable=False, server_default='Asia/Kolkata'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('user_id')
    )

    # 2. Create NotificationSettings Table
    op.create_table(
        'notificationsettings',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('email_messages', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('sms_messages', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('push_reminders', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('email_promotions', sa.Boolean(), nullable=False, server_default='false'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('user_id')
    )

    # 3. Create UserSession Table (For Security/Device History)
    op.create_table(
        'usersession',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('device_name', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('ip_address', sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column('location', sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column('last_active', sa.DateTime(), nullable=False),
        sa.Column('is_current', sa.Boolean(), nullable=False, server_default='false'),
        sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # 4. Add Profile Fields to User Table (Bio, Work, etc.)
    op.add_column('user', sa.Column('bio', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('work', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('location', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('school', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    op.add_column('user', sa.Column('languages', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
    # Use Postgres Array for interests
    op.add_column('user', sa.Column('interests', postgresql.ARRAY(sa.String()), nullable=True))


def downgrade() -> None:
    op.drop_column('user', 'interests')
    op.drop_column('user', 'languages')
    op.drop_column('user', 'school')
    op.drop_column('user', 'location')
    op.drop_column('user', 'work')
    op.drop_column('user', 'bio')
    op.drop_table('usersession')
    op.drop_table('notificationsettings')
    op.drop_table('userpreferences')
