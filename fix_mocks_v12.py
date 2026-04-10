import os
import re

def update_test_files():
    root_dir = 'frontend/src'

    for root, dirs, files in os.walk(root_dir):
        for file in files:
            if not (file.endswith('.test.tsx') or file.endswith('.spec.tsx') or file.endswith('.test.ts') or file.endswith('.spec.ts')):
                continue

            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()

            if "vi.mock('react-router-dom'" in content or 'vi.mock("react-router-dom"' in content:
                # 1. Define the mock navigate outside with 'mock' prefix
                # 2. Use it in the factory

                # Check what the test uses for navigation variable
                nav_var_name = "mockNavigate"
                if "const navigate =" in content: nav_var_name = "navigate"
                elif "const mockNav =" in content: nav_var_name = "mockNav"

                # Remove existing definition of this variable if it's vi.fn()
                content = re.sub(f"const\s+{nav_var_name}\s*=\s*vi\.fn\(\);?", "", content)

                new_mock_block = f"""
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {{
    const actual = await importOriginal<any>();
    return {{
        ...actual,
        useLocation: vi.fn().mockReturnValue({{ pathname: '/', state: {{}}, search: '' }}),
        useNavigate: () => mockNavigate,
        Link: ({{ children, to }}: any) => <a href={{to}}>{{children}}</a>
    }};
}});"""

                # Find the current vi.mock block and replace it
                pattern = r"vi\.mock\(['\"]react-router-dom['\"]\s*,\s*async\s*\(importOriginal\)\s*=>\s*\{[\s\S]*?\}\s*\);"

                # If the test used a different name, we should probably alias it
                if nav_var_name != "mockNavigate":
                    new_mock_block += f"\nconst {nav_var_name} = mockNavigate;"

                new_content = re.sub(pattern, new_mock_block, content)

                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Hoisting fixed for {filepath}")

if __name__ == "__main__":
    update_test_files()
