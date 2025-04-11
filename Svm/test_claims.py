#!/usr/bin/env python3
import requests
import json
from colorama import init, Fore, Style
import sys

# Initialize colorama for colored output
init()

# API endpoint URL for the local Flask server
API_URL = "http://localhost:8000/predict"
HEALTH_URL = "http://localhost:8000/health"

# Sample claims to test with our improved extraction capabilities
sample_claims = [
    # Numerical claims
    "Amazon reported revenue of $514.22 billion in 2022.",
    "The unemployment rate fell to 4.5% last month.",
    "The company has over 25,000 employees worldwide.",
    "The project was completed on January 15, 2023.",
    
    # Factual claims
    "Paris is the capital of France and is known for the Eiffel Tower.",
    "The Earth orbits the Sun once every 365.25 days.",
    "According to researchers, coffee consumption is linked to reduced risk of heart disease.",
    "SpaceX successfully launched 58 Starlink satellites into orbit yesterday.",
    
    # Statistical claims
    "Studies show that 72% of consumers prefer eco-friendly packaging.",
    "The average price of a new home increased by $45,000 compared to last year.",
    "The survey found that four out of five doctors recommend this treatment.",
    
    # Claims with comparisons
    "Electric vehicles are more energy-efficient than gasoline cars.",
    "This year's budget is 15% higher than last year's allocation.",
    "Women are now more likely than men to graduate from college."
]

def check_server_health():
    """Check if the Flask server is running and healthy"""
    try:
        response = requests.get(HEALTH_URL, timeout=3)
        if response.status_code == 200 and response.json().get('status') == 'healthy':
            print(f"{Fore.GREEN}✓ Server is running and healthy{Style.RESET_ALL}")
            return True
        else:
            print(f"{Fore.RED}✗ Server returned unexpected response: {response.text}{Style.RESET_ALL}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"{Fore.RED}✗ Could not connect to server at {HEALTH_URL}{Style.RESET_ALL}")
        return False
    except Exception as e:
        print(f"{Fore.RED}✗ Error checking server health: {str(e)}{Style.RESET_ALL}")
        return False

def test_claims():
    """Test all claims against the API"""
    print(f"\n{Fore.CYAN}Testing {len(sample_claims)} claims with improved claim extraction...{Style.RESET_ALL}\n")
    
    results = []
    
    for i, claim in enumerate(sample_claims):
        print(f"{Fore.YELLOW}Claim #{i+1}:{Style.RESET_ALL} {claim}")
        
        try:
            # Call the API
            response = requests.post(
                API_URL,
                headers={'Content-Type': 'application/json'},
                json={'claim': claim},
                timeout=5
            )
            
            if response.status_code == 200:
                result = response.json()
                claim_result = {
                    'claim': claim,
                    'isTrue': result.get('isTrue', False),
                    'confidence': result.get('confidence', 0),
                    'status': result.get('status', 'unknown')
                }
                
                # Print the result with color coding
                truth_status = f"{Fore.GREEN}TRUE" if claim_result['isTrue'] else f"{Fore.RED}FALSE"
                print(f"  → Result: {truth_status}{Style.RESET_ALL} (Confidence: {claim_result['confidence']}%)")
                
                results.append(claim_result)
            else:
                print(f"  → {Fore.RED}Error: API returned status code {response.status_code}{Style.RESET_ALL}")
                print(f"  → Response: {response.text}")
        
        except requests.exceptions.ConnectionError:
            print(f"  → {Fore.RED}Error: Failed to connect to the API server{Style.RESET_ALL}")
            break
        except Exception as e:
            print(f"  → {Fore.RED}Error: {str(e)}{Style.RESET_ALL}")
        
        print("")  # Add empty line between claims
    
    return results

def main():
    """Main function to run the tests"""
    print(f"{Fore.CYAN}===== Claim Extraction Testing Tool ====={Style.RESET_ALL}")
    
    # Check if server is healthy
    if not check_server_health():
        print(f"\n{Fore.RED}Server not available. Make sure it's running with: bash run_server.sh{Style.RESET_ALL}")
        sys.exit(1)
    
    # Run the tests
    results = test_claims()
    
    # Print summary
    true_claims = sum(1 for r in results if r['isTrue'])
    false_claims = len(results) - true_claims
    
    print(f"\n{Fore.CYAN}===== Test Summary ====={Style.RESET_ALL}")
    print(f"Total claims tested: {len(results)}")
    print(f"Claims marked TRUE: {true_claims}")
    print(f"Claims marked FALSE: {false_claims}")
    print(f"Average confidence: {sum(r['confidence'] for r in results) / len(results):.1f}%")
    
    print(f"\n{Fore.GREEN}Testing completed successfully!{Style.RESET_ALL}")

if __name__ == "__main__":
    main() 