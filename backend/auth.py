# auth.py — password hashing and verification using bcrypt directly.
# (We use bcrypt directly rather than passlib to avoid a known version
#  incompatibility between recent passlib and bcrypt releases.)

import bcrypt


def hash_password(plain_password: str) -> str:
    """Turn a plain password into a secure one-way hash for storage."""
    # bcrypt works on bytes and has a 72-byte limit, so we encode and trim.
    pw_bytes = plain_password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pw_bytes, salt)
    return hashed.decode("utf-8")   # store as a string


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Check a plain password against a stored hash. Returns True if they match."""
    if not password_hash:
        return False
    pw_bytes = plain_password.encode("utf-8")[:72]
    try:
        return bcrypt.checkpw(pw_bytes, password_hash.encode("utf-8"))
    except (ValueError, TypeError):
        return False