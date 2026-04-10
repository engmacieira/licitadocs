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
                # Find the current vi.mock block
                pattern = r"vi\.mock\(['\"]react-router-dom['\"]\s*,\s*async\s*\(importOriginal\)\s*=>\s*\{[\s\S]*?\}\s*\);"

                # Robustly find any variables that were being used in the mock
                # These variables must be prefixed with 'vi' or moved inside the mock

                def replace_func(match):
                    full_block = match.group(0)

                    # Extract the useNavigate line
                    nav_line_match = re.search(r"useNavigate:\s*vi\.fn\(\)\.mockReturnValue\(([\w\d]+)\)", full_block)
                    if nav_line_match:
                        nav_var = nav_line_match.group(1)
                        # Replace the whole block with one that doesn't use outside variables
                        # Instead, we define a local variable if it's not a global mock
                        return f"""vi.mock('react-router-dom', async (importOriginal) => {{
    const actual = await importOriginal<any>();
    const mockNav = vi.fn();
    return {{
        ...actual,
        useLocation: vi.fn().mockReturnValue({{ pathname: '/', state: {{}}, search: '' }}),
        useNavigate: () => mockNav,
        Link: ({{ children, to }}: any) => <a href={{to}}>{{children}}</a>
    }};
}});"""
                    return full_block

                # Actually, let's just make the mock self-contained and users can mock the return value in beforeEach
                new_mock = """vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useLocation: vi.fn().mockReturnValue({ pathname: '/', state: {}, search: '' }),
        useNavigate: vi.fn().mockReturnValue(vi.fn()),
        Link: ({ children, to }: any) => <a href={to}>{children}</a>
    };
});"""

                new_content = re.sub(pattern, new_mock, content)

                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Fixed hosting in {filepath}")

if __name__ == "__main__":
    update_test_files()
