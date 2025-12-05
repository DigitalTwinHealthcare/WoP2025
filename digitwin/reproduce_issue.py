import requests
import sys

def test_cors():
    url = "http://localhost:8001/patients"
    origin = "http://localhost:5173"
    headers = {
        "Origin": origin,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "authorization"
    }
    
    print(f"Testing OPTIONS {url} with Origin: {origin}")
    try:
        response = requests.options(url, headers=headers, timeout=5)
        print(f"Status Code: {response.status_code}")
        print("Headers:")
        for k, v in response.headers.items():
            print(f"  {k}: {v}")
            
        if "Access-Control-Allow-Origin" in response.headers:
            print("CORS Header Present: Yes")
        else:
            print("CORS Header Present: NO")
            
    except Exception as e:
        print(f"Error: {e}")

def test_health():
    url = "http://localhost:8001/health"
    print(f"\nTesting GET {url}")
    try:
        response = requests.get(url, timeout=5)
        print(f"Status Code: {response.status_code}")
        print(f"Content: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_health()
    test_cors()
