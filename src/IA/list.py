import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()

def list_available_models():
    """Lista todos os modelos Gemini disponíveis"""
    
    api_key = os.getenv('GEMINI_API_KEY')
    
    if not api_key:
        print("❌ Erro: GEMINI_API_KEY não configurado no .env")
        return
    
    genai.configure(api_key=api_key)
    
    print("🔍 Listando modelos disponíveis...\n")
    print("=" * 80)
    
    try:
        models = genai.list_models()
        
        chat_models = []
        
        for model in models:
            print(f"\n📦 Nome: {model.name}")
            print(f"   Display Name: {model.display_name}")
            print(f"   Descrição: {model.description}")
            print(f"   Métodos suportados: {model.supported_generation_methods}")
            print(f"   Input token limit: {model.input_token_limit}")
            print(f"   Output token limit: {model.output_token_limit}")
            print("-" * 80)
            
            # Filtrar modelos que suportam generateContent
            if 'generateContent' in model.supported_generation_methods:
                chat_models.append(model.name)
        
        print("\n" + "=" * 80)
        print("\n✅ Modelos compatíveis com chat (generateContent):")
        for model_name in chat_models:
            print(f"   - {model_name}")
        
        print("\n💡 Use um desses modelos no seu código!")
        print("   Exemplo: model_name='gemini-1.5-flash'")
        
    except Exception as e:
        print(f"\n❌ Erro ao listar modelos: {e}")
        print("\nVerifique se sua GEMINI_API_KEY está correta.")
        print("Obtenha uma chave em: https://makersuite.google.com/app/apikey")

if __name__ == "__main__":
    list_available_models()