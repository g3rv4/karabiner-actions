import {
  map,
  rule,
  writeToProfile,
  mapSimultaneous,
  toKey,
  toNone,
  ModifierParam,
} from 'https://deno.land/x/karabinerts@1.30.0/deno.ts'
import { FromAndToKeyCode, FromKeyParam, FromKeyType, ModifierKeyCode, ToKeyParam } from 'https://deno.land/x/karabinerts@1.30.0/index.ts';

function generateCustomCombinations<T>(arr: T[]): T[][] {
  let result: T[][] = [];
  const n = arr.length;

  for (let k = 1; k <= n; k++) {
      let combinations: T[][] = [];
      if (k <= 2) {
          combinations = getPermutations(arr, k);
      } else {
          combinations = getCombinations(arr, k);
      }
      result = result.concat(combinations);
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

function getCombinations<T>(arr: T[], k: number): T[][] {
  const combinations: T[][] = [];

  function helper(start: number, combo: T[]) {
      if (combo.length === k) {
          combinations.push([...combo]);
          return;
      }
      for (let i = start; i < arr.length; i++) {
          combo.push(arr[i]);
          helper(i + 1, combo);
          combo.pop();
      }
  }

  helper(0, []);
  return combinations;
}

const groups: Map<FromAndToKeyCode, ModifierKeyCode>[] = [];
const left = new Map<FromAndToKeyCode, ModifierKeyCode>();
const right = new Map<FromAndToKeyCode, ModifierKeyCode>();
groups.push(left);
groups.push(right);
left.set("d", "left_command");
left.set("s", "left_control");
left.set("a", "left_shift");
left.set("f", "left_option");
right.set("k", "left_command");
right.set("l", "left_control");
right.set(";", "left_shift");
right.set("j", "left_option");


function buildCombinations() {
  const rules = [];
  for (const group of groups) {
    const letters = Array.from(group.keys());
    const combination = generateCustomCombinations(letters);
    for (const combo of combination) {
      const modifiers = combo.map(l => group.get(l)!);
      if (combo.length == 1) {
        const letter = combo[0];
        rules.push(map(letter)
          .toIfAlone(letter, {}, { halt: true })
          .toDelayedAction(toKey("vk_none"), toKey(letter))
          .toIfHeldDown(modifiers[0], {}, { halt: true })
        );
      }
      else if (combo.length == 2) {
        rules.push(mapSimultaneous(combo, { key_down_order: "strict" })
          .toIfAlone(combo[0])
          .toIfAlone(combo[1])
          .toIfHeldDown(modifiers[0], modifiers.slice(1)));
      } else {
        rules.push(mapSimultaneous(combo).toIfHeldDown(modifiers[0], modifiers.slice(1)));
      }
    }
  }
  return rules;
}

writeToProfile(
  "Compiled",
  [
    // Home row mods
    rule("Home row mods").manipulators(buildCombinations()),
    //
    // Meh
    rule("R_U = Meh ").manipulators([
      map("r")
        .toIfAlone("r", {}, { halt: true })
        .toDelayedAction(toKey("vk_none"), toKey("r"))
        .toIfHeldDown("l⇧", "l⌥⌃", { halt: true })
        .parameters({ "basic.to_if_held_down_threshold_milliseconds": 220 }),
      map("u")
        .toIfAlone("u", {}, { halt: true })
        .toDelayedAction(toKey("vk_none"), toKey("u"))
        .toIfHeldDown("r⇧", "r⌥⌃", { halt: true })
        .parameters({ "basic.to_if_held_down_threshold_milliseconds": 220 }),
    ]),
    //
    // Norwegian Markdown helper
    rule("Nordic Markdown Helper").manipulators([
      map("]")
        .toIfAlone("/", "⇧", { halt: true })
        .toDelayedAction(toNone(), toKey("/", "⇧"))
        .toIfHeldDown("\\", "⇧", { halt: true })
        .toIfHeldDown("\\", "⇧", { halt: true }),
      map("]", "Meh").to("]"),
      map("]", "⌥⇧").to("]"),
    ]),
    //
    // More arrow clicks
    rule("Meh + Arrow = 5 Arrows | Hyper + Arrow = 10 Arrows").manipulators([
      map("↑", "Meh").to("↑").to("↑").to("↑").to("↑").to("↑"),
      map("↓", "Meh").to("↓").to("↓").to("↓").to("↓").to("↓"),
      map("←", "Meh").to("←").to("←").to("←").to("←").to("←"),
      map("→", "Meh").to("→").to("→").to("→").to("→").to("→"),
      map("↑", "Hyper")
        .to("↑")
        .to("↑")
        .to("↑")
        .to("↑")
        .to("↑")
        .to("↑")
        .to("↑")
        .to("↑")
        .to("↑")
        .to("↑"),
      map("↓", "Hyper")
        .to("↓")
        .to("↓")
        .to("↓")
        .to("↓")
        .to("↓")
        .to("↓")
        .to("↓")
        .to("↓")
        .to("↓")
        .to("↓"),
      map("←", "Hyper")
        .to("←")
        .to("←")
        .to("←")
        .to("←")
        .to("←")
        .to("←")
        .to("←")
        .to("←")
        .to("←")
        .to("←"),
      map("→", "Hyper")
        .to("→")
        .to("→")
        .to("→")
        .to("→")
        .to("→")
        .to("→")
        .to("→")
        .to("→")
        .to("→")
        .to("→"),
    ]),
  ],
  {
    "basic.to_if_held_down_threshold_milliseconds": 120,
  },
);
