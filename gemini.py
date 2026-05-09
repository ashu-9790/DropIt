# Install first:
# pip install google-generativeai

import google.generativeai as genai

# Replace with your Gemini API Key
API_KEY = "AIzaSyBye_oaldrJtz9hyJdka-noiaV00NPe6Nk"

# Configure Gemini
genai.configure(api_key=API_KEY)

# Load Gemini 2.5 Flash model
model = genai.GenerativeModel("gemini-2.5-flash")

print("Gemini Chatbot Started! Type 'exit' to quit.\n")

while True:
    user_input = input("You: ")

    if user_input.lower() == "exit":
        print("Chatbot Ended.")
        break

    try:
        response = model.generate_content(user_input)
        print("Gemini:", response.text)
        print()

    except Exception as e:
        print("Error:", e)