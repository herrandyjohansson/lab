import random
import periodic_table 

correctAnswer = None

def getQuestion():
    questionArray = periodic_table.getQuestionArray()
    return questionArray[random.randint(0, len(questionArray) - 1)]

print("--------------------------------")
print("Learn the periodic table of elements")
print("--------------------------------\n")

score = 0
while(True):
    question = getQuestion()
    if score > 0 and score % 5 == 0:
        print("\n")
        print(f"Streak! {score}")
        print("\n")
    
    print(f"English: {question['english']}")
    print(f"Swedish: {question['swedish']}")
    #print(f"Symbol: {question['symbol']}")
    print(f"Period: {question['period']}")
    print(f"Group: {question['group']}")
    print(f"Atomic Number: {question['atomic_number']}")
    print("\n")
    questionAnswer = input(f"Enter answer: ")
    if(questionAnswer == question['symbol'].lower()):
        correctAnswer = 1
        score += 1
        print("\033[92mNajs\033[0m \n")  # green text
    else: 
        correctAnswer = 0
        print("\033[91mNotNajs\033[0m \n")  # red text
        print(f"\033[91mThe correct answer is: {question['symbol']}\033[0m \n")
        print("\n")



