# Reviewer brief — fresh-context agent review of slidewalk (PENDING)

**Status: not yet run.** This brief is prepared for a reviewer agent that did not build the repository. Run it in a fresh context before the next minor release.

## Disclosure to include in the review output
This reviewer may run on the same underlying model family as the agent that built the repository. It is therefore a usability/correctness review by a similar AI system, not an independent evaluation and not a substitute for human review.

## Task
Using ONLY the README and the repository itself (no context from the builder):

1. Clone/checkout the repo, run `npm install`, `npm run build`, `npm run gates`, `sh tests/run-negative-tests.sh`, `npm run pptx:verify`.
2. Open `docs/deck.html` in a browser. Navigate it using only the keyboard. Toggle speaker notes. Try to break navigation.
3. Read `examples/wcag-authors/outline.md` and write a new, small 4-slide outline in the same format on a topic of your choice; build and gate it.
4. Report: any step where documentation was wrong or insufficient; any gate failure that the fix list did not help you resolve; anything in the generated deck that seems wrong to a reader; any claim in the README not supported by the repo.

## Output format
Write findings to `evaluation/agent-review.md` as a dated entry, labeled "Fresh-context agent review", with sections: what ran, what broke, documentation gaps, deck content observations, unsupported claims. Raw command output should be pasted, not summarized.
