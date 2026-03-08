aplikacija za beleženje lokalnih iger košarke HOOPS

Osnovna funkcionalnosti sistema: 

Omogočanje uporabnikom ustvarjanje courtov (igrišč), Ustvarjanje iger na teh igriščih, beleženje rezultatov, pogled na leaderboard, pridobitev RANKA (bronze, siver, gold ... diamond, etc.).

Uporabniki bi bili večinsko lokalni igralci pick-up košarke na nekem igrišču, bodisi telovanica ali zunanje igrišče.

Komunikacija med komponentami: 

    sistem bi bil sestavljen iz 5 glavnih komponent: 

    1. Court service

    lokacija in status igrišča (empty, waiting for players, packed), število košev na igrišču, tip igrišča (telovadnica, zunanje igrišče).

    omogoča vpogled na aktivna igrišča.

    2. Session service

    Uporavljanje igre znotra aplikacije, od "Match found" do "finished"
    ob začetu igre se udeležencem spremenljivka In_game nastavi na True.

    Omogočanje zgol večinske udeležbe prijavljenih uporabnikov, da preprečimo neizvedljive igre (kakšen igralec mogoče nima aplikacije). npr. pri 10 igralcih jih mora prijavljenih biti 7 prijavljenih, ostali 3je se lahko ročno vnesejo.

    
    3. Ranking service.
    Uporabniku se izračuna pridbljen/izbuljen "rating", glede na faktorje, kot so :
        - tvoj rating v primerjavo z povprečnim ratingom igre,
        - kako zaupliv je prijavljen rezultat (recimo da pri visokih rankih začnemo zahtevati "priče", ljudi, kateri lajhko potrdijo rezultat igre 1v1. drugače bi bilo preveč izpostavljeno goljufanju).
        - "handicap" (recimo igra 5 proti 4)
    
    priprava leaderboardov za neko mesto in lokalnih leaderboardov za posamezni court.

    4. User service.
    uporabljanje avtentikacije/avtorizecije, zgodovino igralca etc.

    primer podatkov:
        - Id
        - Uporabnikško ime
        - email
        - Rank
        - In_game
        - st. Odigranih iger
        - st. zmag
        - st. porazov 
        - reputaiton (honor system)
        - home court/ favurite courts []

Uporabnik ima bolši "reputation", večkrat ga drugi (in različni) igralci označijo kot poštenega npr.


