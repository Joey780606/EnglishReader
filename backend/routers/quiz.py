import json
import random
from typing import Iterable

from fastapi import APIRouter, HTTPException, Query

from backend.database import get_connection
from backend.models import QuizQuestion, QuizResponse, QuizWordDetail

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

OPTION_COUNT = 4


def _usable_meanings(raw_meanings: str) -> list[str]:
    meanings = [meaning.strip() for meaning in json.loads(raw_meanings)]
    return [meaning for meaning in meanings if meaning]


def _distractor_pool(
    meaning_sources: Iterable[tuple[str, QuizWordDetail]], excluded_meanings: list[str]
) -> dict[str, QuizWordDetail]:
    """Map each distractor meaning to the word it came from, skipping the correct word's meanings."""
    pool: dict[str, QuizWordDetail] = {}
    for meaning, source in meaning_sources:
        if meaning not in excluded_meanings:
            pool.setdefault(meaning, source)
    return pool


@router.get("", response_model=QuizResponse)
async def generate_quiz(count: int = Query(10, ge=1, le=50)) -> QuizResponse:
    """Build a multiple-choice quiz (English word -> 4 Chinese options).

    Words with the lowest view_count are picked first (random order among ties), so repeated
    quizzes rotate through the vocabulary evenly. Each word appears at most once per quiz.
    """
    connection = get_connection()
    try:
        rows = connection.execute(
            "SELECT id, english_word, chinese_meanings, part_of_speech, example_sentence "
            "FROM vocabulary ORDER BY view_count ASC, RANDOM()"
        ).fetchall()
    finally:
        connection.close()

    candidates: list[QuizWordDetail] = []
    for row in rows:
        meanings = _usable_meanings(row["chinese_meanings"])
        if meanings:
            candidates.append(
                QuizWordDetail(
                    vocabulary_id=row["id"],
                    english_word=row["english_word"],
                    part_of_speech=row["part_of_speech"],
                    chinese_meanings=meanings,
                    example_sentence=row["example_sentence"],
                )
            )

    if len(candidates) < OPTION_COUNT:
        raise HTTPException(
            status_code=400,
            detail=f"至少需要 {OPTION_COUNT} 個已有中文意思的單字才能測驗（目前 {len(candidates)} 個）",
        )

    questions: list[QuizQuestion] = []
    for word in candidates[:count]:
        correct = random.choice(word.chinese_meanings)
        others = [other for other in candidates if other.vocabulary_id != word.vocabulary_id]
        distractor_pool = _distractor_pool(
            ((random.choice(other.chinese_meanings), other) for other in others), word.chinese_meanings
        )
        if len(distractor_pool) < OPTION_COUNT - 1:
            distractor_pool = _distractor_pool(
                ((meaning, other) for other in others for meaning in other.chinese_meanings),
                word.chinese_meanings,
            )
        if len(distractor_pool) < OPTION_COUNT - 1:
            continue

        options = random.sample(sorted(distractor_pool), OPTION_COUNT - 1) + [correct]
        random.shuffle(options)
        questions.append(
            QuizQuestion(
                vocabulary_id=word.vocabulary_id,
                english_word=word.english_word,
                options=options,
                correct_index=options.index(correct),
                option_details=[word if option == correct else distractor_pool[option] for option in options],
            )
        )

    if not questions:
        raise HTTPException(status_code=400, detail="單字的中文意思重複過多，無法產生測驗題目")

    random.shuffle(questions)
    return QuizResponse(questions=questions)
