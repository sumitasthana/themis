"""
Test script for the Themis Skills System

Run this to verify that:
1. Skills are discovered correctly
2. YAML frontmatter is parsed
3. Markdown content is loaded
4. Search functionality works
"""

import sys
from pathlib import Path

# Add agent directory to path
sys.path.insert(0, str(Path(__file__).parent / "agent"))

from skills_loader import SkillsLoader


def test_skills_discovery():
    """Test that all skills are discovered"""
    print("=" * 70)
    print("TEST 1: Skills Discovery")
    print("=" * 70)
    
    loader = SkillsLoader()
    skills = loader.discover_skills()
    
    print(f"\n✓ Found {len(skills)} skills\n")
    
    expected_skills = [
        'alert-investigation',
        'structuring-detection',
        'kyc-verification',
        'network-analysis',
        'risk-scoring',
        'narrative-generation'
    ]
    
    found_names = [s['name'] for s in skills]
    
    for expected in expected_skills:
        if expected in found_names:
            print(f"  ✓ {expected}")
        else:
            print(f"  ✗ {expected} - NOT FOUND!")
    
    print(f"\nExpected: {len(expected_skills)}, Found: {len(skills)}")
    
    if len(skills) == len(expected_skills):
        print("✓ All expected skills found!\n")
        return True
    else:
        print("✗ Some skills missing!\n")
        return False


def test_skill_metadata():
    """Test that skill metadata is parsed correctly"""
    print("=" * 70)
    print("TEST 2: Skill Metadata Parsing")
    print("=" * 70)
    
    loader = SkillsLoader()
    skill = loader.load_skill('alert-investigation')
    
    if not skill:
        print("✗ Failed to load alert-investigation skill\n")
        return False
    
    print(f"\n✓ Loaded skill: {skill.name}\n")
    print(f"  Name: {skill.name}")
    print(f"  Description: {skill.description}")
    print(f"  Version: {skill.version}")
    print(f"  Author: {skill.author}")
    print(f"  Category: {skill.category}")
    print(f"  Tags: {', '.join(skill.tags)}")
    print(f"  Content length: {len(skill.content)} characters")
    
    # Verify expected values
    checks = [
        (skill.name == 'alert-investigation', "Name is 'alert-investigation'"),
        (skill.category == 'aml', "Category is 'aml'"),
        ('aml' in skill.tags, "'aml' in tags"),
        (len(skill.content) > 1000, "Content has substantial length"),
    ]
    
    print("\nValidation:")
    all_passed = True
    for check, description in checks:
        if check:
            print(f"  ✓ {description}")
        else:
            print(f"  ✗ {description}")
            all_passed = False
    
    print()
    return all_passed


def test_skill_content():
    """Test that skill content is loaded correctly"""
    print("=" * 70)
    print("TEST 3: Skill Content Loading")
    print("=" * 70)
    
    loader = SkillsLoader()
    
    # Test loading different skills
    test_skills = [
        'alert-investigation',
        'structuring-detection',
        'network-analysis'
    ]
    
    all_passed = True
    
    for skill_name in test_skills:
        skill = loader.load_skill(skill_name)
        
        if not skill:
            print(f"\n✗ Failed to load {skill_name}")
            all_passed = False
            continue
        
        print(f"\n✓ Loaded {skill_name}")
        print(f"  Content preview (first 200 chars):")
        print(f"  {skill.content[:200]}...")
        
        # Check for expected sections
        expected_sections = ['When to Use', 'Procedure', 'Pitfalls']
        found_sections = [s for s in expected_sections if s in skill.content]
        
        print(f"  Sections found: {len(found_sections)}/{len(expected_sections)}")
        
        if len(found_sections) < len(expected_sections):
            print(f"  ✗ Missing sections: {set(expected_sections) - set(found_sections)}")
            all_passed = False
    
    print()
    return all_passed


def test_skill_search():
    """Test skill search functionality"""
    print("=" * 70)
    print("TEST 4: Skill Search")
    print("=" * 70)
    
    loader = SkillsLoader()
    
    # Test different search queries
    test_queries = [
        ('structuring', ['structuring-detection']),
        ('network', ['network-analysis']),
        ('kyc', ['kyc-verification']),
        ('aml', ['alert-investigation', 'structuring-detection', 'kyc-verification', 
                 'network-analysis', 'risk-scoring', 'narrative-generation']),
    ]
    
    all_passed = True
    
    for query, expected_names in test_queries:
        results = loader.search_skills(query)
        found_names = [r['name'] for r in results]
        
        print(f"\nQuery: '{query}'")
        print(f"  Expected: {len(expected_names)} results")
        print(f"  Found: {len(results)} results")
        
        # Check if all expected skills are found
        missing = set(expected_names) - set(found_names)
        extra = set(found_names) - set(expected_names)
        
        if not missing and not extra:
            print(f"  ✓ All expected skills found")
        else:
            if missing:
                print(f"  ✗ Missing: {missing}")
                all_passed = False
            if extra:
                print(f"  ℹ Extra: {extra}")
    
    print()
    return all_passed


def test_skill_categories():
    """Test skill categorization"""
    print("=" * 70)
    print("TEST 5: Skill Categories")
    print("=" * 70)
    
    loader = SkillsLoader()
    skills = loader.discover_skills()
    
    # Group by category
    by_category = {}
    for skill in skills:
        category = skill.get('category', 'uncategorized')
        if category not in by_category:
            by_category[category] = []
        by_category[category].append(skill['name'])
    
    print(f"\nSkills by category:\n")
    for category, skill_names in by_category.items():
        print(f"  {category}: {len(skill_names)} skills")
        for name in skill_names:
            print(f"    - {name}")
    
    # All skills should be in 'aml' category
    if 'aml' in by_category and len(by_category['aml']) == 6:
        print(f"\n✓ All 6 skills correctly categorized as 'aml'\n")
        return True
    else:
        print(f"\n✗ Category distribution unexpected\n")
        return False


def run_all_tests():
    """Run all tests and report results"""
    print("\n" + "=" * 70)
    print("THEMIS SKILLS SYSTEM - TEST SUITE")
    print("=" * 70 + "\n")
    
    tests = [
        ("Skills Discovery", test_skills_discovery),
        ("Skill Metadata", test_skill_metadata),
        ("Skill Content", test_skill_content),
        ("Skill Search", test_skill_search),
        ("Skill Categories", test_skill_categories),
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            passed = test_func()
            results.append((test_name, passed))
        except Exception as e:
            print(f"\n✗ Test '{test_name}' failed with exception: {e}\n")
            results.append((test_name, False))
    
    # Summary
    print("=" * 70)
    print("TEST SUMMARY")
    print("=" * 70 + "\n")
    
    passed_count = sum(1 for _, passed in results if passed)
    total_count = len(results)
    
    for test_name, passed in results:
        status = "✓ PASS" if passed else "✗ FAIL"
        print(f"  {status}: {test_name}")
    
    print(f"\nTotal: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("\n🎉 All tests passed! Skills system is working correctly.\n")
        return 0
    else:
        print(f"\n⚠️  {total_count - passed_count} test(s) failed. Please review.\n")
        return 1


if __name__ == "__main__":
    exit_code = run_all_tests()
    sys.exit(exit_code)
