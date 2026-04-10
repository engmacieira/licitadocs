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
                # Standard pattern to match the whole vi.mock call
                pattern = r"vi\.mock\(['\"]react-router-dom['\"]\s*,\s*(?:async\s*)?\(.*?\)\s*=>\s*(?:\{[\s\S]*?\}|\([\s\S]*?\))\s*\);"

                # Try to extract existing navigate variable name
                nav_var = "vi.fn()"
                # Look for something like useNavigate: () => mockNavigate or useNavigate: () => navigate
                nav_match = re.search(r"useNavigate:\s*(?:\(\)\s*=>\s*)?([\w\d]+)", content)
                if nav_match and nav_match.group(1) not in ['vi', 'fn', 'any', 'actual', 'importOriginal']:
                    nav_var = nav_match.group(1)

                # Robust partial mock with useNavigate, useLocation, and Link
                # We make useNavigate a mock itself to support .mockReturnValue if needed
                new_mock = f"""vi.mock('react-router-dom', async (importOriginal) => {{
    const actual = await importOriginal<any>();
    return {{
        ...actual,
        useLocation: vi.fn().mockReturnValue({{ pathname: '/', state: {{}}, search: '' }}),
        useNavigate: vi.fn().mockReturnValue({nav_var}),
        Link: ({{ children, to }}: any) => <a href={{to}}>{{children}}</a>
    }};
}});"""

                # Special case: if useNavigate was being used via .mockReturnValue in the test,
                # the test usually does (useNavigate as any).mockReturnValue(...)
                # This works if the hook itself is a mock.

                new_content = re.sub(pattern, new_mock, content)

                # Cleanup potential syntax errors
                new_content = new_content.replace(",,", ",")
                new_content = new_content.replace("({({", "({")
                new_content = new_content.replace("})})", "})")

                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Standardized {filepath}")

if __name__ == "__main__":
    update_test_files()
