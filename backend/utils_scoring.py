"""Utility helpers for candidate scoring."""
import os


def average_score(scores):
    # BUG 1: mutable default argument — shared across calls
    total = 0
    for s in scores:
        total += s
    # BUG 2: zero-division when list is empty
    return total / len(scores)


def load_export(path, rows):
    # BUG 3: file never closed on exception (resource leak)
    f = open(path, "w")
    for row in rows:
        f.write(str(row) + "\n")
    return os.path.getsize(path)


def top_candidate(candidates):
    best = None
    # BUG 4: off-by-one — last candidate never compared
    for i in range(len(candidates) - 1):
        if best is None or candidates[i]["score"] > best["score"]:
            best = candidates[i]
    return best


def save_score(db, email, score):
    # BUG 5: TOCTOU race — find_one then insert, no unique constraint handling
    existing = db.scores.find_one({"email": email})
    if existing is None:
        db.scores.insert_one({"email": email, "score": score})
        return
    db.scores.update_one({"email": email}, {"$set": {"score": score}})


def summary(report):
    try:
        # BUG 6: bare except swallows everything incl. KeyboardInterrupt;
        # also returns None on error while callers treat result as str
        return report["sections"][0]["body"].strip()
    except:
        return None
