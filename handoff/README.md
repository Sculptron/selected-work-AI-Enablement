# Deployment-to-Support Handoff Checker

The public checker replays three fictional source sets and their recorded Anthropic responses from `runs.json`. Selecting a case or editing an owner runs entirely in the browser. Reloading discards reviewer edits. The replay contains no API credential.

## Run with pasted notes

Use Node.js 20+ and set `ANTHROPIC_API_KEY` in your server environment. From the repository root run:

    node handoff/runner.mjs

Open http://127.0.0.1:8787 and expand **Paste three sources for a live run**. Submit notes you are authorized to send to Anthropic. The process binds to loopback and accepts extraction requests from its own origin. Override the model with `HANDOFF_MODEL` if necessary. Each submission makes one Messages API request. Keep secrets in the environment.

## Reproduce the replay

    node handoff/runner.mjs capture
    node handoff/test.mjs

Capture reads only fixtures.json and replaces runs.json after all three requests succeed. Review changed outputs and rerun the checks before publication. Responses may vary. The checked-in recordings include model and response identifiers.

## Review contract

Each line ID combines its source and its original 1-based line number, including blank lines. The checker requires a recognized status, summary, and an exact excerpt from an existing line. A disagreement needs evidence from different sources. An open or unknown item needs an owner and next action. The reviewer checks whether the quotes actually support each conclusion. Text matching alone cannot establish that. A reviewer-entered owner is labelled in the handoff. Approval preserves all finding statuses and citations.

A disagreement needs its own follow-up owner and action, or an explicit reference to one open or unknown finding with a shared source line. For the original C-24 recording, the review layer supplies that reference and separates the next action from historical ownership. The original model response is preserved in runs.json.
