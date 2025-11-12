import os
from typing import Optional, List, Dict, Any
from enum import Enum
from dataclasses import dataclass
from abc import ABC, abstractmethod


class Provider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    OLLAMA = "ollama"
    CUSTOM = "custom"


@dataclass
class Message:
    """Estrutura de mensagem para conversação"""
    role: str  # 'system', 'user', 'assistant'
    content: str
    metadata: Optional[Dict[str, Any]] = None


@dataclass
class AIConfig:
    """Configuração para o provedor de IA"""
    provider: Provider
    model: str
    api_key: Optional[str] = None
    base_url: Optional[str] = None
    temperature: float = 0.7
    max_tokens: int = 1000
    timeout: int = 30


class IAProvider(ABC):
    
    def __init__(self, config: AIConfig):
        self.config = config
    
    @abstractmethod
    def generate(self, messages: List[Message], **kwargs) -> str:
        """Gera resposta baseada nas mensagens"""
        pass
    
    @abstractmethod
    def stream_generate(self, messages: List[Message], **kwargs):
        pass


class OpenAIProvider(IAProvider):
    
    def __init__(self, config: AIConfig):
        super().__init__(config)
        try:
            from openai import OpenAI
            self.client = OpenAI(api_key=config.api_key)
        except ImportError:
            raise ImportError("OpenAI não instalado. Execute: pip install openai")
    
    def generate(self, messages: List[Message], **kwargs) -> str:
        messages_dict = [{"role": msg.role, "content": msg.content} for msg in messages]
        
        response = self.client.chat.completions.create(
            model=self.config.model,
            messages=messages_dict,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            **kwargs
        )
        
        return response.choices[0].message.content
    
    def stream_generate(self, messages: List[Message], **kwargs):
        messages_dict = [{"role": msg.role, "content": msg.content} for msg in messages]
        
        stream = self.client.chat.completions.create(
            model=self.config.model,
            messages=messages_dict,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            stream=True,
            **kwargs
        )
        
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content


class AnthropicProvider(IAProvider):
    
    def __init__(self, config: AIConfig):
        super().__init__(config)
        try:
            from anthropic import Anthropic
            self.client = Anthropic(api_key=config.api_key)
        except ImportError:
            raise ImportError("Anthropic não instalado. Execute: pip install anthropic")
    
    def generate(self, messages: List[Message], **kwargs) -> str:
        system_msg = next((msg.content for msg in messages if msg.role == "system"), None)
        chat_messages = [
            {"role": msg.role, "content": msg.content} 
            for msg in messages if msg.role != "system"
        ]
        
        response = self.client.messages.create(
            model=self.config.model,
            system=system_msg,
            messages=chat_messages,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            **kwargs
        )
        
        return response.content[0].text
    
    def stream_generate(self, messages: List[Message], **kwargs):
        system_msg = next((msg.content for msg in messages if msg.role == "system"), None)
        chat_messages = [
            {"role": msg.role, "content": msg.content} 
            for msg in messages if msg.role != "system"
        ]
        
        with self.client.messages.stream(
            model=self.config.model,
            system=system_msg,
            messages=chat_messages,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            **kwargs
        ) as stream:
            for text in stream.text_stream:
                yield text


class OllamaProvider(IAProvider):
    
    def __init__(self, config: AIConfig):
        super().__init__(config)
        try:
            import ollama
            self.client = ollama
        except ImportError:
            raise ImportError("Ollama não instalado. Execute: pip install ollama")
    
    def generate(self, messages: List[Message], **kwargs) -> str:
        messages_dict = [{"role": msg.role, "content": msg.content} for msg in messages]
        
        response = self.client.chat(
            model=self.config.model,
            messages=messages_dict,
            options={
                "temperature": self.config.temperature,
                "num_predict": self.config.max_tokens,
            },
            **kwargs
        )
        
        return response['message']['content']
    
    def stream_generate(self, messages: List[Message], **kwargs):
        messages_dict = [{"role": msg.role, "content": msg.content} for msg in messages]
        
        stream = self.client.chat(
            model=self.config.model,
            messages=messages_dict,
            stream=True,
            options={
                "temperature": self.config.temperature,
                "num_predict": self.config.max_tokens,
            },
            **kwargs
        )
        
        for chunk in stream:
            yield chunk['message']['content']


class IABase:

    def __init__(self, config: AIConfig):
        self.config = config
        self.provider = self._create_provider()
        self.conversation_history: List[Message] = []
    
    def _create_provider(self) -> IAProvider:
        providers = {
            Provider.OPENAI: OpenAIProvider,
            Provider.ANTHROPIC: AnthropicProvider,
            Provider.OLLAMA: OllamaProvider,
        }
        
        provider_class = providers.get(self.config.provider)
        if not provider_class:
            raise ValueError(f"Provedor {self.config.provider} não suportado")
        
        return provider_class(self.config)
    
    def set_system_prompt(self, prompt: str):
        self.conversation_history = [
            msg for msg in self.conversation_history if msg.role != "system"
        ]
        # Adiciona novo prompt no início
        self.conversation_history.insert(0, Message(role="system", content=prompt))
    
    def add_message(self, role: str, content: str, metadata: Optional[Dict] = None):
        """Adiciona mensagem ao histórico"""
        self.conversation_history.append(
            Message(role=role, content=content, metadata=metadata)
        )
    
    def generate(self, user_message: Optional[str] = None, **kwargs) -> str:

        if user_message:
            self.add_message("user", user_message)
        
        response = self.provider.generate(self.conversation_history, **kwargs)
        self.add_message("assistant", response)
        
        return response
    
    def stream(self, user_message: Optional[str] = None, **kwargs):
        if user_message:
            self.add_message("user", user_message)
        
        full_response = ""
        for chunk in self.provider.stream_generate(self.conversation_history, **kwargs):
            full_response += chunk
            yield chunk
        
        self.add_message("assistant", full_response)
    
    def clear_history(self, keep_system: bool = True):
        """Limpa histórico de conversação"""
        if keep_system:
            self.conversation_history = [
                msg for msg in self.conversation_history if msg.role == "system"
            ]
        else:
            self.conversation_history = []
    
    def get_history(self) -> List[Message]:
        """Retorna histórico de conversação"""
        return self.conversation_history.copy()
    
    def export_history(self) -> List[Dict]:
        """Exporta histórico em formato JSON"""
        return [
            {
                "role": msg.role,
                "content": msg.content,
                "metadata": msg.metadata
            }
            for msg in self.conversation_history
        ]
    
    def import_history(self, history: List[Dict]):
        """Importa histórico de conversação"""
        self.conversation_history = [
            Message(
                role=msg["role"],
                content=msg["content"],
                metadata=msg.get("metadata")
            )
            for msg in history
        ]


def create_ia_from_env() -> IABase:
    provider_str = os.getenv("AI_PROVIDER", "openai").lower()
    provider = Provider(provider_str)
    
    config = AIConfig(
        provider=provider,
        model=os.getenv("AI_MODEL", "gpt-3.5-turbo"),
        api_key=os.getenv("AI_API_KEY"),
        temperature=float(os.getenv("AI_TEMPERATURE", "0.7")),
        max_tokens=int(os.getenv("AI_MAX_TOKENS", "1000")),
    )
    
    return IABase(config)


# Exemplo de uso
if __name__ == "__main__":
    # Exemplo 1: Uso com variáveis de ambiente
    print("=== Exemplo 1: Configuração via .env ===")
    try:
        ia = create_ia_from_env()
        ia.set_system_prompt("Você é um assistente útil e amigável.")
        
        response = ia.generate("Olá! Como você está?")
        print(f"IA: {response}\n")
    except Exception as e:
        print(f"Erro (configure as variáveis de ambiente): {e}\n")
    
    # Exemplo 2: Uso com configuração manual (OpenAI)
    print("=== Exemplo 2: Configuração manual ===")
    try:
        config = AIConfig(
            provider=Provider.OPENAI,
            model="gpt-3.5-turbo",
            api_key=os.getenv("OPENAI_API_KEY"),
            temperature=0.7,
            max_tokens=500
        )
        
        ia = IABase(config)
        ia.set_system_prompt("Você é um especialista em pets.")
        
        response = ia.generate("Quais os cuidados básicos com um cachorro?")
        print(f"IA: {response}\n")
    except Exception as e:
        print(f"Erro: {e}\n")
    
    # Exemplo 3: Streaming
    print("=== Exemplo 3: Resposta em streaming ===")
    try:
        ia = create_ia_from_env()
        ia.set_system_prompt("Você é conciso e direto.")
        
        print("IA: ", end="", flush=True)
        for chunk in ia.stream("Me conte uma curiosidade sobre gatos em uma frase."):
            print(chunk, end="", flush=True)
        print("\n")
    except Exception as e:
        print(f"Erro: {e}\n")
