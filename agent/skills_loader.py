"""
Skills Loader - Parse and load SKILL.md files for the Themis AML Agent

This module provides functionality to:
1. Discover skills in the skills/ directory
2. Parse SKILL.md files (YAML frontmatter + Markdown content)
3. Load skills on-demand for agent execution
4. Provide skill metadata for listing and search
"""

import os
import re
from pathlib import Path
from typing import Dict, List, Optional, Any
import yaml


class Skill:
    """Represents a single skill with metadata and content"""
    
    def __init__(
        self,
        name: str,
        description: str,
        content: str,
        version: str = "1.0.0",
        author: str = "",
        metadata: Optional[Dict[str, Any]] = None,
        file_path: Optional[str] = None
    ):
        self.name = name
        self.description = description
        self.content = content
        self.version = version
        self.author = author
        self.metadata = metadata or {}
        self.file_path = file_path
        
    @property
    def category(self) -> str:
        """Get skill category from metadata"""
        return self.metadata.get('hermes', {}).get('category', 'general')
    
    @property
    def tags(self) -> List[str]:
        """Get skill tags from metadata"""
        return self.metadata.get('hermes', {}).get('tags', [])
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert skill to dictionary for API responses"""
        return {
            'name': self.name,
            'description': self.description,
            'version': self.version,
            'author': self.author,
            'category': self.category,
            'tags': self.tags,
            'file_path': self.file_path
        }
    
    def __repr__(self):
        return f"Skill(name='{self.name}', category='{self.category}')"


class SkillsLoader:
    """Load and manage skills from the skills directory"""
    
    def __init__(self, skills_dir: str = None):
        """
        Initialize the skills loader
        
        Args:
            skills_dir: Path to skills directory. Defaults to ./skills
        """
        if skills_dir is None:
            # Default to skills/ directory relative to this file
            base_dir = Path(__file__).parent.parent
            skills_dir = base_dir / "skills"
        
        self.skills_dir = Path(skills_dir)
        self._skills_cache: Dict[str, Skill] = {}
        
    def discover_skills(self) -> List[Dict[str, Any]]:
        """
        Discover all SKILL.md files in the skills directory
        
        Returns:
            List of skill metadata dictionaries (name, description, category, tags)
        """
        skills = []
        
        if not self.skills_dir.exists():
            return skills
        
        # Walk through all subdirectories looking for SKILL.md files
        for skill_file in self.skills_dir.rglob("*.md"):
            try:
                skill = self._parse_skill_file(skill_file)
                if skill:
                    skills.append(skill.to_dict())
                    # Cache the skill
                    self._skills_cache[skill.name] = skill
            except Exception as e:
                print(f"Error parsing skill file {skill_file}: {e}")
                continue
        
        return skills
    
    def load_skill(self, skill_name: str) -> Optional[Skill]:
        """
        Load a specific skill by name
        
        Args:
            skill_name: Name of the skill to load
            
        Returns:
            Skill object or None if not found
        """
        # Check cache first
        if skill_name in self._skills_cache:
            return self._skills_cache[skill_name]
        
        # Search for the skill file
        for skill_file in self.skills_dir.rglob("*.md"):
            skill = self._parse_skill_file(skill_file)
            if skill and skill.name == skill_name:
                self._skills_cache[skill_name] = skill
                return skill
        
        return None
    
    def _parse_skill_file(self, file_path: Path) -> Optional[Skill]:
        """
        Parse a SKILL.md file with YAML frontmatter
        
        Args:
            file_path: Path to the skill file
            
        Returns:
            Skill object or None if parsing fails
        """
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Split frontmatter and content
            # Pattern: --- at start, YAML content, ---, then markdown
            pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
            match = re.match(pattern, content, re.DOTALL)
            
            if not match:
                # No frontmatter, skip this file
                return None
            
            frontmatter_str = match.group(1)
            markdown_content = match.group(2)
            
            # Parse YAML frontmatter
            frontmatter = yaml.safe_load(frontmatter_str)
            
            # Extract required fields
            name = frontmatter.get('name')
            description = frontmatter.get('description', '')
            
            if not name:
                print(f"Skill file {file_path} missing 'name' in frontmatter")
                return None
            
            # Create Skill object
            skill = Skill(
                name=name,
                description=description,
                content=markdown_content.strip(),
                version=frontmatter.get('version', '1.0.0'),
                author=frontmatter.get('author', ''),
                metadata=frontmatter.get('metadata', {}),
                file_path=str(file_path)
            )
            
            return skill
            
        except Exception as e:
            print(f"Error parsing skill file {file_path}: {e}")
            return None
    
    def list_skills(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        List all available skills, optionally filtered by category
        
        Args:
            category: Optional category filter (e.g., 'aml', 'devops')
            
        Returns:
            List of skill metadata dictionaries
        """
        skills = self.discover_skills()
        
        if category:
            skills = [s for s in skills if s.get('category') == category]
        
        return skills
    
    def search_skills(self, query: str) -> List[Dict[str, Any]]:
        """
        Search skills by name, description, or tags
        
        Args:
            query: Search query string
            
        Returns:
            List of matching skill metadata dictionaries
        """
        query_lower = query.lower()
        skills = self.discover_skills()
        
        matching_skills = []
        for skill in skills:
            # Search in name, description, and tags
            if (query_lower in skill['name'].lower() or
                query_lower in skill['description'].lower() or
                any(query_lower in tag.lower() for tag in skill.get('tags', []))):
                matching_skills.append(skill)
        
        return matching_skills
    
    def get_skill_content(self, skill_name: str) -> Optional[str]:
        """
        Get the full markdown content of a skill
        
        Args:
            skill_name: Name of the skill
            
        Returns:
            Markdown content or None if skill not found
        """
        skill = self.load_skill(skill_name)
        return skill.content if skill else None
    
    def clear_cache(self):
        """Clear the skills cache (useful for testing or reloading)"""
        self._skills_cache.clear()


# Convenience functions for common operations

def load_skill(skill_name: str, skills_dir: str = None) -> Optional[Skill]:
    """
    Load a skill by name
    
    Args:
        skill_name: Name of the skill to load
        skills_dir: Optional custom skills directory
        
    Returns:
        Skill object or None if not found
    """
    loader = SkillsLoader(skills_dir)
    return loader.load_skill(skill_name)


def list_all_skills(skills_dir: str = None) -> List[Dict[str, Any]]:
    """
    List all available skills
    
    Args:
        skills_dir: Optional custom skills directory
        
    Returns:
        List of skill metadata dictionaries
    """
    loader = SkillsLoader(skills_dir)
    return loader.list_skills()


def search_skills(query: str, skills_dir: str = None) -> List[Dict[str, Any]]:
    """
    Search for skills matching a query
    
    Args:
        query: Search query string
        skills_dir: Optional custom skills directory
        
    Returns:
        List of matching skill metadata dictionaries
    """
    loader = SkillsLoader(skills_dir)
    return loader.search_skills(query)


if __name__ == "__main__":
    # Test the skills loader
    print("Testing Skills Loader...\n")
    
    loader = SkillsLoader()
    
    print("Discovering skills...")
    skills = loader.discover_skills()
    print(f"Found {len(skills)} skills:\n")
    
    for skill in skills:
        print(f"  - {skill['name']}: {skill['description']}")
        print(f"    Category: {skill['category']}, Tags: {', '.join(skill['tags'])}")
        print()
    
    # Test loading a specific skill
    print("\nLoading 'alert-investigation' skill...")
    skill = loader.load_skill('alert-investigation')
    if skill:
        print(f"Loaded: {skill.name}")
        print(f"Description: {skill.description}")
        print(f"Content length: {len(skill.content)} characters")
        print(f"\nFirst 500 characters of content:")
        print(skill.content[:500])
    else:
        print("Skill not found!")
    
    # Test search
    print("\n\nSearching for 'structuring'...")
    results = loader.search_skills('structuring')
    print(f"Found {len(results)} matching skills:")
    for result in results:
        print(f"  - {result['name']}")
