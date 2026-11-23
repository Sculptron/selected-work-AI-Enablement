# Troubleshooting article editor

The public editor opens on a deliberately authored training suggestion. The two other cases replay model responses. In all three, decisions are held in browser memory and only explicit acceptance replaces an article paragraph. The training exercise allows an incorrect decision and explains it afterwards. Conflicting approved sources hold the change for clarification.

## Run the real model path locally

With Node 20+ and ANTHROPIC_API_KEY set in the local environment, run from the repository root:

    node editor/capture.mjs
    node editor/test.mjs

The first command sends the two fictional fixtures to Anthropic and replaces runs.json only after both responses validate. EDITOR_MODEL optionally overrides the model. Review the resulting wording and rerun tests before publication. The training suggestion lives in app.mjs and is excluded from inference. To open the interactive editor locally:

    python3 -m http.server 8000 --bind 127.0.0.1

Visit http://127.0.0.1:8000/troubleshooting-article-editor.html . Paragraphs and approved notes use stable IDs within each case. Citation checks establish that the quoted text exists. Whether it supports the proposed wording is a reviewer decision.
