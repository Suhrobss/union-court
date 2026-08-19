# PROJECT RULES

## Security / public repository rule

This repository is PUBLIC. Treat every committed byte as publishable on the open internet.

Never commit original court case files, raw evidence, source PDFs, unredacted screenshots from the case file, or identifying data from the source materials unless the user has explicitly approved that exact category for public use.

### Explicitly allowed public references
The user has expressly allowed the project to use, where genuinely needed:
- the name of the Trade Union of Maritime Transport Workers of Ukraine / ПРМТУ;
- names of courts and court instances;
- names of judges, when relevant to explaining a publicly available court decision.

These exceptions do NOT authorize publishing any other personal or organizational data from the case file.

### Forbidden by default
- names, initials, usernames or identifiers of the employee, employer representatives, witnesses or other private persons from the case;
- phone numbers, email addresses and messenger identifiers;
- residential, registration, workplace or correspondence addresses;
- passport, ID-card, tax identification and other personal document data;
- dates of birth where they can identify a person;
- signatures, seals containing identifying information, QR codes or barcodes from original documents;
- photographs or screenshots containing identifying information;
- original case PDFs or unredacted extracts from them;
- real case or proceeding numbers unless the user later expressly approves their publication;
- names, EDRPOU codes, bank details, addresses, contacts or other identifying details of the employer, its branches, counterparties or other legal entities from the source file;
- names and contact details of private representatives, lawyers, union officers or employees appearing in the case materials, unless separately approved;
- metadata, filenames or asset names that reveal a protected identity or source document;
- credentials, API keys, secrets, tokens or private URLs.

Use generic roles in public product content by default:
- `Працівник`
- `Роботодавець`
- `ПРМТУ`
- `Суд`
- `Представник`

All evidence used in the application must be recreated or redacted specifically for the game and reviewed for re-identification risk before commit.

If there is any doubt whether a fragment can identify a protected person or organization, DO NOT COMMIT IT. Keep it only in the private working context and replace it with a generic reconstruction.

## Legal accuracy

Game content must distinguish between:
1. a party's allegation;
2. evidence submitted by a party;
3. a court finding;
4. a final legal conclusion.

Do not label a disputed factual or legal proposition as correct until supported by the relevant court decision or current law.

## Source completeness rule

Do not present a case-specific conclusion as final until the complete supplied source set relevant to that conclusion has been reviewed. If only part of a volume has been reviewed, mark the conclusion as provisional.

## Product principle

The mobile UI is the player's personal case. The large-screen UI is the collective case of the room. Speed is only a bonus; legal correctness is the primary scoring factor.
