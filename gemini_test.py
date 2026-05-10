from google import genai
import os

# Your API Key
API_KEY = "AIzaSyAzOQWVf4J4abgpdVR6vcZufb1hRJ2FIqw"

def test_project_prompts():
    client = genai.Client(api_key=API_KEY)
    model_id = 'gemini-flash-latest'

    # The actual System Prompt from aiService.js
    system_instruction = """
    You are an expert writer for funny roasts and heartfelt toasts.

    Rules:
    1. Use VERY SIMPLE language.
    2. No difficult words.
    3. Sound like close friends talking.
    4. Hindi should be casual spoken Hindi.
    5. Marathi should be casual spoken Marathi.
    6. Roast should be funny, playful, and relatable.
    7. Toast should feel warm and genuine.
    8. Minimum 6-8 complete and detailed sentences.
    9. Output ONLY this format:

    Title: ...
    Body: ...
    """

    # Simulation of the _buildPrompt logic for a Marathi Roast
    marathi_user_prompt = """
    Write a funny roast for Rahul.
    
    Write in very simple spoken Marathi.
    Use everyday Marathi people actually speak.
    Avoid formal Marathi completely.
    Use natural friendly words.
    If roast, use funny "tomne" like close friends teasing each other.

    Tone: funny, playful, always late for everything

    Requirements:
    - funny
    - playful
    - relatable
    - friendly teasing
    - not offensive
    - minimum 6-8 full sentences

    Example:
    Title: राहुल म्हणजे चालता-बोलता गोंधळ 😂
    Body: राहुल साधं काम पण somehow कठीण करून दाखवतो. त्याचा confidence मात्र भन्नाट आहे. कसं manage करतो ते देवच जाणे. पण entertainment full मिळतं हे नक्की.

    Output format:
    Title: ...
    Body: ...
    """

    print("Generating Marathi Roast using Project Prompts...")
    try:
        response = client.models.generate_content(
            model=model_id,
            config={'system_instruction': system_instruction},
            contents=marathi_user_prompt
        )
        
        with open("gemini_project_test.txt", "w", encoding="utf-8") as f:
            f.write(response.text)
        
        print("Done! Check 'gemini_project_test.txt' for the result.")
        
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    test_project_prompts()
