# HOOPS

Aplikacija za beleženje lokalnih iger košarke.

## Opis

HOOPS omogoča uporabnikom beleženje lokalnih pick-up košarkaških iger.  
Uporabniki so večinsko lokalni igralci, ki igrajo na določenem igrišču, bodisi v telovadnici ali na zunanjem igrišču.

## Osnovne funkcionalnosti sistema

- ustvarjanje courtov (igrišč)
- ustvarjanje iger na teh igriščih
- beleženje rezultatov
- vpogled v leaderboard
- pridobivanje ranka (bronze, silver, gold, diamond ...)

## Komunikacija med komponentami

Sistem je sestavljen iz 5 glavnih komponent.

### 1. Court service

Hrani informacije o igriščih:

- lokacija
- status igrišča (empty, waiting for players, packed)
- število košev na igrišču
- tip igrišča (telovadnica, zunanje igrišče)

Omogoča tudi vpogled v aktivna igrišča.

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

### 4. User service

Upravlja uporabnike, avtentikacijo in zgodovino igralca.

Primer podatkov:

- Id
- Uporabniško ime
- email
- Rank
- In_game
- št. odigranih iger
- št. zmag
- št. porazov
- reputation (honor system)
- home court
- favourite courts []

## Reputation

Uporabnik ima boljši reputation, če ga več različnih igralcev označi kot poštenega.