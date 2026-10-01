import json
import random

from fastapi import APIRouter, HTTPException, Query

from backend.database import get_connection
from backend.models import QuizQuestion, QuizResponse

router = APIRouter(prefix="/api/quiz", tags=["quiz"])

OPTION_COUNT = 4


def _usable_meanings(raw_meanings: str) -> list[str]:
    meanings = [meaning.strip() for meaning in json.loads(raw_meanings)]
    return [meaning for meaning in meanings if meaning]


@router.get("", response_model=QuizResponse)
async def generate_quiz(count: int = Query(10, ge=1, le=50)) -> QuizResponse:
    """Build a multiple-choice quiz (English word -> 4 Chinese options).

    Words with the lowest view_count are picked first (random order among ties), so repeated
    quizzes rotate through the vocabulary evenly. Each word appears at most once per quiz.
    """
    connection = get_connection()
    try:
        rows = connection.execute(
            "SELECT id, english_word, chinese_meanings FROM vocabulary ORDER BY view_count ASC, RANDOM()"
        ).fetchall()
    finally:
        connection.close()

    candidates = []
    for row in rows:
        meanings = _usable_meanings(row["chinese_meanings"])
        if meanings:
            candidates.append((row["id"], row["english_word"], meanings))

    if len(candidates) < OPTION_COUNT:
        raise HTTPException(
            status_code=400,
            detail=f"至少需要 {OPTION_COUNT} 個已有中文意思的單字才能測驗（目前 {len(candidates)} 個）",
        )

    questions: list[QuizQuestion] = []
    for vocabulary_id, english_word, meanings in candidates[:count]:
        correct = random.choice(meanings)
        excluded = set(meanings)
        distractor_pool = {
            random.choice(other_meanings)
            for other_id, _, other_meanings in candidates
            if other_id != vocabulary_id
        } - excluded
        if len(distractor_pool) < OPTION_COUNT - 1:
            distractor_pool = {
                meaning
                for other_id, _, other_meanings in candidates
                if other_id != vocabulary_id
                for meaning in other_meanings
            } - excluded
        if len(distractor_pool) < OPTION_COUNT - 1:
            continue

        options = random.sample(sorted(distractor_pool), OPTION_COUNT - 1) + [correct]
        random.shuffle(options)
        questions.append(
            QuizQuestion(
                vocabulary_id=vocabulary_id,
                english_word=english_word,
                options=options,
                correct_index=options.index(correct),
            )
        )

    if not questions:
        raise HTTPException(status_code=400, detail="單字的中文意思重複過多，無法產生測驗題目")

    random.shuffle(questions)
    return QuizResponse(questions=questions)
