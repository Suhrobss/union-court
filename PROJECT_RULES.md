# PROJECT RULES

## PUBLIC REPOSITORY — ZERO SOURCE IDENTIFIERS

This repository is PUBLIC. Treat every committed byte, filename, comment, test fixture and Git history entry as publishable on the open internet.

The source court materials are PRIVATE working sources. They may be used to derive mechanics and legal lessons, but must never be copied into this repository.

### Allowed public references
Only when genuinely useful:
- the name of the Trade Union of Maritime Transport Workers of Ukraine / ПРМТУ;
- names of courts and court instances;
- names of judges when needed to explain a publicly available judicial decision.

### Forbidden in source code, UI, assets, filenames and comments
- real names, initials or identifiers of employees, employer representatives, witnesses, lawyers, union officers or other persons from supplied case materials;
- real employer / branch / counterparty names or identifying details from the supplied case;
- real job titles or combinations of job title + dates + employer that can re-identify a source-case participant;
- real case numbers, proceeding numbers, order numbers, personnel numbers, EDRPOU / tax identifiers, bank details or other source-case identifiers;
- phone numbers, emails, messenger identifiers, home/work/correspondence addresses;
- dates of birth, passport details, tax IDs, signatures, seals, QR/bar codes;
- original PDFs, screenshots, photographs, scans, copied page images or text blocks that preserve source formatting and identifying details;
- metadata or filenames that reveal the private source.

### Reconstruction rule
Any public document shown in the game must be a clearly labelled **educational reconstruction**. It must use fictional names, fictional document numbers, fictional dates, fictional employer details and a non-identifying generic job title. Do not preserve a real identifying combination even if each individual field looks harmless.

Use generic roles by default:
- `Працівник`
- `Роботодавець`
- `ПРМТУ`
- `Суд`
- `Представник`

### Legal-accuracy rule
Always distinguish:
1. a party's allegation;
2. evidence submitted by a party;
3. a court finding;
4. a final legal conclusion.

Do not label a disputed proposition as legally correct until supported by the relevant judgment or current legislation.

### Product rule
- Mobile UI = the player's personal case journey.
- Large screen = the collective state of the active session.
- Correctness has priority over speed in scoring.
- Historical sessions must be retained when a new session is started.
- Large-screen player visibility must rely on persisted authoritative server state, not ephemeral Presence alone.
