"""
Test Themis Agent API Integration
"""

import requests
import json
import time

API_BASE = "http://localhost:8000"


def test_health():
    """Test health endpoint"""
    print("\n" + "="*70)
    print("TEST 1: Health Check")
    print("="*70)
    
    response = requests.get(f"{API_BASE}/health")
    data = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(data, indent=2)}")
    
    assert response.status_code == 200
    assert data["status"] == "healthy"
    
    print("✅ PASS: Health check successful\n")


def test_root():
    """Test root endpoint"""
    print("="*70)
    print("TEST 2: Root Endpoint")
    print("="*70)
    
    response = requests.get(f"{API_BASE}/")
    data = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Service: {data['service']}")
    print(f"Agent Ready: {data['agent_ready']}")
    print(f"Skills Loaded: {data['skills_loaded']}")
    
    assert response.status_code == 200
    assert data["agent_ready"] == True
    assert data["skills_loaded"] > 0
    
    print("✅ PASS: Root endpoint working\n")


def test_list_skills():
    """Test skills listing"""
    print("="*70)
    print("TEST 3: List Skills")
    print("="*70)
    
    response = requests.get(f"{API_BASE}/api/skills")
    data = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Skills Count: {data['count']}")
    print(f"Skills: {', '.join([s['name'] for s in data['skills']])}")
    
    assert response.status_code == 200
    assert data["count"] == 6
    
    print("✅ PASS: Skills listing successful\n")


def test_investigate_blocking():
    """Test blocking investigation endpoint"""
    print("="*70)
    print("TEST 4: Blocking Investigation")
    print("="*70)
    
    alert_id = "AML123456"
    
    print(f"Investigating alert: {alert_id}")
    print("This may take a few seconds...\n")
    
    start_time = time.time()
    
    response = requests.post(
        f"{API_BASE}/api/investigate",
        json={"alert_id": alert_id}
    )
    
    elapsed = time.time() - start_time
    
    data = response.json()
    
    print(f"Status: {response.status_code}")
    print(f"Alert ID: {data['alert_id']}")
    print(f"Status: {data['status']}")
    print(f"Recommendation: {data['recommendation']}")
    print(f"Confidence: {data['confidence']}%")
    print(f"Risk Score: {data['risk_score']['risk_score']}/100")
    print(f"Risk Level: {data['risk_score']['risk_level']}")
    print(f"Journal Entries: {len(data['journal'])}")
    print(f"Elapsed Time: {elapsed:.2f}s")
    
    assert response.status_code == 200
    assert data["status"] == "completed"
    assert data["recommendation"] in ["CLEAR", "REVIEW", "ESCALATE"]
    assert len(data["journal"]) == 10
    
    print("✅ PASS: Blocking investigation successful\n")
    
    return data


def test_investigate_streaming():
    """Test streaming investigation endpoint"""
    print("="*70)
    print("TEST 5: Streaming Investigation")
    print("="*70)
    
    alert_id = "AML789012"
    
    print(f"Investigating alert: {alert_id} (streaming)")
    print("Receiving real-time updates...\n")
    
    response = requests.get(
        f"{API_BASE}/api/investigate/{alert_id}/stream",
        stream=True
    )
    
    events = []
    
    for line in response.iter_lines():
        if line:
            line = line.decode('utf-8')
            if line.startswith('data: '):
                data = json.loads(line[6:])
                events.append(data)
                
                if data['type'] == 'start':
                    print(f"🚀 Investigation started: {data['alert_id']}")
                elif data['type'] == 'step_start':
                    print(f"📋 Step {data['step']}: {data['step_name']}")
                elif data['type'] == 'step_complete':
                    print(f"   ✓ Findings: {len(data['findings'])}")
                elif data['type'] == 'complete':
                    print(f"\n✅ Investigation complete!")
                    print(f"   Recommendation: {data['recommendation']}")
                    print(f"   Confidence: {data['confidence']}%")
                elif data['type'] == 'error':
                    print(f"❌ Error: {data['error']}")
    
    # Verify we got all expected events
    start_events = [e for e in events if e['type'] == 'start']
    step_events = [e for e in events if e['type'] == 'step_complete']
    complete_events = [e for e in events if e['type'] == 'complete']
    
    assert len(start_events) == 1
    assert len(step_events) == 10
    assert len(complete_events) == 1
    
    print(f"\n✅ PASS: Streaming investigation successful")
    print(f"   Total events: {len(events)}")
    print(f"   Steps completed: {len(step_events)}\n")


def run_all_tests():
    """Run all API integration tests"""
    print("\n" + "="*70)
    print("  THEMIS AGENT API - INTEGRATION TESTS")
    print("="*70)
    print("\nMake sure the API server is running:")
    print("  python agent/api.py")
    print("\nOr:")
    print("  cd agent && uvicorn api:app --reload")
    print("\n" + "="*70)
    
    try:
        # Test API availability
        requests.get(f"{API_BASE}/health", timeout=2)
    except requests.exceptions.ConnectionError:
        print("\n❌ ERROR: API server not running!")
        print("Please start the server first:")
        print("  python agent/api.py")
        return False
    
    tests = [
        test_health,
        test_root,
        test_list_skills,
        test_investigate_blocking,
        test_investigate_streaming
    ]
    
    passed = 0
    failed = 0
    
    for test in tests:
        try:
            test()
            passed += 1
        except Exception as e:
            failed += 1
            print(f"\n❌ FAIL: {test.__name__}")
            print(f"   Error: {str(e)}\n")
    
    print("="*70)
    print("TEST SUMMARY")
    print("="*70)
    print(f"Total Tests: {len(tests)}")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    print(f"\nSuccess Rate: {(passed/len(tests)*100):.1f}%")
    
    if failed == 0:
        print(f"\n🎉 ALL TESTS PASSED! API integration is ready.")
    
    return failed == 0


if __name__ == "__main__":
    import sys
    success = run_all_tests()
    sys.exit(0 if success else 1)
