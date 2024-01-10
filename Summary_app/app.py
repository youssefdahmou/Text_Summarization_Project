from transformers import BartForConditionalGeneration, BartTokenizer
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
import spacy

nlp = spacy.load("en_core_web_sm")

app = Flask(__name__, template_folder='templates', static_folder='static')
app.secret_key = b'_5#y2L"F4Q8z\n\xec]/'


# Load fine-tuned model and tokenizer
model_path = 'Model'
model = BartForConditionalGeneration.from_pretrained(model_path)
tokenizer = BartTokenizer.from_pretrained(model_path)
@app.route('/')
def index():
    # If the user is already authenticated, redirect to the home page
    if 'user' in session:
        return redirect(url_for('home'))
    return render_template('index.html')
# Your login route
@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']
    # Check if the username and password are correct
    if username == 'esi' and password == 'esi':
        session['user'] = username
        flash('Login successful!', 'success')
        return redirect(url_for('home'))
    else:
        flash('Incorrect username or password. Please try again.', 'error')
        return redirect(url_for('index'))
# Your home route
@app.route('/home')
def home():
    # Check if the user is authenticated
    if 'user' not in session:
        flash('Please login first.', 'error')
        return redirect(url_for('index'))
    # Render the home template for authenticated users
    return render_template('home.html', user=session['user'])
# Your generate_summary route
@app.route('/generate_summary', methods=['POST'])
def generate_summary():
    data = request.get_json()
    text = data['text']
    max_length = data['maxLength']
    selected_tab = data['tab']
    if selected_tab == 'paragraph':
        # Generate summary using the original function
        summary = generate_summary_function(text, model, tokenizer, max_length)
    elif selected_tab == 'ner':
        # Generate summary using the function with NER
        summary = generate_summary_function_with_ner(text, model, tokenizer, max_length)
    else:
        # Handle other tabs as needed
        summary = "Invalid tab selection"
    return jsonify({'summary': summary})


def generate_summary_function(text, model, tokenizer, max_length=150, min_length=50):
    # Use the model and tokenizer to generate a summary
    inputs = tokenizer([text], max_length=max_length, return_tensors="pt", truncation=True)
    summary_ids = model.generate(
        inputs["input_ids"],
        max_length=max_length,
        min_length=min_length,
        length_penalty=2.0,
        num_beams=4,
        early_stopping=True,
    )
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    return summary

def generate_summary_function_with_ner(text, model, tokenizer, max_length=150, min_length=50):
    # Perform NER using SpaCy
    doc = nlp(text)
    # Extract entities and colors
    entities = [(ent.text, ent.label_) for ent in doc.ents]
    colors = get_entity_colors(entities)
    # Use the model and tokenizer to generate a summary
    inputs = tokenizer([text], max_length=max_length, return_tensors="pt", truncation=True)
    summary_ids = model.generate(
        inputs["input_ids"],
        max_length=max_length,
        min_length=min_length,
        length_penalty=2.0,
        num_beams=4,
        early_stopping=True,
    )
    summary = tokenizer.decode(summary_ids[0], skip_special_tokens=True)
    # Highlight entities in the summary with colors
    for entity, color in zip(entities, colors):
        summary = summary.replace(entity[0], f'<span style="color:{color};">{entity[0]}</span>')
    return summary
def get_entity_colors(entities):
    colors = {
        "PERSON": "red",
        "ORG": "blue",
        "GPE": "purple",
        "DATE":"brown",
        "MONEY":"yellow",
        # Add more entity types and colors as needed
    }
    return [colors.get(entity[1], "black") for entity in entities]


if __name__ == '__main__':
    app.run(debug=True)