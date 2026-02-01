from google import genai
from google.genai import types
import os

# TODO: Move to env var
API_KEY = "AIzaSyDT52Ms7Wl2W4V5Ulhh955oW1lY0T5cZMg"

class GeminiEngine:
    def __init__(self):
        self.client = genai.Client(api_key=API_KEY)
        self.model = "gemini-2.5-flash"

    async def chat(self, message: str, context: str = ""):
        try:
            prompt = f"""
            You are SkyBrain, an intelligent aviation assistant. 
            You are helpful, concise, and knowledgeable about flights, airports, and weather.
            
            Current Context:
            {context}
            
            User Question: {message}
            """
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            return response.text
        except Exception as e:
            print(f"Gemini Error: {e}")
            return "I'm having trouble connecting to my brain right now. Please try again later."

    async def explain_flight(self, flight_data: dict):
        try:
            prompt = f"""
            Explain this flight status to a non-expert user in plain English.
            Focus on where it is, how fast/high it is, and if it's acting normally.
            
            Flight Data:
            {flight_data}
            """
             
            response = self.client.models.generate_content(
                model=self.model,
                contents=prompt
            )
            return response.text
        except Exception as e:
            return "Could not generate explanation."

ai_engine = GeminiEngine()
