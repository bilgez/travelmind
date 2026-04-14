# Zehra'nın NLP kodu gelince bu fonksiyonun içi değişecek
# Dışarıdan çağrılma şekli aynı kalacak

def parse_input(text: str) -> dict:
    """
    Kullanicinin Turkce girdisini parse eder.
    Ornek girdi: "Sabah tarihi yer gezmek istiyorum, aksam restoran"
    """
    # DUMMY: Zehra'nin kodu gelince burasi degisecek
    return {
        "sabah": ["tarihi_yer", "tarihi_yer"],
        "aksam": ["restoran"],
        "gece": ["kulup"]
    }