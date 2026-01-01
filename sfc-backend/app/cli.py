"""CLI commands for admin tasks."""
import asyncio
import sys

from sqlalchemy import select

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.user import User
from app.services.auth import create_admin_user


async def create_admin(email: str, password: str) -> None:
    """Create an admin user."""
    async with SessionLocal() as db:
        # Check if admin already exists
        result = await db.execute(select(User).where(User.email == email.lower()))
        existing = result.scalar_one_or_none()

        if existing:
            print(f"❌ User with email '{email}' already exists.")
            if existing.role.value == "admin":
                print("   (Already an admin)")
            else:
                print("   Upgrading to admin role...")
                existing.role = "admin"
                existing.is_verified = True
                await db.commit()
                print(f"✅ User '{email}' upgraded to admin.")
            return

        try:
            user = await create_admin_user(db, email, password)
            await db.commit()
            print(f"✅ Admin user created successfully!")
            print(f"   Email: {email}")
            print(f"   User ID: {user.id}")
        except Exception as e:
            print(f"❌ Failed to create admin: {e}")
            await db.rollback()


def main():
    """CLI entry point."""
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python -m app.cli create-admin <email> <password>")
        sys.exit(1)

    command = sys.argv[1]

    if command == "create-admin":
        if len(sys.argv) != 4:
            print("Usage: python -m app.cli create-admin <email> <password>")
            sys.exit(1)

        email = sys.argv[2]
        password = sys.argv[3]

        if len(password) < 8:
            print("❌ Password must be at least 8 characters")
            sys.exit(1)

        asyncio.run(create_admin(email, password))
    else:
        print(f"Unknown command: {command}")
        print("Available commands: create-admin")
        sys.exit(1)


if __name__ == "__main__":
    main()

