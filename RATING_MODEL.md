# EloStats Football — rating model

**Status:** spec after external critique (2026-10-13). The admin Point settings preview implements this engine on demo seasons. Production Elo still waits on ingested match files.

**Product:** career, peak, and era-aware comparison of players, keepers, coaches, clubs, and nations.

**Honest claim:** Championship vs Premier League difficulty is identified from **cups, promotion, and (when present) player transfers**. NPFL vs Europe is **not** identified from club results alone. CAF stays inside Africa. Until transfer offsets are fitted, do **not** treat NPFL \(Q \approx 1\) and Championship \(Q \approx 1\) as a solved comparison.

---

## 0. Invariants (necessary, not sufficient)

1. **Clubs and nations** are rated from results only. No typed “1st division ×6”.
2. **People** inherit difficulty from the **opponent they faced that day**, not from a division label.
3. **Cross-position boards** use a within-role \(z\)-map, then \(R = 1500 + 200z_{\mathrm{shrunk}}\).
4. **Honours are optional and second.** Publish **Performance Elo** and **Elo + honours** side by side. Honours never enter Layer 1 club Elo.
5. **Weights in §9 are a prior.** Objectivity means fitted weights, a stated target, and the validation tests in §12.

### Three layers

| Layer | Who | Signal | Performance Elo | Elo + honours |
|---|---|---|---|---|
| 1. Quality | Clubs, nations | Results | Yes (this *is* \(R\)) | n/a |
| 2. Performance | Players, keepers, coaches | Role-native rate, then \(z\) | Yes | Blend (§8) |
| 3. Honours | Same people | Individual awards, field-strength scaled | No | Yes, bounded |

---

## 1. Notation

| Symbol | Meaning | Default |
|---|---|---|
| \(R_0\) | Starting Elo | 1500 |
| \(K\) | Base match K-factor | 20 |
| \(H\) | Home advantage (Elo pts); **0** if neutral | 60 |
| \(A\) | Quality anchor | 1500 |
| \(S\) | Quality scale (to be **fitted** on movers) | 800, pending calibration |
| \(Q_{\min}, Q_{\max}\) | Caps on \(Q\) | 0.45, 2.5 |
| \(\sigma_R\) | \(z \to\) Elo | 200 |
| \(M_0\) | Minutes shrinkage prior | 1200 |
| \(M_{\min}\) | Soft eligibility for \(\mu,\sigma\) | 900 |
| \(\lambda\) | Honours blend when stats are rich | 0.15 (higher when coverage is thin) |

---

## 2. Layer 1 — Club Elo and country Elo

Walk **all** finished fixtures **sorted by kickoff**. Clubs and nations are **separate graphs** with the same update. A 1900 nation is not a 1900 club. FIFA’s published ranking is not an input.

### 2.1 Expected score

$$
E_h = \frac{1}{1 + 10^{\bigl(R_a - (R_h + H_m)\bigr)/400}}
$$

\(H_m = 0\) on neutral venues; otherwise \(H\).

### 2.2 Update

Competition-specific \(K\):

| Kind | \(K\) |
|---|---|
| League | \(K\) |
| Domestic cup | \(0.75K\) (reserves compress the gap; still a bridge) |
| Continental club | \(K\) |
| Friendly | \(0.5K\) |

Goal-difference factor (ClubElo-style, on):

$$
G = \frac{\ln\bigl(1 + |g_h - g_a|\bigr)}{\ln 2}
$$

One-goal games \(G=1\); three-goal games \(G=2\). Then

$$
R_h' = R_h + K_m G (S_h - E_h),\quad
R_a' = R_a + K_m G \bigl((1-S_h)-(1-E_h)\bigr)
$$

\(S_h \in \{1, 0.5, 0\}\).

Optional later: Dixon–Coles **attack/defence split** per club so a striker’s \(Q\) uses opponent defence and a CB’s \(Q\) uses opponent attack. Venue-aware player \(Q\) already uses \(R_{\mathrm{opp}}+H\) when the player is away (§4).

### 2.3 Bridges and the NPFL hole

- **PL ↔ Championship:** cups (weak) + promotion/relegation (slow). Identified, noisy.
- **NPFL ↔ Europe:** almost no club bridges. CAF does not touch UEFA. Nations do not glue club graphs. Club World Cup is too thin.
- **Fix:** player **transfers** as the missing bridge. Fit league offsets so movers’ Performance Elo is stable on average; use those offsets as a **prior** on cold-start league Elo. Until that estimator exists, isolated leagues stay near 1500 and \(Q \approx 1\).

Season regression-to-mean and defunct clubs: apply a mild pull toward \(R_0\) at season boundaries (not in the demo walk).

Women’s and men’s football: **two graphs**, same engine.

---

## 3. Leagues

$$
L_\ell = \mathrm{mean}_{c \in \ell} R_c
$$

Display and diagnostics. Players do **not** get a league bonus on top of opponents. \(L_\ell\) after transfer priors is the NPFL coefficient; \(L_\ell\) from an unbridged results graph is not.

---

## 4. Opponent quality \(Q\)

### 4.1 Definition

$$
Q_{\mathrm{raw}} = 10^{(R_{\mathrm{opp}} - A)/S},\quad
Q = \mathrm{clip}(Q_{\mathrm{raw}},\, Q_{\min},\, Q_{\max})
$$

\(S=800\) and the caps are **placeholders**. Calibrate \(S\) (and caps) so that \(Q \times\) expected attacking output is roughly constant across opponents, equivalently so **movers keep \(R\)** (validation §12a). Until that fit, \(S\) is a continuous opinion — the same family as a division multiplier, just not typed as ×6/×3.

Away matches: use \(R_{\mathrm{opp}} + H\) in \(Q\) (venue-aware). Neutral: no \(H\).

Club minutes use **club** opponent Elo. International minutes are a **separate** \(\rho\) using **nation** opponent Elo. Do not pool them.

### 4.2 Which metrics get \(Q\)

| Metrics | \(Q\)? | Why |
|---|---|---|
| Non-penalty goals, assists, key passes, penalties scored, penalties saved | **Yes** | Output against a level |
| Tackles, interceptions, blocks, duels | **No** | Volume on bad teams; possession-adjust instead |
| Yellow, red | **No** | A red vs Arsenal is not 2.5× a red vs Derby |
| PSxG − GA, save % vs expected | **No** | Already shot-quality residuals |
| Clean sheets | **No** | Team stat |

### 4.3 Possession-adjust defence

Let \(p_{\mathrm{opp}}\) be opponent share of possession (clip to \([0.2, 0.8]\)).

$$
x^{\mathrm{def}} = x \cdot \frac{0.5}{p_{\mathrm{opp}}}
$$

A relegation CB facing 62% opponent possession has volume **shrunk**; a possession-side CB facing 38% has volume **raised**. Missing possession → \(p_{\mathrm{opp}}=0.5\) (no adjust).

### 4.4 Share of team (teammate dampening)

For goals, assists, key passes, mix raw count with share of team output:

$$
x' = 0.7\, x + 0.3 \cdot \frac{x}{X_{\mathrm{team}}} \cdot X_0
$$

\(X_0\) baselines: 50 goals, 40 assists, 400 key passes per team-season. A 20-goal striker on a 100-goal side is pulled down; the same 20 on a 40-goal side is not.

### 4.5 Era

**Do not apply** an era GPG multiplier when \(z\) is computed **within position-season**. \(\mu_p\) already absorbs that season’s scoring level. Keep \(e = g^\*/g\) only if you ever publish raw \(\rho\) across decades without \(z\).

---

## 5. Outfield players

### 5.1 Roles (peer groups)

Assign from **formation grid** (lineup `grid`), not API-Football’s G/D/M/F.

| Peer group | Typical grid |
|---|---|
| ST | centre forward / striker |
| W | wide attackers |
| AM | attacking mid / 10 |
| CM | box-to-box 8, wide mid |
| DM | holding 6 |
| FB | full-back |
| WB | wing-back |
| CB | centre-back |
| GK | keepers (own board, §6) |

Rodri (DM) and De Bruyne (AM) must not share \(\mu,\sigma\). Minutes in two groups → minutes-weighted average of each group’s \(R\).

§9 weights are **priors per peer group**, to be replaced by a within-role regression (on-pitch goal difference or next-season outcomes).

### 5.2 Match points

$$
P_m = \sum_i \mathrm{sign}(i)\, w_{p,i}\, \tilde x_{i,m}\, Q_{i,m}
$$

\(\tilde x\) is possession-adjusted and/or share-adjusted. \(Q_{i,m}\) is 1 unless the metric is in the attacking set (§4.2). \(\mathrm{sign}=-1\) for cards.

$$
\rho = P \big/ (M/90)
$$

Exclude \(M=0\). Club \(\rho\) and international \(\rho\) stay separate.

### 5.3 Coverage strata

\(\mu_p,\sigma_p\) are computed only among players with the **same metric set** (e.g. full match stats vs lineup-only). NPFL players with lineups must not sit in the same \(z\) as PL players with complete `statistics_players`.

### 5.4 Minutes shrinkage and Player Elo

Peers: worldwide, that **role**, that **season**, that **coverage stratum**, already \(Q\)-adjusted. Not same-league peers.

$$
z_p = \frac{\rho - \mu_p}{\sigma_p},\quad
z_{\mathrm{shrunk}} = z_p \cdot \frac{M}{M + M_0}
$$

If \(\sigma_p=0\), \(z_p=0\). The 900' rule is a **soft** gate for entering \(\mu,\sigma\); short seasons still get a shrunk \(z\) rather than a cliff.

$$
R_{\mathrm{player}} = 1500 + 200\, z_{\mathrm{shrunk}}
$$

**Career:** minutes-weighted mean of season \(R_{\mathrm{player}}\).  
**Peak:** 90th percentile of rolling 38-game windows (not the max — max is biased upward for long careers).

---

## 6. Keepers

Own board. **Never** mix PSxG keepers and no-PSxG keepers in one \(z\).

| Metric | \(Q\) | Notes |
|---|---|---|
| PSxG − GA | No | Drop if missing; do not impute |
| Save % vs expected | No | Only if an expected-saves model exists |
| Penalties saved | Yes | Count |
| Clean sheets | No | Tiny weight |
| Cards | No | Unscaled |

Open StatsBomb is a sample. Most API-Football keepers have **no** PSxG: rate them on a **basic** stratum (pens, clean sheets, cards) or omit shot-stopping Elo.

Then \(R_{\mathrm{keeper}} = 1500 + 200\, z_{\mathrm{shrunk}}\) inside the stratum.

---

## 7. Coaches

Do **not** score only \(\Delta = T - T_E\). A coach who holds a 1900 club at 1900 would look average every year.

1. **Freeze** pre-season club Elo \(\bar R\) (breaks the cycle with player \(Q\)).
2. Over the **actual schedule**, with a draw model (\(p_{\mathrm{draw}} \approx 0.28 \cdot 4 E (1-E)\), clipped):

$$
T_E = \sum_m \bigl(3\, P(\mathrm{win}_m) + P(\mathrm{draw}_m)\bigr)
$$

Pro-rate for mid-season appointments.

3. **Level** \(+\) **change**:

$$
\rho_{\mathrm{coach}} = w_\Delta (T - T_E) + w_{\mathrm{level}} \frac{\bar R - 1500}{100}
$$

Default \(w_\Delta = 2.5\), \(w_{\mathrm{level}} = 8\) (a 1900 club contributes \(8 \times 4 = 32\), similar order to a +13 pts \(\Delta\)). Optional second baseline: wage bill / squad value (not in v1).

4. **Do not** subtract players’ yellow/red. Touchline cards only, if ever.

Then optional coach \(z \to 1500+200z\) on a coach board.

---

## 8. Honours (second column)

**Never** add trophies into Layer 1. Team medals stay minutes-shared on a cabinet.

**Elo + honours** uses **individual** awards only, and must stay position-fair:

- Keepers: Yashin / Golden Glove / best GK.
- Outfield: Ballon d’Or **and** best-defender / best-midfielder / TOTS-by-position when present.
- Coaches: FIFA Best Coach, league manager.

Field-strength: multiply an award by \(\mathrm{mean}(R)\) of its eligible pool / 1500 (Ballon d’Or pool ≫ NPFL POTY).

Bounded blend:

$$
R_+ = (1-\lambda)\, R_{\mathrm{stats}} + \lambda\, \bigl(R_{\mathrm{stats}} + \min(B_{\mathrm{cap}},\, 0.5\, H_{\mathrm{ind}})\bigr)
$$

\(\lambda\) is **large** when stat coverage is thin (1960s, lineup-only leagues) and **small** (0.15) when match stats are rich. Cap \(B_{\mathrm{cap}}=100\). Decay bonuses over 2–3 seasons on career views.

Publish both \(R_{\mathrm{stats}}\) and \(R_+\).

---

## 9. Prior weights (to be fitted)

Peer-group priors. Not data-fitted.

| Metric | ST | W | AM | CM | DM | FB | WB | CB |
|---|---|---|---|---|---|---|---|---|
| NP goals | 8 | 6 | 5 | 4 | 2 | 2 | 3 | 2 |
| Penalties | 3 | 2 | 2 | 1.5 | 1 | 1 | 1 | 1 |
| Assists | 5 | 6 | 6 | 5 | 3 | 3.5 | 5 | 1 |
| Key passes | 1.2 | 1.8 | 2.4 | 1.8 | 1.2 | 1 | 1.6 | 0.4 |
| Tackles won | 0.8 | 1.2 | 1.2 | 2.2 | 3 | 2.5 | 2.2 | 3 |
| Interceptions | 0.8 | 1 | 1 | 2.2 | 3.2 | 2.5 | 2 | 3 |
| Blocks | 0.5 | 0.6 | 0.6 | 1 | 2 | 1.5 | 1.2 | 2.8 |
| Duels won | 1 | 1 | 0.8 | 1.2 | 1.8 | 1.8 | 1.5 | 2.5 |
| Yellow / red | 1.5 / 6 | same | same | same | same | same | same | same |

Fit later: regress team goal difference while on pitch (or next-season outcomes) on per-90 metrics **within role**; use this table as the prior.

API-Football will not supply xG/xA/progressive carries globally. This board is **API-Football-complete**, plus PSxG where StatsBomb exists. That is a data constraint, not a maths one.

---

## 10. Rejected counting model (demo contrast only)

\[
\text{score} = 8\cdot\text{goals} + 0.5\cdot\text{passes} + 1\cdot\text{saves} + 3\cdot\text{clean sheets} + \text{full trophies}
\]

Rewards volume, save totals, super-team coaches, and medals inside the same number.

---

## 11. Validation (acceptance tests)

The model is not “objective” until these are measured on held-out seasons:

| Id | Test |
|---|---|
| (a) | **Transfer invariance.** Movers’ \(R_{\mathrm{stats}}\) is stable on average. This is how \(S\), caps, and league offsets are fitted. |
| (b) | **Test–retest.** Year-to-year correlation of \(R\) per role. |
| (c) | **Predictive.** Does \(R\) predict future team results, market value, or award votes? |
| (d) | **Positional balance.** Top 50 by \(R_{\mathrm{stats}}\) roughly proportional to lineup slots (not 40 strikers). |

---

## 12. What remains open

- Dixon–Coles attack/defence split for \(Q\).
- Wage-bill coach baseline.
- RAPM / plus-minus as a blend with counting (research track, not v1).
- Exact \(\lambda\) schedule by coverage year.
- Women’s graph cold-start.

---

## 13. Engine (admin)

Implemented in `elo_admin/src/engine/ratingEngine.js` and shown on Point settings:

- Layer 1: kickoff sort, neutral \(H=0\), competition \(K\), GD multiplier.
- \(Q\) only on attacking metrics; capped; venue-aware when `isAway` is set.
- Defence possession-adjusted; cards unscaled; residuals unscaled.
- Share-of-team mix for goals/assists/key passes.
- Role-group \(z\), minutes shrinkage, coverage strata (keepers: PSxG vs basic).
- Coach: frozen Elo level + schedule \(T_E\) (demo uses supplied schedule/expected points).
- Columns: counting (old), Performance Elo, Elo + honours, honours cabinet.

Production pipeline (Postgres, per-match grain, transfer offsets) is not wired yet.
