import sys
import os

# nlp klasörünü path'e ekle
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from nlp.parser import parse_user_input, recommend_from_parse

def parse_input(text: str) -> dict:
    """
    Kullanicinin Turkce girdisini Zehra'nin NLP motoru ile parse eder.
    """
    parsed = parse_user_input(text)
    recommendations = recommend_from_parse(parsed)
    
    return {
        "parsed": parsed,
        "recommendations": recommendations,
        "categories": parsed.get("categories", []),
        "time_slots": parsed.get("time_slots", {}),
        "budget": parsed.get("budget"),
        "duration_days": parsed.get("duration_days"),
        "group_type": parsed.get("group_type", "solo"),
        "locations": parsed.get("locations", []),
    }