/**
 * Creates a Windows Junction from .next → %LOCALAPPDATA%\thinkinproducts-next
 *
 * A junction looks like a real directory to Node.js (so module resolution works)
 * but is a reparse point, which OneDrive skips — fixing the EBUSY lock errors.
 *
 * Non-Windows: no-op.
 */

import { execSync }                    from "child_process";
import { existsSync, realpathSync,
         rmSync, mkdirSync, lstatSync } from "fs";
import { resolve }                     from "path";

if (process.platform !== "win32") process.exit(0);

const localAppData = process.env.LOCALAPPDATA ?? "C:/Users/Default/AppData/Local";
const target = resolve(localAppData, "thinkinproducts-next");
const link   = resolve(".next");

try {
  if (existsSync(link)) {
    // Check whether it's already the correct junction
    let isJunction = false;
    try {
      const real = realpathSync(link);
      isJunction = real.toLowerCase() === target.toLowerCase();
    } catch { /* unresolvable — treat as real dir */ }

    if (isJunction) {
      console.log(`  ✓ .next junction OK → ${target}`);
      process.exit(0);
    }

    // Real directory (or wrong junction): remove it
    rmSync(link, { recursive: true, force: true });
  }

  // Ensure the target directory exists outside OneDrive
  mkdirSync(target, { recursive: true });

  // mklink /J requires cmd.exe
  execSync(`mklink /J "${link}" "${target}"`, { shell: "cmd.exe", stdio: "pipe" });
  console.log(`  ✓ .next → ${target} (junction created)`);

} catch (err) {
  // Never block the dev server — just warn
  console.warn(`  ⚠ Could not create .next junction: ${err.message}`);
  console.warn("    OneDrive may still cause EBUSY warnings (non-fatal).");
}
