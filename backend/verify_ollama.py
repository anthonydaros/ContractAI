import asyncio
import os
import sys
import logging

# Add root to path
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from backend.src.infrastructure.llm.ollama_gateway import OllamaGateway

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def main():
    print("--- Starting Ollama Verification ---")
    
    # 1. Initialize Gateway
    try:
        gateway = OllamaGateway()
        print(f"✅ Gateway initialized.")
        print(f"Target URL: {gateway.base_url}")
        print(f"Target Model: {gateway.model}")
    except Exception as e:
        print(f"❌ Failed to initialize gateway: {e}")
        return

    # 2. Test Text Generation
    print("\n--- Test 1: Simple Generation ---")
    try:
        response = await gateway.generate_text("Hello, who are you?", system="You are a helpful assistant.")
        print(f"Response: {response}")
        print("✅ Generation successful")
    except Exception as e:
        print(f"❌ Generation failed: {e}")
        return

    # 3. Test Contract Analysis (JSON)
    print("\n--- Test 2: Contract Analysis (JSON Schema) ---")
    dummy_contract = """
    CONTRACT AGREEMENT
    This Agreement is made on 2024-01-01 between Party A and Party B.
    1. Confidentiality: Party B shall keep all info confidential forever.
    2. Indemnification: Party B indemnifies Party A for everything including indirect damages.
    3. Termination: Party A may terminate at any time without notice.
    """
    
    try:
        analysis = await gateway.analyze_contract(dummy_contract)
        print("Analysis Result:")
        print(analysis)
        
        if analysis.get("contract_type") and "clauses" in analysis:
            print("✅ JSON Analysis successful & structure valid")
        else:
            print("⚠️ JSON Analysis returned but structure looks partial")
            
    except Exception as e:
        print(f"❌ Analysis failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())
