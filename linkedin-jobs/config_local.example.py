# Personal filters — copy this file to config.local.py and fill in your own values.
# config.local.py is gitignored and will never be committed.

# ── Company blacklist ──────────────────────────────────────────────────────────
# Companies to skip entirely (case-insensitive substring match).
BLACKLIST = {
    # "example company",
}

# ── Title keyword blacklist ────────────────────────────────────────────────────
# Jobs whose title contains any of these keywords are skipped.
TITLE_BLACKLIST = {
    # "qa",
    # "automation",
}

# ── Skill blacklist ────────────────────────────────────────────────────────────
# Each entry: (skill_name, max_years_or_None)
#   None → skip if the skill is mentioned at all
#   N    → skip only if more than N years of experience are required
SKILL_BLACKLIST = [
    # ("SomeSkill", None),
    # ("AnotherSkill", 3),
]
