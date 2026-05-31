"""
chat_engine.py
──────────────
Sayfa 2 için ana sohbet motoru.

AKIŞ:
  1. Kullanıcı ilk mesajda ne kadar bilgi verirse versin hepsini topla.
  2. Bütçe hâlâ eksikse → sadece bütçeyi sor (tek soru).
  3. Bütçe geldikten sonra yeterli bilgi varsa → öneri üret.
  4. Başka hiçbir şey sorma; kullanıcı isterse ek bilgi verir.
"""

from nlp.parser import parse_user_input, ConversationSession
from nlp.recommender import get_recommendations, hybrid_recommend, CATEGORY_LABELS_TR


class ChatEngine:
    """
    Tek kullanıcı oturumu için sohbet motoru.
    Her kullanıcıya ayrı bir ChatEngine örneği oluştur.
    """

    GREETING_RESPONSE = (
        "Merhaba! Antalya gezin için sana özel aktiviteler önerebilirim. "
        "Ne tür bir gezi planlıyorsun, biraz anlat bakalım."
    )

    BUDGET_QUESTION = (
        "Anlıyorum! Sana en uygun yerleri önerebilmem için "
        "yaklaşık bütçeni de bilmem yeterli. Ne kadar ayırdın bu gezi için?"
    )

    READY_RESPONSE_TEMPLATE = (
        "Harika, sana uygun aktiviteleri buldum! "
        "Bütçen ({budget} TL){days_part} için "
        "en iyi eşleşen seçenekler aşağıda. 👇"
    )

    GREETING_TRIGGERS = [
        "merhaba", "selam", "hey", "iyi günler", "iyi akşamlar",
        "hi", "hello", "naber",
    ]

    def __init__(self):
        self.session = ConversationSession()

    def handle_message(self, user_text: str) -> dict:
        """
        Kullanıcının bir mesajını işler ve yanıt üretir.

        Returns:
            {
                "reply": str,
                "recommendations": list | None,
                "budget_plan": dict | None,
                "budget_swaps": list,
                "state": "greeting" | "need_budget" | "ready",
                "session_summary": dict,
            }
        """
        text_lower = user_text.lower().strip()

        # ── İlk mesaj sadece selamlama mı? ──────────────────────────────
        is_only_greeting = (
            self.session.turn_count == 0
            and any(t in text_lower for t in self.GREETING_TRIGGERS)
            and len(text_lower.split()) <= 4
        )

        if is_only_greeting:
            parsed = parse_user_input(user_text)
            self.session.update(parsed)
            return {
                "reply": self.GREETING_RESPONSE,
                "recommendations": None,
                "budget_plan": None,
                "budget_swaps": [],
                "state": "greeting",
                "session_summary": self.session.summary(),
            }

        # ── Normal mesaj: parse et, session'a ekle ───────────────────────
        parsed = parse_user_input(user_text)
        self.session.update(parsed)

        # ── Bütçe hâlâ yok → tek soru sor ──────────────────────────────
        if self.session.collected["budget"] is None:
            ack = self._acknowledge_what_we_know()
            reply = f"{ack} {self.BUDGET_QUESTION}" if ack else self.BUDGET_QUESTION
            return {
                "reply": reply,
                "recommendations": None,
                "budget_plan": None,
                "budget_swaps": [],
                "state": "need_budget",
                "session_summary": self.session.summary(),
            }

        # ── Bütçe var → öneri üret ──────────────────────────────────────
        return self._produce_recommendations()

    # ────────────────────────────────────────────────────────────────────

    def _acknowledge_what_we_know(self) -> str:
        """
        Toplanan bilgileri onaylayan kısa bir cümle.
        Hiç bilgi yoksa boş string döner.
        """
        c = self.session.collected
        parts = []

        if c["duration_days"]:
            parts.append(f"{c['duration_days']} günlük geziyi")

        if c["group_type"] and c["group_type"] != "solo":
            label = {
                "family":  "aileyle",
                "couple":  "çift olarak",
                "friends": "arkadaşlarla",
            }.get(c["group_type"], c["group_type"])
            parts.append(label)

        if c["categories"]:
            cat_names = [
                CATEGORY_LABELS_TR.get(cat, cat)
                for cat in c["categories"][:3]
            ]
            parts.append(f"{', '.join(cat_names)} ilgini")

        if not parts:
            return ""
        return f"{' ve '.join(parts)} not aldım."

    def _produce_recommendations(self) -> dict:
        """
        Yeterli bilgi varsa hybrid_recommend çağırır, yanıt üretir.
        """
        normalized_prefs = self.session.to_normalized_prefs()
        
        # 🚨 DÜZELTME: Kategori kısıtlamasının doğru çalışması ve sızma olmaması için
        # collected içindeki 'categories', 'keywords' ve 'sentiment_vector' hybrid_recommend'e beslendi.
        parsed_collected = {
            "age_groups":       self.session.collected["age_groups"],
            "is_family_trip":   self.session.collected["is_family_trip"],
            "time_slots":       self.session.collected["time_slots"],
            "categories":       self.session.collected["categories"],
            "keywords":         self.session.collected["keywords"],
            "sentiment_vector": self.session.collected["sentiment_vector"],
            "group_type":       self.session.collected["group_type"]
        }

        result = hybrid_recommend(parsed_collected, normalized_prefs)

        budget_raw = self.session.collected["budget"] or 0
        days = self.session.collected["duration_days"]
        days_part = f", {days} günlük gezin" if days else ""

        reply = self.READY_RESPONSE_TEMPLATE.format(
            budget=budget_raw,
            days_part=days_part,
        )

        # Bütçe uyarısı
        budget_plan = result.get("budget_plan")
        if budget_plan:
            if budget_plan["status"] == "over_budget":
                reply += (
                    f"\n\n⚠️ Önerilen aktivitelerin toplam maliyeti "
                    f"({budget_plan['total_cost']} TL) bütçeni aşıyor. "
                    f"Daha uygun alternatifler de aşağıda mevcut."
                )
            elif budget_plan["status"] == "warning":
                reply += (
                    f"\n\nNot: Bu plan toplam {budget_plan['total_cost']} TL tutuyor, "
                    f"kalan bütçen: {budget_plan['remaining_budget']} TL."
                )

        return {
            "reply": reply,
            "recommendations":  result.get("balanced_recommendations", []),
            "budget_friendly":  result.get("budget_friendly_package", []),
            "premium":          result.get("premium_speed_package", []),
            "by_time_slot":     result.get("by_time_slot", {}),
            "budget_plan":      budget_plan,
            "budget_swaps":     result.get("budget_swaps", []),
            "state":            "ready",
            "session_summary":  self.session.summary(),
        }

    def reset(self):
        """Oturumu sıfırla (yeni kullanıcı veya yeni gezi)."""
        self.session = ConversationSession()