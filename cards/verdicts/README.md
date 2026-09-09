# cards/verdicts/

Rounds of keep-or-drop judgements on the design deck. Each `round-N.json` is one
pass over a deck, and the next deck is built from what survived the last one.

## How a round actually travels

The swipe deck is a published artifact:
**<https://claude.ai/code/artifact/0e8abbd2-d880-4fc9-b8fb-769664e56b0e>**

It writes every swipe to its own store as it happens. It cannot write here itself —
a published artifact is sandboxed away from the network, and the alternative (a
GitHub token living inside a page) would be worse than the inconvenience it saves.
So a round reaches this folder one of two ways:

1. **Say "I did a pass."** Claude reads the store off the artifact, writes the round
   file here, and starts the next iteration. Nothing to download or paste.
2. **Save verdicts.json** from the end of the deck and drop it in here yourself.
   Same file, same shape, if you would rather not wait on a session.

## What Claude does with a round

1. Read `swipes` off the artifact (`read_db`, collection `swipes`).
2. Write it here as the next `round-N.json`, whole — the per-card verdicts, not
   just the summary, because the summary can be recomputed and the raw pass cannot.
3. Score each axis: composition, theme, family. A composition kept in one theme and
   dropped in eight is a theme problem, not a composition problem — read the cross
   before cutting anything.
4. Retire what lost, keep what won, and spend the freed room on new variations of
   the winners rather than on filling the deck back to its old size.
5. Regenerate the deck, republish the artifact to the SAME url, and say what
   changed and why.

## Rounds so far

| Round | Deck | Kept | What it settled |
|---|---|---|---|
| 1 | 135 (15 compositions x 9 themes) | 65 | Flooding the card is out; five compositions rejected in every theme |
| 2 | 120 (15 x 8), 94 judged | 68 | Theme stopped discriminating; the badge belongs on the left; mark-pairing is out |
| 3 | 90 (9 compositions x 10 backgrounds) | - | Judging the background graphic instead of the theme |

A round varies ONE axis and holds the rest still. Round 3 varies the background and
fixes the theme, because round 2 put all eight themes inside a single card of each
other: a deck built on an axis that no longer separates anything shows the same design
ten times, which is what "a lot are pretty much identical" means in practice. When an
axis stops discriminating, stop varying it and find one that does.

Each round writes to its own store collection — `swipes-r1`, `swipes-r2` — rather
than a shared one. Survivors keep their ids between rounds, so a shared collection
would have marked half of the next deck as already judged before it was opened.

## File shape

```json
{
  "kind": "tapstand.swipes",
  "version": 1,
  "judgedAt": "2026-09-08",
  "trim": "102 x 76 mm",
  "deck": 135,
  "compositions": [{ "name": "Endorsement", "kept": 7, "n": 9, "pct": 0.78 }],
  "themes":       [{ "name": "Google", "kept": 12, "n": 15, "pct": 0.8 }],
  "cards": [
    { "id": "endorsement-google", "verdict": 1,
      "composition": "Endorsement", "theme": "Google", "family": "badge" }
  ]
}
```

`verdict` is `1` for keep and `-1` for drop. Cards are keyed by composition and
theme NAMES, never by index — a deck is regenerated every round and positions move,
so an index-keyed round would silently describe the wrong designs a week later.

## One thing to hold onto

A round is judged at ONE trim, with ONE brand colour and ONE business name, on
purpose: if colour varied too, a drop would be ambiguous — composition, theme, or
colour? Every round file records the trim it was judged at. A verdict on a 4×3
stand is not automatically a verdict on a credit card, and colour deserves its own
round rather than being smuggled into this one.
