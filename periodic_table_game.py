import random
import periodic_table
import os
import sys

correctAnswer = None

def getQuestion():
    questionArray = periodic_table.getQuestionArray()
    return questionArray[random.randint(0, len(questionArray) - 1)]

def clear_screen():
    os.system('clear' if os.name == 'posix' else 'cls')

def display_question(question, is_current=True, was_correct=None):
    prefix = ">>> " if is_current else "    "
    if not is_current and was_correct is not None:
        status = "\033[92m✓ Correct\033[0m" if was_correct else "\033[91m✗ Incorrect\033[0m"
        print(f"{prefix}Status: {status}")
    print(f"{prefix}English: {question['english']}")
    print(f"{prefix}Swedish: {question['swedish']}")
    print(f"{prefix}Period: {question['period']}")
    print(f"{prefix}Group: {question['group']}")
    print(f"{prefix}Atomic Number: {question['atomic_number']}")
    if not is_current:
        print(f"{prefix}Symbol: {question['symbol']}")
    print()

def display_history(question_history):
    if question_history:
        print("Previous Questions:")
        for history_item in reversed(question_history):
            display_question(history_item['question'], is_current=False, was_correct=history_item['correct'])
        print()  # spacing

def print_layout(current_question):
    print("\nCurrent Question:")
    display_question(current_question, is_current=True)
    print("Enter answer below:\n")

def celebrate_correct(score):
    """Display a cool celebration for correct answers"""
    box_width = 60
    print("\033[92m" + "=" * box_width + "\033[0m")
    
    # Center "✨ CORRECT! ✨"
    correct_text = "✨ CORRECT! ✨"
    correct_padding = (box_width - len(correct_text)) // 2
    print("\033[92m" + " " * correct_padding + correct_text + " " * (box_width - len(correct_text) - correct_padding) + "\033[0m")
    
    print("\033[92m" + "=" * box_width + "\033[0m")
    
    # Center "🎉 Great job! Score: {score} 🎉"
    score_text = f"🎉 Great job! Score: {score} 🎉"
    score_padding = (box_width - len(score_text)) // 2
    print("\033[92m" + " " * score_padding + score_text + " " * (box_width - len(score_text) - score_padding) + "\033[0m")
    
    print("\033[92m" + "=" * box_width + "\033[0m\n")

def display_incorrect(correct_symbol):
    """Display a cool message for incorrect answers"""
    box_width = 60
    print("\033[91m" + "=" * box_width + "\033[0m")
    
    # Center "❌ INCORRECT ❌"
    incorrect_text = "❌ INCORRECT ❌"
    incorrect_padding = (box_width - len(incorrect_text)) // 2
    print("\033[91m" + " " * incorrect_padding + incorrect_text + " " * (box_width - len(incorrect_text) - incorrect_padding) + "\033[0m")
    
    print("\033[91m" + "=" * box_width + "\033[0m")
    
    # Center "The correct answer is: {symbol}"
    answer_text = f"The correct answer is: {correct_symbol}"
    answer_padding = (box_width - len(answer_text)) // 2
    print("\033[91m" + " " * answer_padding + answer_text + " " * (box_width - len(answer_text) - answer_padding) + "\033[0m")
    
    print("\033[91m" + "=" * box_width + "\033[0m\n")

score = 0
question_history = []


while True:
    question = getQuestion()

    if score > 0 and score % 5 == 0:
        print(f"\nStreak! {score}\n")

    # Print everything above input
    print_layout(question)

    # Always prompt at same place
    questionAnswer = input(">>> ").strip().lower()
    display_history(question_history)

    if questionAnswer == question['symbol'].lower():
        correctAnswer = 1
        score += 1
        celebrate_correct(score)
    else:
        correctAnswer = 0
        display_incorrect(question['symbol'])

    # Append to history
    question_history.append({
        'question': question,
        'correct': correctAnswer == 1
    })