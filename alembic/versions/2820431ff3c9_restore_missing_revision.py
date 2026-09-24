"""restore missing migration revision

Revision ID: 2820431ff3c9
Revises: PUT_THE_REAL_PARENT_REVISION_HERE
"""

from typing import Sequence, Union

from alembic import op


revision: str = "2820431ff3c9"
down_revision: Union[str, Sequence[str], None] = "PUT_THE_REAL_PARENT_REVISION_HERE"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass

