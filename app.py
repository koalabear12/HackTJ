from flask import Flask, request, jsonify #so this is basically an api that accesses another api lol. it uses a flask post request 
import json
import requests

app = Flask(__name__)

GEMINI_API_KEY = "YOUR-KEY-HERE" #insert your own api key :)


def classify_statements(statements):
    results = {}

    for statement in statements:
        if statement and len(statement) > 2:

            payload = {
                "contents": [{
                    "parts": [{"text": f"Does this statement contain any information that is objectively false or is it all true (if it is ambiguous or not a claim return true) '{statement}'"}]
                }]
            }


            response = requests.post( #this line makes the request
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_API_KEY}",
                headers={'Content-Type': 'application/json'},
                data=json.dumps(payload)
            )

            #did it work?
            if response.status_code == 200:
                response_data = response.json()
                #print("API Response:", response_data)  #debug yay

                if 'candidates' in response_data and response_data['candidates'] and len(response_data['candidates']) > 0: #checks to see if it exists to prevent toppleovers
                    generated_text = response_data['candidates'][0]['content']['parts'][0]['text'].strip()

                    #see if it was true or false
                    if "true" in generated_text.lower():
                        results[statement] = True
                    elif "false" in generated_text.lower():
                        results[statement] = False
                    else:
                        results[statement] = False  #idk could be true could be false lol
                else:
                    print(f"Error: 'contents' key not found in response for statement: '{statement}'")
                    results[statement] = None 
            else:
                print(f"Error: {response.status_code},  {response.text}") #uh oh probablly ran out of free tokens :(
                results[statement] = None
        else: results[statement] = True #too short to be a statement probably so we dont wanna flag it by default
    return results

@app.route('/fact-check', methods=['POST'])
def fact_check():
    data = request.json
    statements = data.get('statements', [])

    #classify the statements
    results = classify_statements(statements)
    print(results)

    return jsonify(results)

if __name__ == '__main__':
    app.run(port=8000)
