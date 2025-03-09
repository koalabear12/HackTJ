import requests
import json

key = "AIzaSyCaUETWP3_PQ9J0BJnJDWfe8I0sjW7BEjs" #our seceret key :)

#define the statement things
statements = [
    "Paris, the capital of Italy, is a beautiful city.",
    "The Eiffel tower is located there."
]

def classify_statements(statements):
    results = {}

    for statement in statements:
        print(statement)

        payload = {
            "contents": [{
                "parts": [{"text": f"Does this statement contain any information that is objectively false or is it all true (if it is ambiguous or not a claim return true) '{statement}'"}]
            }]
        }

        response = requests.post( #this line makes the request
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={key}",
            headers={'Content-Type': 'application/json'},
            data=json.dumps(payload)
        )

        #did it work?
        if response.status_code == 200:
            response_data = response.json()
            print("API Response:", response_data)  #debug yay

            if 'candidates' in response_data and len(response_data['candidates']) > 0: #checks to see if it exists to prevent toppleovers
                generated_text = response_data['candidates'][0]['content']['parts'][0]['text'].strip()

                #see if it was true or false
                if "true" in generated_text.lower():
                    results[statement] = True
                elif "false" in generated_text.lower():
                    results[statement] = False
                else:
                    results[statement] = None  #idk could be true could be false lol
            else:
                print(f"Error: 'contents' key not found in response for statement: '{statement}'")
                results[statement] = None  #handle the error case
        else:
            print(f"Error: {response.status_code} - {response.text}")
            results[statement] = None  #handle the error case
    return results

#classify the statements
results = classify_statements(statements)
print(results)