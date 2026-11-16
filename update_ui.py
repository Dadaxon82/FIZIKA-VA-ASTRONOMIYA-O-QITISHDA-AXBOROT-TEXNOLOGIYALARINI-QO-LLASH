import os
import re
import subprocess

# Target files
files_to_update = []
for i in range(1, 16):
    files_to_update.append(f"lecture{i}.html")
    files_to_update.append(f"lab{i}.html")
files_to_update.append("mustaqil.html")

def update_file_content(file_path):
    if not os.path.exists(file_path):
        print(f"Skipping {file_path} (not found)")
        return

    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Standardize Code Blocks
    # Look for <pre> or <code> or custom blocks with code-like headers
    content = re.sub(r'<div class="code-block"?.*?>\s*<div class="code-header".*?>\s*(.*?)</div>\s*<div class="code-content".*?>\s*(.*?)\s*</div>\s*</div>',
                      r'<div class="code-block">\n  <div class="code-header">\n    <span>\1</span>\n    <button class="btn btn-secondary btn-sm">Nusxalash</button>\n  </div>\n  <div class="code-content">\n    \2\n  </div>\n</div>', content, flags=re.DOTALL)

    # Replace manual <pre> or <code> with .code-block
    content = re.sub(r'<pre>(.*?)</pre>', r'<div class="code-block">\n  <div class="code-header"><span>Kod</span></div>\n  <div class="code-content">\n    \1\n  </div>\n</div>', content, flags=re.DOTALL)

    # 2. Replace hardcoded Grid styles with grid-2, grid-3, grid-4
    content = re.sub(r'style="display: grid; grid-template-columns: repeat\(3, 1fr\); gap: 24px;"', 'class="grid-3"', content)
    content = re.sub(r'style="display: grid; grid-template-columns: repeat\(2, 1fr\); gap: 24px;"', 'class="grid-2"', content)
    content = re.sub(r'style="display: grid; grid-template-columns: repeat\(4, 1fr\); gap: 20px;"', 'class="grid-4"', content)

    # 3. Replace hardcoded Glass Panel styles
    content = re.sub(r'style="background: var(--bg-card); backdrop-filter: blur\(16px\); -webkit-backdrop-filter: blur\(16px\); border: 1px solid var(--border-color); border-radius: var(--radius-lg); padding: 28px; box-shadow: var(--shadow-md);"', 'class="glass-panel"', content)
    content = re.sub(r'style="background: rgba\(15, 23, 42, 0.6\); padding: 20px; border-radius: var(--radius-md); border: 1px solid rgba\(255,255,255,0.06\);"', 'class="glass-panel" style="padding: 20px;"', content)

    # 4. Standardize Badges
    # Replace manual background colors with badge classes
    content = re.sub(r'style="background: rgba\(56, 189, 248, 0.12\); color: var(--accent-cyan); border-color: rgba\(56, 189, 248, 0.3\);"', 'class="badge badge-cyan"', content)
    content = re.sub(r'style="background: rgba\(52, 211, 153, 0.12\); color: var(--accent-emerald); border-color: rgba\(52, 211, 153, 0.3\);"', 'class="badge badge-emerald"', content)
    content = re.sub(r'style="background: rgba\(251, 191, 36, 0.12\); color: var(--accent-amber); border-color: rgba\(251, 191, 36, 0.3\);"', 'class="badge badge-amber"', content)
    content = re.sub(r'style="background: rgba\(244, 63, 94, 0.12\); color: var(--accent-rose); border-color: rgba\(244, 63, 94, 0.3\);"', 'class="badge badge-rose"', content)
    content = re.sub(r'style="background: rgba\(192, 132, 252, 0.12\); color: var(--accent-purple); border-color: rgba\(192, 132, 252, 0.3\);"', 'class="badge badge-purple"', content)

    # 5. Clean up Section Headers
    content = re.sub(r'<div class="section-header" style="text-align: left; margin-bottom: 40px;">', '<div class="section-header">', content)
    content = re.sub(r'style="margin-bottom: 16px;"', '', content) # Clean up some specific margins

    # 6. Standardize buttons and inputs
    content = re.sub(r'style="background: none; border: 1px solid var(--border-color); color: var(--text-main); font-size: 1.4rem; cursor: pointer;"', 'class="drawer-close"', content)
    content = re.sub(r'style="background: none; border: 1px solid var(--border-color); color: var(--text-main); font-size: 1.3rem; cursor: pointer;"', 'class="drawer-close"', content)

    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Successfully updated {file_path}")

def main():
    for file in files_to_update:
        update_file_content(file)

    print("Running git commands...")
    subprocess.run(["git", "add", "."], check=True)
    subprocess.run(["git", "commit", "-m", "Refactor UI: Standardize badges, grids, glass panels, and code blocks across all modules"], check=True)
    subprocess.run(["git", "push", "origin", "main"], check=True)

if __name__ == "__main__":
    main()
