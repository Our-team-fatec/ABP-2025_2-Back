import os
import sys
import json
from dotenv import load_dotenv
import google.generativeai as genai
from typing import List, Dict

load_dotenv()

class DaVinciPetsChatBot:
    def __init__(self):
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        
        self.generation_config = {
            "temperature": float(os.getenv('AI_TEMPERATURE', 0.7)),
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": int(os.getenv('AI_MAX_TOKENS', 1000)),
        }
        
        self.system_prompt = """ 
        Você é um assistente virtual especializado em pets (cães e gatos).
        Seu objetivo é ajudar tutores de pets respondendo perguntas sobre:
        - Cuidados básicos (alimentação, higiene, exercícios)
        - Saúde e bem-estar
        - Comportamento e adestramento
        - Recomende as raças e tipos de pet/animais baseado no tamanho da residencia da pessoa
        - Escolha de raças
        - Primeiros socorros básicos
        - Produtos e acessórios para pets
        
        Características importantes:
        - Seja amigável e empático
        - Forneça respostas claras e objetivas
        - Quando apropriado, sugira consultar um veterinário
        - Use linguagem simples e acessível
        - Seja prestativo e positivo
        - Nunca seja rude com os tutores
        - Nunca de forma alguma xingue ou seja mal educado com os tutores
        
        IMPORTANTE: Você NÃO substitui consultas veterinárias. Em casos sérios de saúde,
        sempre recomende buscar um veterinário profissional.
        """ 
        
        self.model = genai.GenerativeModel(
            model_name='models/gemini-2.5-flash', 
            generation_config=self.generation_config,
        )
        
        self.chat_session = self.model.start_chat(history=[])
        
        self.chat_session.send_message(self.system_prompt)
        
    def chat(self, user_message: str) -> str:
        try:
            response = self.chat_session.send_message(user_message)
            return response.text
        except Exception as e:
            print(f"\n⚠️  ERRO DETALHADO: {str(e)}")
            print(f"Tipo do erro: {type(e).__name__}")
            error_message = f"Desculpe, ocorreu um erro ao processar a mensagem: {str(e)[:200]}"
            return error_message
    
    def stream_chat(self, user_message: str):
        """Envia mensagem e retorna generator para streaming"""
        try:
            response = self.chat_session.send_message(user_message, stream=True)
            for chunk in response:
                if chunk.text:
                    yield chunk.text
        except Exception as e:
            print(f"\n⚠️  ERRO DETALHADO: {str(e)}", file=sys.stderr, flush=True)
            print(f"Tipo do erro: {type(e).__name__}", file=sys.stderr, flush=True)
            error_message = f"Desculpe, ocorreu um erro ao processar a mensagem: {str(e)[:200]}"
            yield error_message
        
    def reset_conversation(self):
        self.chat_session = self.model.start_chat(history=[])
        self.chat_session.send_message(self.system_prompt)
        print("Conversa resetada!")
        
    def get_history(self) -> List[Dict[str, str]]:
        history = []
        for message in self.chat_session.history[1:]:
            history.append({
                "role": message.role,
                "content": message.parts[0].text
            })
        return history

# Modo API - para integração com Node.js
def api_mode():
    """Modo para comunicação via stdin/stdout com Node.js"""
    chatbot = DaVinciPetsChatBot()
    
    for line in sys.stdin:
        try:
            data = json.loads(line)
            command = data.get('command', 'chat')
            
            if command == 'chat':
                message = data.get('message', '')
                response = chatbot.chat(message)
                print(json.dumps({"success": True, "response": response}), flush=True)
            
            elif command == 'stream_chat':
                message = data.get('message', '')
                try:
                    for chunk_text in chatbot.stream_chat(message):
                        print(json.dumps({"type": "chunk", "text": chunk_text}), flush=True)
                    print(json.dumps({"type": "done"}), flush=True)
                except Exception as e:
                    print(json.dumps({"type": "error", "error": str(e)}), flush=True)
                
            elif command == 'reset':
                chatbot.reset_conversation()
                print(json.dumps({"success": True, "message": "Conversa resetada"}), flush=True)
                
            elif command == 'history':
                history = chatbot.get_history()
                print(json.dumps({"success": True, "history": history}), flush=True)
            
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}), flush=True)
    
def main():
    print(" Bem-vindo ao DaVinciPets!")
    print("Faça perguntas sobre cuidados com pets")
    print("Digite 'sair' para encerrar ou 'limpar' para reiniciar a conversa\n")
    
    if not os.getenv('GEMINI_API_KEY'):
        print("Erro: GEMINI_API_KEY não configurado")
        print("Configure sua chave do Google AI")
        return
    
    try:
        chatbot = DaVinciPetsChatBot()
        print("Chatbot iniciado!\n")
    except Exception as e:
        print(f" Erro na inicialização: {e}")
        return
    while True:
        user_input = input("\n Você:").strip()
        
        if not user_input:
            continue
        
        if user_input.lower() in ['sair', 'exit', 'quit']:
            print("\n Até logo!")
            break
        
        if user_input.lower() in ['limpar', 'reset', 'clear']:
            chatbot.reset_conversation()
            continue
        
        if user_input.lower() in ['historico', 'history']:
            history = chatbot.get_history()
            print(f"\n Histórico ({len(history)} mensagens):")
            for i, msg in enumerate(history, 1):
                role = "Você" if msg['role'] == 'user' else "Bot"
                print(f"{i}. {role}: {msg['content'][:100]}...")
            continue
        
        print("\n DaVinci:", end="", flush=True)
        response = chatbot.chat(user_input)
        print(response)
        
if __name__ == "__main__":
    # Se receber argumento --api, entra em modo API
    if len(sys.argv) > 1 and sys.argv[1] == '--api':
        api_mode()
    else:
        main()