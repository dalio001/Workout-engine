# P1-05 first-run onboarding — plan (personal use)

## 1. Today (names)
`init()` reads `hevy_clone_state`; `hadSavedState=(saved!=null)`.
If `schemaVersion!==2`: `backupV1Once` + `migrateParsedStateToV2` + `saveState`.
Then `applySeedDefaults(state,hadSavedState)` (seeds `DEFAULT_ROUTINES`+exercises
only when `!hadSavedState`), `normalizeExercises`, renders Workout tab
(`tab-workout.active`). No welcome; new user sees 3 sample routines directly.
`toggleUnit()` flips `state.unit` (display only via `toDisplayWeight`/
`fromInputWeight`); Profile is stats+settings via `renderProfileStats()`.
Restore: `validateBackupData`/`confirmRestore` (P0-03) with no profile field.

## 2. Screens (full-screen `#onboardingOverlay`, dots+Back+Skip every step)
0 Welcome (2-3 slides, original PLZ FitZone words, `assets/brand/plz-fitzone-mascot.jpg`
with `icons/mascot-96.png` fallback; add `assets/brand/mascot-small.jpg` <150KB if needed).
1 Weight unit KG/LBS segmented control → sets `state.unit` (no conversion; P6-01).
2 Height, cm / ft-in toggle, optional (P5-04 private). 3 Birthday or age, optional.
4 Top goal single-choice (build muscle / get stronger / lose fat / stay healthy).
5 Experience single-choice beginner/intermediate/advanced; Continue disabled until chosen.
6 Routine choice: Start from template (keep seeds) vs Build my own (empty routines).
7 "You're ready!" → `switchTab('workout')` + dismissible "How to get started" card (3 tips).
Shell: sticky footer (Back/Skip/Continue), min 44px targets, 412px, no page h-scroll;
per-field `oninput` handlers updating a draft object only (no full re-render while
typing, P2-05 lesson); every `onclick` handler defined (P2-06 lesson).

## 3. Data + first-run rule
`state.profile={onboardingDone:true,v:1,goal,experience,routineChoice,birthDate|age,
heightCm,heightUnit,heightFt,heightIn}`; unit stays `state.unit`; card flag
`state.gettingStartedDismissed`. `saveState()` persists; export includes profile.
Show IFF `localStorage hevy_clone_state==null` (true first run) AND
`!state.profile?.onboardingDone`. Existing saved state → never auto-show; Profile
"My profile" section shows answers + "Set up my profile" (`openOnboarding()`) re-opens.
Migration: preserve unknown `profile` as-is, default missing. Restore with/without
profile both validate; missing profile never forces onboarding.

## 4. Tests (new `tests/onboarding.test.mjs`, via `tests/harness.mjs`)
`onboarding_shows_on_true_first_run`; `onboarding_never_forces_existing_users`;
`onboarding_skip_completes_to_workout`; `onboarding_experience_gates_continue`;
`onboarding_template_keeps_routines_own_starts_empty`; `onboarding_unit_sets_preference`;
`onboarding_profile_private_editable`; `onboarding_restore_with_without_profile`.
May be affected: `migration.test.mjs`, `restore.test.mjs`, `units.test.mjs`,
`session.test.mjs`, `static.test.mjs` (overlay markup/ids, export list).

## 5. Will NOT do
Paywall, email opt-in, contacts/friend sync, "how did you hear", Health Connect,
accounts/backend/sync, Hevy text/icons/images, `index.html`/test changes in this run.

## 6. Questions
None — defaults chosen above (Skip on every step; age-or-birthday optional;
template keeps seeds). Reopen only if owner wants a required (non-skippable) step.
