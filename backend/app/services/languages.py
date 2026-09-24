"""
Fixed-phrase translations for the assistant's spoken confirmation/success/
error strings. Deliberately not a live-translation call — fewer moving
parts to fail on stage. Yoruba/Pidgin/Hausa/Igbo entries are reasonable
approximations, not reviewed by a native speaker — sanity-check before a
live pitch if you have access to one. Mirrors languages.ts on the frontend.
"""

_PHRASES = {
    "en": {
        "confirmSend": lambda amt, name: f"You are about to send {amt} naira to {name}. Should I continue?",
        "confirmWithdraw": lambda amt: f"You are about to withdraw {amt} naira. Should I continue?",
        "confirmDeposit": lambda amt: f"You are about to deposit {amt} naira. Should I continue?",
        "confirmAirtime": lambda amt, phone: f"You are about to buy {amt} naira airtime for {phone}. Should I continue?",
        "successSend": lambda amt, name: f"Your transfer of {amt} naira to {name} was successful.",
        "successWithdraw": lambda amt: f"Your withdrawal of {amt} naira was successful.",
        "successDeposit": lambda amt: f"Your deposit of {amt} naira was successful.",
        "successAirtime": lambda amt, phone: f"Your airtime purchase of {amt} naira for {phone} was successful.",
        "balance": lambda amt: f"Your account balance is {amt} naira.",
        "askRecipient": "I heard you want to send money. Who would you like to send it to?",
        "askAmount": "How much would you like to send?",
        "askPhoneNumber": "What phone number should I top up?",
        "notUnderstood": "Sorry, I didn't understand that. Please try again.",
        "txFailed": "Your transaction could not be completed. No money was deducted.",
        "faceFailed": "We couldn't verify your identity. Please try again.",
        "networkError": "We're having trouble connecting. Please check your connection and try again.",
    },
    "pcm": {
        "confirmSend": lambda amt, name: f"You wan send {amt} naira give {name}. I go continue?",
        "confirmWithdraw": lambda amt: f"You wan withdraw {amt} naira. I go continue?",
        "confirmDeposit": lambda amt: f"You wan deposit {amt} naira. I go continue?",
        "confirmAirtime": lambda amt, phone: f"You wan buy {amt} naira airtime for {phone}. I go continue?",
        "successSend": lambda amt, name: f"Your {amt} naira don successfully reach {name}.",
        "successWithdraw": lambda amt: f"Your {amt} naira withdrawal don successful.",
        "successDeposit": lambda amt: f"Your {amt} naira deposit don successful.",
        "successAirtime": lambda amt, phone: f"Your {amt} naira airtime for {phone} don successful.",
        "balance": lambda amt: f"Your balance na {amt} naira.",
        "askRecipient": "I hear say you wan send money. Who you wan send am give?",
        "askAmount": "How much you wan send?",
        "askPhoneNumber": "Wetin be the phone number wey you wan top up?",
        "notUnderstood": "Sorry, I no understand. Try again abeg.",
        "txFailed": "Your transaction no complete. No money comot from your account.",
        "faceFailed": "We no fit verify say na you. Try again.",
        "networkError": "Network wahala dey. Check your connection try again.",
    },
    "yo": {
        "confirmSend": lambda amt, name: f"O fẹ́ fi {amt} náírà ránṣẹ́ sí {name}. Ṣé kí n tẹ̀síwájú?",
        "confirmWithdraw": lambda amt: f"O fẹ́ yọ {amt} náírà kúrò. Ṣé kí n tẹ̀síwájú?",
        "confirmDeposit": lambda amt: f"O fẹ́ fi {amt} náírà sí àkọọ́lẹ̀ rẹ. Ṣé kí n tẹ̀síwájú?",
        "confirmAirtime": lambda amt, phone: f"O fẹ́ ra ẹ̀rọ-ìjíròrò {amt} náírà fún {phone}. Ṣé kí n tẹ̀síwájú?",
        "successSend": lambda amt, name: f"A ti fi {amt} náírà ránṣẹ́ sí {name} ní àṣeyọrí.",
        "successWithdraw": lambda amt: f"Yíyọ {amt} náírà ṣàṣeyọrí.",
        "successDeposit": lambda amt: f"Fífi {amt} náírà sí àkọọ́lẹ̀ rẹ ṣàṣeyọrí.",
        "successAirtime": lambda amt, phone: f"Rírà ẹ̀rọ-ìjíròrò {amt} náírà fún {phone} ṣàṣeyọrí.",
        "balance": lambda amt: f"Owó tó kù nínú àkọọ́lẹ̀ rẹ ni {amt} náírà.",
        "askRecipient": "Mo gbọ́ pé o fẹ́ fi owó ránṣẹ́. Ta ni o fẹ́ fi ránṣẹ́ sí?",
        "askAmount": "Ẹ mélòó ni o fẹ́ fi ránṣẹ́?",
        "askPhoneNumber": "Nọ́mbà fóònù wo ni kí n gbé kirẹ́ìjì sí?",
        "notUnderstood": "Pẹ̀lẹ́, mi ò gbọ́ ohun tí o sọ. Jọ̀wọ́ tún sọ.",
        "txFailed": "A kò lè parí ìdúnàádúrà yìí. A kò yọ owó kankan.",
        "faceFailed": "A kò lè fi ìdánimọ̀ rẹ múlẹ̀. Jọ̀wọ́ tún gbìyànjú.",
        "networkError": "A ní ìṣòro ìsopọ̀. Jọ̀wọ́ ṣàyẹ̀wò ìsopọ̀ rẹ kí o sì tún gbìyànjú.",
    },
    "ha": {
        "confirmSend": lambda amt, name: f"Kana son aika Naira {amt} zuwa {name}. In ci gaba?",
        "confirmWithdraw": lambda amt: f"Kana son cire Naira {amt}. In ci gaba?",
        "confirmDeposit": lambda amt: f"Kana son ajiya Naira {amt}. In ci gaba?",
        "confirmAirtime": lambda amt, phone: f"Kana son sayan katin waya na Naira {amt} don {phone}. In ci gaba?",
        "successSend": lambda amt, name: f"An yi nasarar aika Naira {amt} zuwa {name}.",
        "successWithdraw": lambda amt: f"An yi nasarar cire Naira {amt}.",
        "successDeposit": lambda amt: f"An yi nasarar ajiya Naira {amt}.",
        "successAirtime": lambda amt, phone: f"An yi nasarar sayan katin waya na Naira {amt} don {phone}.",
        "balance": lambda amt: f"Ma'aunin asusunku shine Naira {amt}.",
        "askRecipient": "Na ji kana son aika kudi. Wa kake son aikawa?",
        "askAmount": "Nawa kake son aikawa?",
        "askPhoneNumber": "Wane lambar waya ne za a caji?",
        "notUnderstood": "Yi hakuri, ban gane ba. Da fatan za a sake gwadawa.",
        "txFailed": "Ba a kammala ma'amalar ba. Ba a cire kudi ba.",
        "faceFailed": "Ba mu iya tabbatar da ku ba. Da fatan za a sake gwadawa.",
        "networkError": "Muna da matsalar hadi. Duba hadin ka sannan a sake gwadawa.",
    },
    "ig": {
        "confirmSend": lambda amt, name: f"Ị chọrọ izipu Naira {amt} nye {name}. Ka m gaa n'ihu?",
        "confirmWithdraw": lambda amt: f"Ị chọrọ iwepụ Naira {amt}. Ka m gaa n'ihu?",
        "confirmDeposit": lambda amt: f"Ị chọrọ itinye Naira {amt} n'akaụntụ gị. Ka m gaa n'ihu?",
        "confirmAirtime": lambda amt, phone: f"Ị chọrọ ịzụ ekwentị Naira {amt} maka {phone}. Ka m gaa n'ihu?",
        "successSend": lambda amt, name: f"Izipu Naira {amt} nye {name} gara nke ọma.",
        "successWithdraw": lambda amt: f"Iwepụ Naira {amt} gara nke ọma.",
        "successDeposit": lambda amt: f"Itinye Naira {amt} n'akaụntụ gị gara nke ọma.",
        "successAirtime": lambda amt, phone: f"Ịzụ ekwentị Naira {amt} maka {phone} gara nke ọma.",
        "balance": lambda amt: f"Ego fọdụrụ n'akaụntụ gị bụ Naira {amt}.",
        "askRecipient": "Anụrụ m na ị chọrọ izipu ego. Ònye ka ị chọrọ izipu ya?",
        "askAmount": "Ego ole ka ị chọrọ izipu?",
        "askPhoneNumber": "Kedu nọmba ekwentị ka m ga-eji chaajị?",
        "notUnderstood": "Ndo, aghọtaghị m. Biko nwaa ọzọ.",
        "txFailed": "Enweghị ike imecha azụmahịa a. Ewepụghị ego ọ bụla.",
        "faceFailed": "Enweghị ike ịkwado onye ị bụ. Biko nwaa ọzọ.",
        "networkError": "Anyị nwere nsogbu njikọ. Biko lelee njikọ gị ma nwaa ọzọ.",
    },
}


def t(lang: str, key: str, *args) -> str:
    dict_for_lang = _PHRASES.get(lang, _PHRASES["en"])
    entry = dict_for_lang.get(key, _PHRASES["en"].get(key))
    return entry(*args) if callable(entry) else entry


def supported_languages() -> list[dict]:
    return [
        {"code": "en", "label": "English"},
        {"code": "pcm", "label": "Nigerian Pidgin"},
        {"code": "yo", "label": "Yorùbá"},
        {"code": "ha", "label": "Hausa"},
        {"code": "ig", "label": "Igbo"},
    ]
