# Zeeroz Academy Firebase setup

## What this change adds
- Student email/password registration and sign-in at `student-login.html`.
- A student desk that displays only published courses and announcements.
- An administrator content console at `admin.html`.
- Firestore rules that prevent students from granting themselves admin access.
- Storage remains closed until a defined upload feature is added.

## Required Firebase Console steps
1. Open Firebase Console → Authentication → Sign-in method → enable **Email/Password**.
2. Open Firestore Database → Rules. Review and publish the contents of `firestore.rules`. These rules replace permissive test-mode rules; do not append them below the old rules.
3. Storage is not used by these pages. Keep Storage rules restrictive; the provided `storage.rules` denies all access.
4. In Authentication, create your own administrator user using the student registration page once Email/Password is enabled.
5. Grant that account the Firebase custom claim `admin: true` using a trusted Admin SDK environment (for example a secured Cloud Function or local trusted server). Never put a service-account key in this repository or browser code. A user profile field such as `role: "admin"` is NOT sufficient.
6. After assigning the custom claim, sign out and sign in again. The admin console is at `admin.html`.

## Firestore data model
- `profiles/{uid}`: private account profile; owner can read/update limited profile fields; admins can manage.
- `courses/{courseId}`: public read only when `published == true`; admin write.
- `announcements/{announcementId}`: public read only when `published == true`; admin write.
- `students/{uid}/progress/{progressId}`: private student-owned progress documents.

## Important
- The web Firebase config is not a server secret. Security comes from Authentication, Firestore/Storage rules, and trusted server-side admin claims.
- Existing website content and Study Desk tools remain unchanged.
- Test registration, verification email, login, published content and admin access before announcing the feature as live.
- GitHub Pages serves static files only; it cannot securely assign Firebase custom claims. Admin claim assignment needs a trusted Admin SDK environment.
