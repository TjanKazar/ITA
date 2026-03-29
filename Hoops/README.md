# HOOPS

Aplikacija za beleženje lokalnih iger košarke.

## Opis

HOOPS omogoča uporabnikom beleženje lokalnih pick-up košarkaških iger.  
Uporabniki so večinsko lokalni igralci, ki igrajo na določenem igrišču, bodisi v telovadnici ali na zunanjem igrišču.

## Osnovne funkcionalnosti sistema

- ustvarjanje courtov (igrišč)
- ustvarjanje iger na teh igriščih
- beleženje rezultatov (potencialno dosegljivo z computer vision, kjer od vsakega igralca telefonska kamera gleda en obroč
      - beleženje rezultatov bi delovalo v vseh "game modih", beleženje osebne statistike na ta način samo v 1v1).
- vpogled v leaderboard
- pridobivanje ranka (bronze, silver, gold, diamond ...)

## Komunikacija med komponentami

Sistem je sestavljen iz 5 glavnih komponent.

### 1. Court service (implemented)

## Court Model

| Column      | Type        | Constraints        | Default               |
|-------------|-------------|--------------------|-----------------------|
| `id`        | `int32`     | Primary Key        | Auto-generated        |
| `name`      | `string`    | —                  | —                     |
| `city`      | `string`    | —                  | —                     |
| `address`   | `string`    | —                  | —                     |
| `latitude`  | `float32`   | —                  | —                     |
| `longitude` | `float32`   | —                  | —                     |
| `hoop_count`| `int32`     | —                  | —                     |
| `court_type`| `int32`     | —                  | —                     |
| `status`    | `int32`     | —                  | `0`                   |
| `created_at`| `timestamp` | —                  | Current timestamp     |


### Court Type Values

| Value | Description |
|-------|-------------|
| `0`   | Outdoor     |
| `1`   | Indoor      |
| `2`   | Mixed       |

### Status Values

| Value | Description |
|-------|-------------|
| `0`   | Pending     |
| `1`   | Active      |
| `2`   | Closed      |

### 2. Session service

Upravlja igro znotraj aplikacije, od **"Match found"** do **"finished"**.

Ob začetku igre se udeležencem spremenljivka `In_game` nastavi na `True`.

Omogoča večinsko udeležbo prijavljenih uporabnikov, da preprečimo neizvedljive igre (npr. igralec nima aplikacije).

Primer:

- pri 10 igralcih mora biti vsaj 7 prijavljenih v aplikaciji
- ostali 3 se lahko vnesejo ročno

### 3. Ranking service

Uporabniku se izračuna pridobljen oziroma izgubljen rating glede na več faktorjev:

- primerjava igralčevega ratinga s povprečnim ratingom igre
- zaupanje v prijavljen rezultat  
  (pri višjih rankih lahko zahtevamo "priče", ki potrdijo rezultat igre 1v1)
- handicap (npr. igra 5 proti 4)

Service pripravlja tudi leaderboarde:

- leaderboard za neko mesto
- lokalne leaderboarde za posamezni court

### 4. User service (implemented)

Upravlja uporabnike, avtentikacijo in zgodovino igralca.

USER mode: 
a
## User Model

| Column            | Type           | Constraints                      | Default                |
|-------------------|----------------|----------------------------------|------------------------|
| `id`              | `Integer`      | Primary Key, Indexed             | Auto-generated         |
| `username`        | `String(50)`   | Unique, Indexed, Not Null        | —                      |
| `email`           | `String(255)`  | Unique, Indexed, Not Null        | —                      |
| `hashed_password` | `String(255)`  | Not Null                         | —                      |
| `in_game`         | `Boolean`      | —                                | `False`                |
| `games_played`    | `Integer`      | —                                | `0`                    |
| `wins`            | `Integer`      | —                                | `0`                    |
| `losses`          | `Integer`      | —                                | `0`                    |
| `is_active`       | `Boolean`      | —                                | `True`                 |
| `created_at`      | `DateTime(tz)` | —                                | Current UTC timestamp  |

## Reputation

Uporabnik ima boljši reputation, če ga več različnih igralcev označi kot poštenega.