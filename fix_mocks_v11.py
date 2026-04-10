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
                # Find the existing mockNavigate or similar variable
                nav_var = "vi.fn()"
                # Look for something like const mockNavigate = vi.fn() or const navigate = vi.fn()
                # BEFORE the vi.mock call
                nav_match = re.search(r"const\s+([\w\d]+)\s*=\s*vi\.fn\(\)", content)
                if nav_match:
                    nav_var = nav_match.group(1)

                # Use vi.mockED to properly handle the hoisting and access the variables
                new_mock = f"""
const mockNavigate = vi.fn();
const mockLocation = {{ pathname: '/', state: {{}}, search: '' }};

vi.mock('react-router-dom', async (importOriginal) => {{
    const actual = await importOriginal<any>();
    return {{
        ...actual,
        useLocation: () => mockLocation,
        useNavigate: () => mockNavigate,
        Link: ({{ children, to }}: any) => <a href={{to}}>{{children}}</a>
    }};
}});"""

                # This approach might still fail if mockNavigate is redefined or name-clashed.
                # Let's try to be even simpler: move the mock variable INTO the module scope but as a vitest mock.

                new_mock = """vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<any>();
    const mockNav = vi.fn();
    return {
        ...actual,
        useLocation: vi.fn().mockReturnValue({ pathname: '/', state: {}, search: '' }),
        useNavigate: () => mockNav,
        Link: ({ children, to }: any) => <a href={to}>{children}</a>
    };
});"""
                # BUT wait, the test NEEDS to access the mock to check calls.
                # The only way is to use vi.mocked(useNavigate)() in the test.

                # Let's try this pattern which is very common and reliable:
                new_mock = """const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useLocation: vi.fn().mockReturnValue({ pathname: '/', state: {}, search: '' }),
        useNavigate: () => mockNavigate,
        Link: ({ children, to }: any) => <a href={to}>{children}</a>
    };
});"""
                # This works because Vitest allows variables prefixed with 'mock' inside vi.mock

                # Find the whole block from vi.mock to the closing );
                pattern = r"vi\.mock\(['\"]react-router-dom['\"]\s*,\s*async\s*\(importOriginal\)\s*=>\s*\{[\s\S]*?\}\s*\);"

                # Also find and remove the old definition of mockNavigate if it exists to avoid duplication
                # (but only if it's the one we're about to add)

                if "const mockNavigate = vi.fn();" in content:
                    content = content.replace("const mockNavigate = vi.fn();", "")
                if "const navigate = vi.fn();" in content:
                    # If they used 'navigate', we should probably stick to it or alias it.
                    # For simplicity, we'll try to find what the test uses.
                    pass

                # Final attempt at a universal mock that actually works and allows assertions
                new_mock_self_contained = """vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal<any>();
    return {
        ...actual,
        useLocation: vi.fn().mockReturnValue({ pathname: '/', state: {}, search: '' }),
        useNavigate: vi.fn(),
        Link: ({ children, to }: any) => <a href={to}>{children}</a>
    };
});"""

                new_content = re.sub(pattern, new_mock_self_contained, content)

                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Self-contained mock in {filepath}")

if __name__ == "__main__":
    update_test_files()
