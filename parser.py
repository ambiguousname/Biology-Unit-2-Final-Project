file = open("./questions.txt", "r")
fileJ = open("./questions.json", "w")
lines = []
for line in file:
    prevCharacter = ""
    currentChar = ""
    itemsArr = []
    prevComma = False
    for character in line:
        if character == "\"":
            currentChar += "\\"
            currentChar += "\""
        elif character == "," and prevCharacter != ",":
            prevComma = True
        elif prevCharacter == "," and character == ",":
            itemsArr.append(currentChar)
            currentChar = ""
            prevComma = False
        elif prevComma == True and character != ",":
            prevComma = False
            currentChar += ","
            currentChar += character
        elif character != "\n":
            currentChar += character
        prevCharacter = character
    itemsArr.append(currentChar)
    lines.append(itemsArr)
print(lines)
fileJ.write("{ \n\t\"questions\": [")
totalIndex = 0
for line in lines:
    print(line)
    index = 0
    fileJ.write("\n\t\t{")
    for item in line:
        appendC = ""
        if index == 0:
            appendC = "question"
        elif index == 1:
            appendC = "answer"
        else:
            appendC = "fakeAnswer"
        if index == 2:
            fileJ.write("\t\t\t\"" + appendC + "\": \"" + item + "\"")
        elif index == 0:
            fileJ.write("\n\t\t\t\"" + appendC + "\": \"" + item + "\",\n")
        else:
            fileJ.write("\t\t\t\"" + appendC + "\": \"" + item + "\",\n")
        index += 1
    totalIndex += 1
    if totalIndex == len(lines):
        fileJ.write("\n\t\t}")
    else:
        fileJ.write("\n\t\t},")
fileJ.write("\n\t]\n}")
file.close()
fileJ.close()