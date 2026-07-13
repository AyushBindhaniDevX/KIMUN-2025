---
name: github_push_all
description: Handles pushing all current workspace updates to the remote GitHub repository. Triggered by requests like "update to github", "push all updates", or "commit and push everything".
---

# GitHub Push All Updates

When the user asks to push all updates or update to GitHub, follow these steps:

1. **Check Status**: Run `git status` to see what has been changed.
2. **Stage All Changes**: Run `git add .` to stage all modifications, deletions, and additions in the workspace.
3. **Commit**: Run `git commit -m "<brief, descriptive message based on recent work>"` to commit the changes.
4. **Push**: Run `git push` to push the commits to the remote repository. Wait for the background task to complete successfully before confirming with the user.

Do not ask for permission for each individual git command; execute the chain and notify the user once the push is successful.
