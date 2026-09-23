"""Tavily search tool for researching job requirements."""
import os
from tavily import TavilyClient


def research_role_requirements(role: str) -> dict:
    """
    Use Tavily to research real-world requirements for a given job role.

    Args:
        role: The target job role (e.g., "Backend Developer")

    Returns:
        dict with role, summary, and requirements list
    """
    api_key = os.getenv("TAVILY_API_KEY")

    if not api_key or api_key == "your_tavily_api_key_here":
        # Fallback: return basic research if no API key
        return _fallback_research(role)

    try:
        client = TavilyClient(api_key=api_key)

        # Search for job requirements
        search_query = f"{role} required skills responsibilities technologies 2025 2026"
        response = client.search(
            query=search_query,
            max_results=5,
            search_depth="basic",
        )

        results = response.get("results", [])

        # Extract key information from search results
        combined_text = "\n".join([r.get("content", "") for r in results])

        requirements = _extract_requirements(combined_text, role)

        return {
            "role": role,
            "summary": f"Researched requirements for {role} position",
            "requirements": requirements,
            "raw_sources": [r.get("url", "") for r in results[:3]],
        }

    except Exception as e:
        print(f"Tavily search failed: {e}")
        return _fallback_research(role)


def _extract_requirements(text: str, role: str) -> list:
    """Extract structured requirements from search results text."""
    text_lower = text.lower()

    # Common tech requirements per role
    role_requirements = {
        "backend developer": [
            "Python", "Java", "Go", "Node.js",
            "REST APIs", "GraphQL",
            "SQL databases (PostgreSQL, MySQL)",
            "NoSQL databases (MongoDB, Redis)",
            "Docker", "Kubernetes",
            "Cloud platforms (AWS, GCP, Azure)",
            "System design",
            "Git version control",
            "CI/CD pipelines",
            "Authentication & security",
            "Microservices architecture",
            "Caching strategies",
            "Message queues",
        ],
        "frontend developer": [
            "HTML", "CSS", "JavaScript",
            "React", "Vue.js", "Angular",
            "TypeScript",
            "Responsive design",
            "REST API integration",
            "State management",
            "CSS frameworks (Tailwind, Bootstrap)",
            "Testing (Jest, Cypress)",
            "Performance optimization",
            "Accessibility (WCAG)",
            "Web security basics",
        ],
        "full stack developer": [
            "HTML", "CSS", "JavaScript",
            "React or Vue.js",
            "Node.js or Python",
            "SQL databases",
            "NoSQL databases",
            "REST APIs",
            "Git version control",
            "Docker",
            "Cloud deployment",
            "System design basics",
            "Authentication",
        ],
        "data analyst": [
            "SQL",
            "Python or R",
            "Excel / Google Sheets",
            "Data visualization (Tableau, Power BI)",
            "Statistics",
            "Pandas, NumPy",
            "Data cleaning",
            "Business acumen",
            "Communication skills",
            "ETL processes",
        ],
        "software engineer": [
            "Data structures & algorithms",
            "Object-oriented programming",
            "System design",
            "Git version control",
            "SQL databases",
            "REST APIs",
            "Testing",
            "CI/CD",
            "Cloud platforms",
            "Docker",
            "Code review practices",
            "Agile methodology",
        ],
        "data scientist": [
            "Python", "R", "Statistics",
            "Machine learning", "Deep learning",
            "Pandas, NumPy", "Scikit-learn",
            "SQL", "Data visualization",
            "Feature engineering", "Model evaluation",
            "Jupyter / notebooks",
        ],
        "ml engineer": [
            "Python", "Machine learning",
            "TensorFlow / PyTorch", "MLOps",
            "Model deployment", "Feature stores",
            "Docker", "Cloud platforms",
            "SQL", "Data pipelines",
            "Experiment tracking", "CI/CD",
        ],
        "devops engineer": [
            "Linux", "Docker", "Kubernetes",
            "CI/CD pipelines", "AWS / GCP / Azure",
            "Terraform", "Ansible",
            "Monitoring (Prometheus, Grafana)",
            "Git version control", "Networking basics",
            "Shell scripting", "Security best practices",
        ],
        "cloud engineer": [
            "AWS / Azure / GCP", "Cloud architecture",
            "IAM & security", "Networking (VPC, DNS)",
            "Compute & storage services", "Serverless",
            "Infrastructure as Code", "Cost optimization",
            "Monitoring & logging", "Disaster recovery",
            "Docker / Kubernetes", "CI/CD",
        ],
        "qa engineer": [
            "Test planning", "Manual testing",
            "Automation (Selenium, Playwright, Cypress)",
            "API testing (Postman, REST)",
            "Bug tracking (Jira)", "SQL basics",
            "CI/CD integration", "Performance testing",
            "Agile methodology", "Test documentation",
            "Regression testing", "Git version control",
        ],
        "mobile developer": [
            "Android (Kotlin/Java)", "iOS (Swift)",
            "Flutter / React Native", "UI/UX for mobile",
            "REST API integration", "Local storage",
            "Push notifications", "App performance",
            "Testing", "App Store / Play Store deployment",
            "Git version control", "State management",
        ],
        "product manager": [
            "Product strategy", "Roadmap planning",
            "User research", "Market analysis",
            "Agile / Scrum", "Stakeholder management",
            "Metrics & KPIs", "A/B testing",
            "Wireframing / prototyping", "Prioritization frameworks",
            "Communication skills", "Data-driven decisions",
        ],
    }

    # Get base requirements for the role
    role_key = role.lower().strip()
    known_role = role_key in role_requirements

    if known_role:
        base_reqs = role_requirements[role_key]
        # Filter based on what's mentioned in search results
        matched = []
        for req in base_reqs:
            req_lower = req.lower()
            keywords = req_lower.replace("/", " ").replace("(", " ").replace(")", " ").split()
            if any(kw in text_lower for kw in keywords if len(kw) > 3):
                matched.append(req)

        must_have = ["REST APIs", "Git version control"]
        for item in must_have:
            if item not in matched:
                matched.append(item)

        if len(matched) < 8:
            for req in base_reqs:
                if req not in matched:
                    matched.append(req)
                if len(matched) >= 10:
                    break

        return matched[:12]

    # Custom / unknown role: build requirements from search text
    return _requirements_from_text(text_lower, role)


def _requirements_from_text(text_lower: str, role: str) -> list:
    """Build requirements list from live search text for a custom role."""
    generic_pool = [
        "Programming fundamentals", "Problem solving",
        "Version control (Git)", "REST APIs",
        "SQL databases", "Testing & QA",
        "System design basics", "Cloud platforms",
        "Docker / containers", "CI/CD pipelines",
        "Communication skills", "Agile methodology",
        "Security best practices", "Data structures & algorithms",
        "API design", "Monitoring & logging",
    ]

    # Common tech tokens worth keeping if they show up in search results
    tech_tokens = [
        "python", "java", "javascript", "typescript", "react", "node.js", "nodejs",
        "sql", "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes",
        "aws", "azure", "gcp", "terraform", "kafka", "graphql", "rest",
        "linux", "git", "ci/cd", "pytest", "jest", "selenium", "kotlin",
        "swift", "flutter", "react native", "pandas", "tensorflow", "pytorch",
        "scikit-learn", "excel", "tableau", "power bi", "jira", "agile", "scrum",
    ]

    matched = [t for t in tech_tokens if t in text_lower]
    requirements = []
    for item in matched:
        pretty = item.upper() if item in ("sql", "aws", "gcp", "git", "rest") else item.title()
        if pretty not in requirements:
            requirements.append(pretty)

    # Fill with generic professional requirements
    for req in generic_pool:
        if len(requirements) >= 10:
            break
        if req not in requirements:
            requirements.append(req)

    # Role context line so downstream prompts stay grounded
    requirements.insert(0, f"Core skills for {role}")
    return requirements[:12]


def _fallback_research(role: str) -> dict:
    """Provide fallback research when Tavily is unavailable."""
    role_lower = role.lower()

    fallback_data = {
        "backend developer": {
            "role": "Backend Developer",
            "summary": "Standard requirements for Backend Developer positions",
            "requirements": [
                "Python/Java/Go", "REST APIs", "SQL databases",
                "NoSQL databases", "Docker", "Cloud platforms (AWS/GCP)",
                "System design", "Git version control", "Authentication & security",
                "Microservices", "Caching (Redis)", "CI/CD pipelines"
            ],
        },
        "frontend developer": {
            "role": "Frontend Developer",
            "summary": "Standard requirements for Frontend Developer positions",
            "requirements": [
                "HTML/CSS/JavaScript", "React/Vue/Angular", "TypeScript",
                "Responsive design", "REST API integration", "State management",
                "CSS frameworks", "Testing", "Performance optimization",
                "Accessibility", "Git version control"
            ],
        },
        "full stack developer": {
            "role": "Full Stack Developer",
            "summary": "Standard requirements for Full Stack Developer positions",
            "requirements": [
                "HTML/CSS/JavaScript", "React/Vue", "Node.js/Python",
                "SQL databases", "NoSQL databases", "REST APIs",
                "Git", "Docker", "Cloud deployment", "System design",
                "Authentication", "CI/CD"
            ],
        },
        "data analyst": {
            "role": "Data Analyst",
            "summary": "Standard requirements for Data Analyst positions",
            "requirements": [
                "SQL", "Python/R", "Excel", "Tableau/Power BI",
                "Statistics", "Pandas/NumPy", "Data cleaning",
                "Business acumen", "Communication", "ETL processes"
            ],
        },
        "software engineer": {
            "role": "Software Engineer",
            "summary": "Standard requirements for Software Engineer positions",
            "requirements": [
                "Data structures & algorithms", "OOP", "System design",
                "Git", "SQL databases", "REST APIs", "Testing",
                "CI/CD", "Cloud platforms", "Docker", "Agile methodology"
            ],
        },
        "data scientist": {
            "role": "Data Scientist",
            "summary": "Standard requirements for Data Scientist positions",
            "requirements": [
                "Python/R", "Statistics", "Machine learning",
                "Pandas/NumPy", "SQL", "Data visualization",
                "Feature engineering", "Model evaluation",
                "Deep learning basics", "Communication skills"
            ],
        },
        "ml engineer": {
            "role": "ML Engineer",
            "summary": "Standard requirements for ML Engineer positions",
            "requirements": [
                "Python", "TensorFlow/PyTorch", "MLOps",
                "Model deployment", "Docker", "Cloud platforms",
                "Data pipelines", "SQL", "Experiment tracking", "CI/CD"
            ],
        },
        "devops engineer": {
            "role": "DevOps Engineer",
            "summary": "Standard requirements for DevOps Engineer positions",
            "requirements": [
                "Linux", "Docker", "Kubernetes", "CI/CD",
                "AWS/GCP/Azure", "Terraform", "Monitoring",
                "Shell scripting", "Git", "Security basics"
            ],
        },
        "cloud engineer": {
            "role": "Cloud Engineer",
            "summary": "Standard requirements for Cloud Engineer positions",
            "requirements": [
                "AWS/Azure/GCP", "Cloud architecture", "IAM & security",
                "Networking", "IaC (Terraform)", "Serverless",
                "Monitoring & logging", "Cost optimization",
                "Docker/Kubernetes", "CI/CD"
            ],
        },
        "qa engineer": {
            "role": "QA Engineer",
            "summary": "Standard requirements for QA Engineer positions",
            "requirements": [
                "Test planning", "Manual testing",
                "Automation (Selenium/Playwright/Cypress)",
                "API testing", "Bug tracking (Jira)", "SQL basics",
                "CI/CD integration", "Performance testing",
                "Agile methodology", "Regression testing"
            ],
        },
        "mobile developer": {
            "role": "Mobile Developer",
            "summary": "Standard requirements for Mobile Developer positions",
            "requirements": [
                "Android/iOS", "Flutter/React Native",
                "Mobile UI/UX", "REST API integration",
                "Local storage", "Push notifications",
                "App performance", "Testing",
                "Store deployment", "Git"
            ],
        },
        "product manager": {
            "role": "Product Manager",
            "summary": "Standard requirements for Product Manager positions",
            "requirements": [
                "Product strategy", "Roadmap planning",
                "User research", "Market analysis",
                "Agile/Scrum", "Stakeholder management",
                "Metrics & KPIs", "Prioritization",
                "Communication skills", "Data-driven decisions"
            ],
        },
    }

    for key in fallback_data:
        if key in role_lower:
            data = fallback_data[key]
            data["raw_sources"] = []
            return data

    # Default
    return {
        "role": role,
        "summary": f"Standard requirements for {role} positions",
        "requirements": [
            "Programming fundamentals", "Version control (Git)",
            "Problem solving", "REST APIs", "Database knowledge",
            "Testing", "Communication skills", "Team collaboration"
        ],
        "raw_sources": [],
    }
