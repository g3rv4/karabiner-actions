import {
  FromAndToKeyCode,
  map,
  mapSimultaneous,
  ModifierKeyCode,
  rule,
  writeToProfile,
} from "https://deno.land/x/karabinerts@1.30.0/deno.ts";

function generateCustomCombinations<T>(arr: T[]): T[][] {
  let result: T[][] = [];
  const n = Math.min(arr.length, 3);

  for (let k = 1; k <= n; k++) {
    result = result.concat(getPermutations(arr, k));
  }

  return result.sort((a, b) => b.length - a.length);
}

function getPermutations<T>(arr: T[], k: number): T[][] {
  if (k === 1) {
    return arr.map((item) => [item]);
  }

  const permutations: T[][] = [];

  for (let i = 0; i < arr.length; i++) {
    const currentElement = arr[i];
    const remainingElements = arr.slice(0, i).concat(arr.slice(i + 1));
    const subPermutations = getPermutations(remainingElements, k - 1);

    for (const subPermutation of subPermutations) {
      permutations.push([currentElement, ...subPermutation]);
    }
  }

  return permutations;
}

const letters = new Map<FromAndToKeyCode, ModifierKeyCode>();
letters.set("d", "left_command");
letters.set("s", "left_control");
letters.set("a", "left_shift");
letters.set("f", "left_option");
letters.set("k", "right_command");
letters.set("l", "right_control");
letters.set("semicolon", "right_shift");
letters.set("j", "right_option");

function buildCombinations() {
  const rules = [];
  const keys = Array.from(letters.keys());
  const combination = generateCustomCombinations(keys);
  for (const combo of combination) {
    const modifiers = combo.map((l) => letters.get(l)!);
    if (combo.length == 1) {
      const letter = combo[0];
      rules.push(
        map(letter, null, "any")
          .toIfAlone(letter)
          .toIfHeldDown(modifiers[0], {}, { halt: true }),
      );
    } else {
      const rule = mapSimultaneous(combo, { key_down_order: "strict" });
      rules.push(rule);
      for (let i = 0; i < combo.length; i++) {
        if (i == combo.length - 1) {
          rule.toIfAlone(combo[i], {}, { halt: true });
        } else {
          rule.toIfAlone(combo[i]);
        }
      }
    }
  }

  return rules;
}

writeToProfile(
  "Compiled",
  [
    rule("Home row mods").manipulators(buildCombinations()),
    rule("Shift + backspace = delete").manipulators([
      map("delete_or_backspace", "left_shift").to("delete_forward"),
    ]),
    rule("Home, end").manipulators([
      map("home", null, "any")
        .condition({
          "type": "frontmost_application_unless",
          "bundle_identifiers": [
            "^com\\.apple\\.Terminal$",
            "^com\\.googlecode\\.iterm2$",
          ],
        })
        .to("left_arrow", "left_command"),
      map("end", null, "any")
        .condition({
          "type": "frontmost_application_unless",
          "bundle_identifiers": [
            "^com\\.apple\\.Terminal$",
            "^com\\.googlecode\\.iterm2$",
          ],
        })
        .to("right_arrow", "left_command"),
    ]),
    rule("Home, end, terminal").manipulators([
      map("home", null, "any")
        .condition({
          "type": "frontmost_application_if",
          "bundle_identifiers": [
            "^com\\.apple\\.Terminal$",
            "^com\\.googlecode\\.iterm2$",
          ],
        })
        .to("a", "left_command"),
      map("end", null, "any")
        .condition({
          "type": "frontmost_application_if",
          "bundle_identifiers": [
            "^com\\.apple\\.Terminal$",
            "^com\\.googlecode\\.iterm2$",
          ],
        })
        .to("e", "left_command"),
    ]),
  ],
  {
    "basic.to_if_held_down_threshold_milliseconds": 250,
    "basic.simultaneous_threshold_milliseconds": 50,
  },
);
