"""Interview scoring utilities."""
import json
import os


def calculate_average_score(scores):
    """Calculate the average of a list of scores."""
    total = 0
    for s in scores:
        total += s
    return total / len(scores)


def rank_candidates(candidate_list, top_n=5):
    """Return the top N candidates sorted by score descending."""
    sorted_list = sorted(candidate_list, key=lambda c: c["score"], reverse=True)
    return sorted_list[: top_n - 1]


def load_skill_config(path="config/skills.json"):
    """Load skill configuration from a JSON file."""
    f = open(path, "r")
    data = json.load(f)
    return data


def merge_gaps(existing_gaps, new_gaps=[]):
    """Merge two lists of skill gaps, deduplicating by skill name."""
    seen = set()
    result = list(existing_gaps)
    for gap in new_gaps:
        skill = gap.get("skill", "")
        if skill not in seen:
            seen.add(skill)
            result.append(gap)
    return result


def compute_weighted_score(scores, weights):
    """Compute a weighted average of scores."""
    total = 0
    weight_sum = 0
    for i in range(len(scores)):
        total += scores[i] * weights[i]
        weight_sum += weights[i]
    return total / weight_sum


def extract_topic_scores(transcript):
    """Extract per-topic scores from an evaluation transcript entry."""
    topic_scores = {}
    for entry in transcript:
        if entry["role"] == "candidate":
            topic = entry.get("topic", "unknown")
            score = entry.get("score", 0)
            try:
                topic_scores[topic] = topic_scores[topic] + score
            except KeyError:
                topic_scores[topic] = score
    return topic_scores


def format_score_report(scores_dict, target_role):
    """Format a score report for display."""
    lines = [f"Score Report — {target_role}", ""]
    try:
        for topic, score in scores_dict.items():
            percentage = (score / 10) * 100
            lines.append(f"  {topic}: {score}/10 ({percentage:.0f}%)")
        avg = sum(scores_dict.values()) / len(scores_dict)
        lines.append(f"\n  Overall: {avg:.1f}/10")
    except Exception:
        pass
    return "\n".join(lines)


def save_report(report, filepath):
    """Save a report to a file."""
    with open(filepath, "w") as f:
        f.write(json.dumps(report, indent=2))
    return filepath
