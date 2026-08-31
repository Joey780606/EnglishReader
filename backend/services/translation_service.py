import re
from abc import ABC, abstractmethod
from typing import List, Optional

import httpx

DICTIONARY_API_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
MYMEMORY_API_URL = "https://api.mymemory.translated.net/get"


class WordLookupResult:
    def __init__(
        self,
        chinese_meanings: List[str],
        part_of_speech: Optional[str] = None,
        dictionary_example_sentence: Optional[str] = None,
    ) -> None:
        self.chinese_meanings = chinese_meanings
        self.part_of_speech = part_of_speech
        self.dictionary_example_sentence = dictionary_example_sentence


class TranslationService(ABC):
    @abstractmethod
    async def lookup_word(self, word: str) -> WordLookupResult:
        raise NotImplementedError


class FreeDictionaryTranslationService(TranslationService):
    async def lookup_word(self, word: str) -> WordLookupResult:
        part_of_speech = None
        dictionary_example_sentence = None
        chinese_meanings: List[str] = []

        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                dictionary_response = await client.get(DICTIONARY_API_URL.format(word=word))
                if dictionary_response.status_code == 200:
                    entries = dictionary_response.json()
                    for entry in entries:
                        for meaning in entry.get("meanings", []):
                            if part_of_speech is None:
                                part_of_speech = meaning.get("partOfSpeech")
                            for definition in meaning.get("definitions", []):
                                example = definition.get("example")
                                if example and dictionary_example_sentence is None:
                                    dictionary_example_sentence = example
                            if part_of_speech and dictionary_example_sentence:
                                break
                        if part_of_speech and dictionary_example_sentence:
                            break
            except httpx.HTTPError:
                pass

            try:
                translation_response = await client.get(
                    MYMEMORY_API_URL,
                    params={"q": word, "langpair": "en|zh-TW"},
                )
                if translation_response.status_code == 200:
                    translation_data = translation_response.json()
                    best_translation = translation_data.get("responseData", {}).get("translatedText")
                    if best_translation:
                        chinese_meanings.append(best_translation)
                    for match in translation_data.get("matches", []):
                        candidate = match.get("translation")
                        if candidate and candidate not in chinese_meanings:
                            chinese_meanings.append(candidate)
            except httpx.HTTPError:
                pass

        return WordLookupResult(
            chinese_meanings=chinese_meanings or ["（查無翻譯）"],
            part_of_speech=part_of_speech,
            dictionary_example_sentence=dictionary_example_sentence,
        )


def find_example_sentence_in_text(word: str, document_content: str) -> Optional[str]:
    if not document_content:
        return None
    sentences = re.split(r"(?<=[.!?])\s+", document_content)
    pattern = re.compile(rf"\b{re.escape(word)}\b", re.IGNORECASE)
    for sentence in sentences:
        if pattern.search(sentence):
            return sentence.strip()
    return None


def get_translation_service() -> TranslationService:
    return FreeDictionaryTranslationService()
