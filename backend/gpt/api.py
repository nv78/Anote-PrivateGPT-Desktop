import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

class Gpt:

    def __init__(self):
        self.history = []
        # self.userEmail = userEmail

    def _countTokens(self):
        tokens = str(self.history).split()
        return len(tokens)

    def chat(self, msg):
        # from database.db import check_and_debit_gpt_credit
        # if not check_and_debit_gpt_credit(self.userEmail):
        #     return ""
        while True:
            try:
                self.history.append({f"user: {msg}"})

                if self._countTokens() < 7500:
                    reply = openai.ChatCompletion.create(
                        # model = "gpt-4",
                        model = "gpt-3.5-turbo-0301",
                        messages = [
                            {"role": "user", "content": str(self.history)}
                        ]
                    )
                else:
                    reply = openai.ChatCompletion.create(
                        model = "gpt-4-32k",
                        messages = [
                            {"role": "user", "content": str(self.history)}
                        ]
                    )
                reply = reply["choices"][0]["message"]["content"]
                self.history.append({f"respond: {reply}"})
                return reply
            except:
                pass

    def conversation(self):
        print("you can input 'end' to end the conversation.\n")
        while True:
            message = str(input("you:     "))
            if message == "end":
                break
            self.chat(message)
            print("\n")
        print(self.history)