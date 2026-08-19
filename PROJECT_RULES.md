# PROJECT RULES

## Security / public repository rule

This repository is treated as PUBLIC.

Never commit original court case files, raw evidence, source PDFs, screenshots from the case file, or any identifying data of natural persons or legal entities.

Forbidden in repository content unless the user has explicitly approved a specific anonymized fragment for public presentation:
- full names, initials, usernames or other identifiers of natural persons;
- phone numbers, email addresses and messenger identifiers;
- residential, registration, workplace or correspondence addresses;
- passport, ID-card, tax identification and other personal document data;
- dates of birth where they can identify a person;
- signatures, seals containing identifying information, QR codes or barcodes from original documents;
- photographs or screenshots containing identifying information;
- original case PDFs or unredacted extracts from them;
- real case numbers or proceeding numbers;
- names, EDRPOU codes, bank details, addresses, contacts or other identifying details of legal entities, employers, branches, institutions or third parties from the case file;
- names and contact details of representatives, judges, lawyers, union officers or employees appearing in the case materials;
- metadata, filenames or asset names that reveal an identity or the source case;
- credentials, API keys, secrets, tokens or private URLs.

Use generic roles in public product content by default:
- `Працівник`
- `Роботодавець`
- `Профспілка`
- `Суд`
- `Представник`

All evidence used in the application must be recreated or redacted specifically for the game and reviewed for re-identification risk before commit.

If there is any doubt whether a fragment can identify a person, organization or the underlying case, DO NOT COMMIT IT. Keep it only in the private working context and replace it with a generic reconstruction.

## Legal accuracy

Game content must distinguish between:
1. a party's allegation;
2. evidence submitted by a party;
3. a court finding;
4. a final legal conclusion.

Do not label a disputed factual or legal proposition as correct until supported by the relevant court decision or current law.

## Product principle

The mobile UI is the player's personal case. The large-screen UI is the collective case of the room. Speed is only a bonus; legal correctness is the primary scoring factor.
