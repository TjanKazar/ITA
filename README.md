# 🏀 HOOPS

Aplikacija za beleženje lokalnih **pick-up košarkaških iger**.

HOOPS omogoča igralcem na lokalnih igriščih ustvarjanje tekem, beleženje rezultatov ter spremljanje **rankinga in leaderboardov**.

---

# 📌 Opis projekta

HOOPS je namenjen predvsem **lokalnim igralcem pick-up košarke** na:

- zunanjih igriščih
- telovadnicah
- rekreativnih ligah

Aplikacija omogoča organizacijo iger, beleženje rezultatov ter spremljanje napredka igralcev skozi **ranking sistem**.

---

# ⚙️ Osnovne funkcionalnosti

- ustvarjanje **courtov (igrišč)**
- ustvarjanje **iger na teh igriščih**
- beleženje **rezultatov tekem**
- **leaderboard** za mesta in posamezna igrišča
- **ranking sistem** (Bronze → Silver → Gold → Diamond)

---

# 🏗️ Arhitektura sistema

Sistem je sestavljen iz **5 glavnih komponent (microservices)**.

---

## 1️⃣ Court Service

Skrbi za informacije o igriščih.

### Funkcionalnosti

- lokacija igrišča
- status igrišča:
  - `empty`
  - `waiting for players`
  - `packed`
- število košev na igrišču
- tip igrišča:
  - `telovadnica`
  - `zunanje igrišče`

### Omogoča

- vpogled v **aktivna igrišča**
- pregled igrišč v bližini

---

## 2️⃣ Session Service

Upravlja potek igre znotraj aplikacije.

### Lifecycle igre
