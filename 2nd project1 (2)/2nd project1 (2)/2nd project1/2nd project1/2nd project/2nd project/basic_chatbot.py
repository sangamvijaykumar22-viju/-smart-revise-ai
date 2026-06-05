import time
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch

# ==========================================
# 1. MODEL CONFIGURATION
# ==========================================
# You can swap these models depending on your machine capabilities
# Fast model: "Qwen/Qwen2.5-0.5B-Instruct" 
# Smarter model: "microsoft/Phi-3-mini-4k-instruct"
MODEL_ID = "Qwen/Qwen2.5-0.5B-Instruct"

# System prompt specialized for coding assistance
SYSTEM_PROMPT = """You are an expert, highly knowledgeable programming tutor and AI coding assistant.
Your goal is to help programmers of all levels (from beginners to advanced) with:
- C, C++, Python, Data Structures & Algorithms (DSA), and related concepts.
- Debugging errors and suggesting reliable fixes.
- Explaining complex programming concepts clearly and concisely.
- Writing clean, optimized, and well-commented code solutions.

Guidelines:
1. Always analyze the time and space complexity of algorithms you provide.
2. Format code blocks clearly using markdown.
3. If an error is mentioned, explain *why* the error happens before providing the fix.
4. Keep explanations instructional but concise—do not ramble."""

# Text generation parameters
GENERATION_KWARGS = {
    "max_new_tokens": 700,
    "temperature": 0.5,
    "top_p": 0.9,
    "repetition_penalty": 1.2,
    "do_sample": True
}


# ==========================================
# 2. MODEL LOADING & PIPELINE CREATION
# ==========================================
def initialize_chatbot():
    print(f"[*] Loading model: {MODEL_ID}...")
    print("[*] This might take a moment depending on your hardware.\n")
    
    # Determine the best available device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    
    # Load tokenizer and model
    tokenizer = AutoTokenizer.from_pretrained(MODEL_ID)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_ID,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        device_map="auto" if device == "cuda" else None
    )

    # Create the text-generation pipeline
    chat_pipeline = pipeline(
        "text-generation",
        model=model,
        tokenizer=tokenizer,
        device_map="auto" if device == "cuda" else None
    )
    
    print("[+] Model loaded successfully!\n")
    return chat_pipeline, tokenizer


# ==========================================
# 3. RESPONSE GENERATION & CHAT LOOP
# ==========================================
def main():
    chat_pipeline, tokenizer = initialize_chatbot()
    
    # Initialize conversation memory
    chat_history = [
        {"role": "system", "content": SYSTEM_PROMPT}
    ]
    
    print("="*60)
    print("🤖 Expert Coding Assistant Ready!")
    print("Type 'exit' or 'quit' to end the session.")
    print("="*60 + "\n")

    while True:
        try:
            # Get user input
            user_input = input("\nYou: ")
            
            # Check for exit condition
            if user_input.strip().lower() in ['exit', 'quit']:
                print("\nGoodbye! Keep coding! 💻")
                break
            
            if not user_input.strip():
                continue

            # Add user message to history memory
            chat_history.append({"role": "user", "content": user_input})
            
            # Show processing indicator
            print("\nAI is thinking...", end="\r", flush=True)
            start_time = time.time()
            
            # Format the conversation history using the model's chat template
            formatted_prompt = tokenizer.apply_chat_template(
                chat_history,
                tokenize=False,
                add_generation_prompt=True
            )
            
            # Generate response
            outputs = chat_pipeline(
                formatted_prompt,
                **GENERATION_KWARGS,
                return_full_text=False # Crucial: Only return the *new* generated text, not the prompt
            )
            
            # Extract and clean the generated text
            assistant_response = outputs[0]["generated_text"].strip()
            generation_time = time.time() - start_time
            
            # Save the assistant response to memory
            chat_history.append({"role": "assistant", "content": assistant_response})
            
            # Display response clearly
            print(" " * 20, end="\r") # Clear "AI is thinking..." line
            print("🤖 Assistant:")
            print("-" * 40)
            print(assistant_response)
            print("-" * 40)
            print(f"[Generation took {generation_time:.2f} seconds]")

        except KeyboardInterrupt:
            print("\n\nSession interrupted. Goodbye! 💻")
            break
        except Exception as e:
            print(f"\n[!] An error occurred: {str(e)}")


if __name__ == "__main__":
    main()
