# jules/smoke_test_jules.py
import os
from jules_core import iniciar_sessao_jules

def smoke_test():
    print("🚀 [SMOKE TEST] Validando conexão com Jules API v1alpha...")
    
    # 1. Verifica se a chave está no ambiente local
    key = os.environ.get("JULES_API_KEY")
    if not key:
        print("❌ ERRO LOCAL: Você esqueceu de dar o export/set da JULES_API_KEY no seu terminal!")
        return

    print(f"🔑 Chave detectada (iniciada em: {key[:6]}...)")

    # 2. Tenta uma missão ultra-simples (apenas texto)
    missao_teste = "Responda apenas 'Ponte estabelecida com sucesso!' para validar nossa integração API."
    
    print("📡 Enviando sinal para a Google...")
    resultado = iniciar_sessao_jules(missao_teste)

    if resultado:
        print("\n✨ SUCESSO TOTAL! ✨")
        print(f"O Jules criou a sessão: {resultado.get('name')}")
        print("Agora sabemos que a chave é válida e o formato do JSON está correto.")
    else:
        print("\n❌ FALHA NA CONEXÃO.")
        print("Verifique se a chave no terminal é a mesma que você gerou em jules.google.com/settings")

if __name__ == "__main__":
    smoke_test()