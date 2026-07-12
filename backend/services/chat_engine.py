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

VAGUE_BUDGET_WORDS = ["limitsiz", "sınırsız", "fark etmez", "önemli değil", "bol"]


class ChatEngine:

    GREETING_RESPONSE = (
        "Merhaba! Antalya gezin için sana özel aktiviteler önerebilirim. "
        "Ne tür bir gezi planlıyorsun, biraz anlat bakalım."
    )

    BUDGET_QUESTION = (
        "Anlıyorum! Sana en uygun yerleri önerebilmem için "
        "yaklaşık bütçeni de bilmem yeterli. Ne kadar ayırdın bu gezi için?"
    )

    MUZEKART_QUESTION = (
        "Son bir sorum: Müzekartın var mı? "
        "Perge, Aspendos, Termessos gibi mekanlarda bilet ücretsiz oluyor, "
        "bütçeni daha doğru hesaplayabileyim."
    )

    MUZEKART_YES = {"evet", "var", "müzekartım", "müzekart var", "yes", "yep",
                    "tabii", "elbette", "mevcut", "sahip", "aldım", "alındı"}
    MUZEKART_NO  = {"hayır", "yok", "hayir", "no", "nope", "almadım", "almadim"}

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
        self._muzekart_asked = False
        self._waiting_for_budget = False

    def handle_message(self, user_text: str) -> dict:
        text_lower = user_text.lower().strip()

        # ── İlk mesaj sadece selamlama mı? ──────────────────────────────
        is_only_greeting = (
            self.session.turn_count == 0
            and any(t == text_lower.strip() or text_lower.strip().startswith(t + " ") for t in self.GREETING_TRIGGERS)
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
        parsed = parse_user_input(user_text, budget_context=self._waiting_for_budget)
        self._waiting_for_budget = False

        # Limitsiz bütçe kontrolü
        if any(w in text_lower for w in VAGUE_BUDGET_WORDS):
            parsed["budget"] = 50000

        self.session.update(parsed)

        # ── Bütçe hâlâ yok → tek soru sor ──────────────────────────────
        if self.session.collected["budget"] is None:
            self._waiting_for_budget = True
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

        # ── Müzekart sorusu ─────────────────────────────────────────────
        if self.session.collected["has_muzekart"] is None:
            if self._muzekart_asked:
                # Soru sorulmuştu, cevabı al
                answer = self._detect_muzekart(text_lower)
                if answer is not None:
                    self.session.collected["has_muzekart"] = answer
                else:
                    return {
                        "reply": self.MUZEKART_QUESTION,
                        "recommendations": None,
                        "budget_plan": None,
                        "budget_swaps": [],
                        "state": "need_muzekart",
                        "session_summary": self.session.summary(),
                    }
            elif "müzekart" in text_lower:
                # Kullanıcı kendi söyledi
                self.session.collected["has_muzekart"] = self._detect_muzekart(text_lower) or False
            else:
                # Soruyu sor
                self._muzekart_asked = True
                return {
                    "reply": self.MUZEKART_QUESTION,
                    "recommendations": None,
                    "budget_plan": None,
                    "budget_swaps": [],
                    "state": "need_muzekart",
                    "session_summary": self.session.summary(),
                }

        # ── Bütçe + müzekart var → öneri üret ───────────────────────────
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
        budget_display = "limitsiz" if budget_raw >= 50000 else f"{budget_raw} TL"

        reply = (
            f"Harika, sana uygun aktiviteleri buldum! "
            f"Bütçen ({budget_display}){days_part} için "
            f"planını sağ panelde inceleyebilirsin."
        )

        # Bütçe uyarısı (müzekart varsa ve bütçe limitsiz değilse gösterme)
        has_muzekart = self.session.collected.get("has_muzekart", False)
        budget_plan = result.get("budget_plan")
        if budget_plan and not has_muzekart and budget_raw < 50000:
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

    def _detect_muzekart(self, text: str) -> bool | None:
        words = set(text.replace(",", " ").replace(".", " ").split())
        if words & self.MUZEKART_YES:
            return True
        if words & self.MUZEKART_NO:
            return False
        return None

    def reset(self):
        self.session = ConversationSession()
        self._waiting_for_budget = False
        self._muzekart_asked = False