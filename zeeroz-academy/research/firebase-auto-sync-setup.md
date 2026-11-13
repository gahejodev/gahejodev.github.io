# Automatic Firebase course sync

This workflow imports or refreshes course packages in Firestore whenever files under
\`zeeroz-academy/content/courses/\` change on the \`main\` branch.

## One-time secure setup

The workflow needs a server-side Firebase service-account credential. Firestore Security
Rules do not provide this credential, and GitHub cannot safely reuse a browser login.

1. In Firebase Console, open **Project settings → Service accounts**:
   https://console.firebase.google.com/project/zeeroz-academy/settings/serviceaccounts/adminsdk
2. Generate a new private key for the Firebase Admin SDK and download the JSON file.
3. In the private GitHub repository, open **Settings → Secrets and variables → Actions → New repository secret**:
   https://github.com/gahejodev/zeeroz-academy-source/settings/secrets/actions
4. Set the secret name to exactly \`FIREBASE_SERVICE_ACCOUNT_JSON\`.
5. Paste the complete contents of the downloaded JSON file as the secret value and save.
6. Never commit, upload, or paste the JSON key into chat. Keep repository visibility private.

After this one-time secret is saved, course registry/package changes pushed to \`main\`
will automatically run the workflow and sync Firestore. The workflow can also be run
manually from the repository's Actions tab.

This uses GitHub Actions and the Firebase Admin SDK; it does not require upgrading
Firebase from the Spark plan. Normal Firebase/Firestore usage quotas still apply.
