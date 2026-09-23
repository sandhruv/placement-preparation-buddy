"""One-off: promote a user to admin."""
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent / ".env")
except Exception:
    pass

from database.mongodb import get_db


def main():
    email = "admin@test.com"
    db = get_db()
    user = db.users.find_one({"email": email})
    if not user:
        print(f"NOT_FOUND: {email}")
        users = [(u.get("email"), u.get("role")) for u in db.users.find()]
        print("existing:", users)
        return
    db.users.update_one({"_id": user["_id"]}, {"$set": {"role": "admin"}})
    print(f"PROMOTED: {email} -> admin (id={user['_id']})")


if __name__ == "__main__":
    main()
