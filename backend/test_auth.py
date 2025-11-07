import requests
import json

BASE_URL = "http://localhost:5000/api"

def print_response(title, response):
    print(f"\n{'='*60}")
    print(f"📍 {title}")
    print(f"{'='*60}")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_auth():
    print("\n🧪 TESTING AUTHENTICATION APIS\n")
    
    # Test 1: Get Departments
    print("Test 1: Get Departments")
    response = requests.get(f"{BASE_URL}/auth/departments")
    print_response("GET /auth/departments", response)
    
    # Test 2: Register Student
    print("\n\nTest 2: Register Student")
    student_data = {
        "email": "john.doe@student.edu",
        "password": "password123",
        "role": "student",
        "first_name": "John",
        "last_name": "Doe",
        "phone": "9876543210",
        "department_id": 1,
        "enrollment_number": "CSE2021001"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=student_data)
    print_response("POST /auth/register (Student)", response)
    
    # Test 3: Login Student
    print("\n\nTest 3: Login Student")
    login_data = {
        "email": "john.doe@student.edu",
        "password": "password123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=login_data)
    print_response("POST /auth/login", response)
    
    if response.status_code == 200:
        token = response.json()['token']
        
        # Test 4: Get Current User
        print("\n\nTest 4: Get Current User (Protected Route)")
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
        print_response("GET /auth/me", response)
        
        # Test 5: Logout
        print("\n\nTest 5: Logout")
        response = requests.post(f"{BASE_URL}/auth/logout", headers=headers)
        print_response("POST /auth/logout", response)
    
    # Test 6: Register TPO
    print("\n\nTest 6: Register TPO")
    tpo_data = {
        "email": "tpo@college.edu",
        "password": "admin123",
        "role": "tpo",
        "first_name": "Admin",
        "last_name": "TPO",
        "phone": "9123456789",
        "designation": "Training & Placement Officer"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=tpo_data)
    print_response("POST /auth/register (TPO)", response)
    
    # Test 7: Register HOD
    print("\n\nTest 7: Register HOD")
    hod_data = {
        "email": "hod.cse@college.edu",
        "password": "hod123",
        "role": "hod",
        "first_name": "Dr. Jane",
        "last_name": "Smith",
        "phone": "9234567890",
        "department_id": 1
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=hod_data)
    print_response("POST /auth/register (HOD)", response)
    
    print("\n\n" + "="*60)
    print("✅ AUTHENTICATION API TESTING COMPLETE")
    print("="*60 + "\n")

if __name__ == "__main__":
    test_auth()
