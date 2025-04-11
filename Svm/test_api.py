#!/usr/bin/env python3
import requests
import json
import sys

# API endpoint URL
API_URL = "http://localhost:5000/predict"

# Test claims
test_claims = [
    "The US economy grew by 3.5% last year.",
    "The vaccine is 95% effective against the virus.",
    "Amazon stock increased by 20% over the past month.",
    "The federal government spent $2.3 trillion on healthcare."
]

def test_api():
    """Test the local Flask API with sample claims"""
    print("Testing News Fact Checker API...")
    
    # First check if the server is running
    try:
        health_response = requests.get("http://localhost:5000/health")
        if health_response.status_code != 200:
            print(f"Error: Server is not healthy. Status code: {health_response.status_code}")
            return False
        print("Server is running and healthy.")
    except requests.exceptions.ConnectionError:
        print("Error: Could not connect to the server. Make sure it's running on http://localhost:5000")
        print("Run 'bash run_server.sh' in the Svm directory to start the server.")
        return False
    
    # Test with each claim
    all_passed = True
    for i, claim in enumerate(test_claims):
        print(f"\nTest {i+1}: Checking claim: \"{claim}\"")
        try:
            # Send the POST request
            response = requests.post(
                API_URL,
                headers={"Content-Type": "application/json"},
                data=json.dumps({"claim": claim})
            )
            
            # Check if the request was successful
            if response.status_code == 200:
                result = response.json()
                print(f"Result: {'TRUE' if result['isTrue'] else 'FALSE'}")
                print(f"Confidence: {result['confidence']}%")
                print("✓ Test passed")
            else:
                print(f"✗ Test failed: Server returned {response.status_code}")
                print(f"Response: {response.text}")
                all_passed = False
        
        except Exception as e:
            print(f"✗ Test failed: {str(e)}")
            all_passed = False
    
    # Summary
    if all_passed:
        print("\n✅ All tests passed! The API is working correctly.")
    else:
        print("\n❌ Some tests failed. Please check the errors above.")
    
    return all_passed

if __name__ == "__main__":
    success = test_api()
    sys.exit(0 if success else 1) 