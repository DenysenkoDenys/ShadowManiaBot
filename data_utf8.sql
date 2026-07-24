--
-- PostgreSQL database dump
--

\restrict Kuj7suZn1PW246ApqMYXUJPCbiyeDnUlyA26hPneXuwyeLkh7ozDdLoBzMFclbK

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."User" (id, "telegramId", username, "displayName", "avatarUrl", "createdAt", "updatedAt", "lastLoginAt", "streakCount", "dustBalance", "packOpens", "lastCardClaimAt", "universePoints", "bonusClaims", "notifyArenaTimer", "notifyCardTimer", "premiumUntil", "totalCardClaims", "hasCustomNickname", "arenaLosses", "arenaRating", "arenaWins", "lastArenaBattleAt", "arenaDefended", "arenaTeamCardIds", "lastArenaBattleLog", "arenaTimerNotified", "cardTimerNotified", shards, "craftLocked", "referredBy", "lastRaidAt") VALUES ('cmrd4qln9000h9guzejh1h2yj', '865050099', 'CoconutOneLove1', 'Shadow', NULL, '2026-07-09 06:32:33.045', '2026-07-24 05:22:06.053', '2026-07-24 05:22:06.05', 0, 7619, 0, '2026-07-24 05:18:21.986', 66950, 17, true, true, '2026-08-17 07:05:52.828', 49, true, 7, 1044, 11, '2026-07-24 05:18:25.209', 0, '{cmrd4qllm00089guzbr2w5944,cmrd4qlmm000d9guz91ui9l7e,cmrd4qlkn00049guzls6xhroe,cmrd4qlkw00059guz5dmpeowz,cmrd4qlmg000c9guzkx8s0kug}', '{"win": true, "rounds": 2, "timestamp": "2026-07-24T05:18:25.209Z", "opponentName": "╨Т╨╕╨│╨╜╨░╨╜╨╡╤Ж╤М ╨╖ ╨б╤Г╨╜╨╕", "opponentFinalHp": 0, "isPlayerOpponent": false, "totalDamageDealt": 43900, "totalDamageTaken": 42876}', false, false, 137, false, NULL, '2026-07-22 05:16:33.908');
INSERT INTO public."User" (id, "telegramId", username, "displayName", "avatarUrl", "createdAt", "updatedAt", "lastLoginAt", "streakCount", "dustBalance", "packOpens", "lastCardClaimAt", "universePoints", "bonusClaims", "notifyArenaTimer", "notifyCardTimer", "premiumUntil", "totalCardClaims", "hasCustomNickname", "arenaLosses", "arenaRating", "arenaWins", "lastArenaBattleAt", "arenaDefended", "arenaTeamCardIds", "lastArenaBattleLog", "arenaTimerNotified", "cardTimerNotified", shards, "craftLocked", "referredBy", "lastRaidAt") VALUES ('cmreqo3yr000ht0uz9oh9gw7z', '868461666', 'denX3m', 'denX3m', NULL, '2026-07-10 09:34:14.547', '2026-07-12 05:25:44.382', '2026-07-10 09:38:45.146', 0, 0, 0, '2026-07-10 09:34:17.69', 0, 0, true, true, NULL, 1, true, 0, 1000, 0, NULL, 0, '{}', NULL, false, true, 0, false, NULL, NULL);


--
-- Data for Name: BonusMilestoneClaim; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."BonusMilestoneClaim" (id, "userId", threshold, "claimedAt") VALUES ('cmrowlfif000iywuzaior3976', 'cmrd4qln9000h9guzejh1h2yj', 10, '2026-07-17 12:17:48.999');
INSERT INTO public."BonusMilestoneClaim" (id, "userId", threshold, "claimedAt") VALUES ('cmrowlkdy000jywuzlkisz09s', 'cmrd4qln9000h9guzejh1h2yj', 25, '2026-07-17 12:17:55.318');


--
-- Data for Name: Season; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Season" (id, name, theme, status, "startsAt", "endsAt", "createdAt", "updatedAt") VALUES ('cmrd4qlip00009guz9zfelcne', 'Season 1', 'Anime', 'ACTIVE', NULL, NULL, '2026-07-09 06:32:32.881', '2026-07-24 05:22:05.866');
INSERT INTO public."Season" (id, name, theme, status, "startsAt", "endsAt", "createdAt", "updatedAt") VALUES ('cmrd4qljq00019guz3y5xnd3s', 'Season 2', 'Memes', 'PLANNED', NULL, NULL, '2026-07-09 06:32:32.918', '2026-07-24 05:22:05.903');
INSERT INTO public."Season" (id, name, theme, status, "startsAt", "endsAt", "createdAt", "updatedAt") VALUES ('cmrd4qlju00029guza8xksbbv', 'Season 3', 'Games', 'PLANNED', NULL, NULL, '2026-07-09 06:32:32.922', '2026-07-24 05:22:05.907');


--
-- Data for Name: CardSet; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."CardSet" (id, name, emoji, theme, "rewardText", "seasonId", "createdAt", "updatedAt") VALUES ('cmrd4qlka00039guz9n97kelr', 'Naruto', 'ЁЯНе', 'Naruto', '╨Ч╨░╨▓╨╡╤А╤И╤Ц╤В╤М ╨║╨╛╨╗╨╡╨║╤Ж╤Ц╤О Naruto, ╤Й╨╛╨▒ ╨╛╤В╤А╨╕╨╝╨░╤В╨╕ ╨╡╨║╤Б╨║╨╗╤О╨╖╨╕╨▓╨╜╤Г ╤А╨░╨╝╨║╤Г ╨║╨░╤А╤В', 'cmrd4qlip00009guz9zfelcne', '2026-07-09 06:32:32.938', '2026-07-24 05:22:05.922');


--
-- Data for Name: Card; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Card" (id, name, rarity, "seasonId", "cardSetId", "basePower", health, "imageUrl", "evolutionLevel", "createdAt", "updatedAt") VALUES ('cmrd4qlkn00049guzls6xhroe', '╨Э╨░╤А╤Г╤В╨╛ ╨г╨╖╤Г╨╝╨░╨║╤Ц', 'LEGENDARY', 'cmrd4qlip00009guz9zfelcne', 'cmrd4qlka00039guz9n97kelr', 4200, 7000, '../photo/Naruto/Naruto.webp', 1, '2026-07-09 06:32:32.951', '2026-07-24 05:22:05.933');
INSERT INTO public."Card" (id, name, rarity, "seasonId", "cardSetId", "basePower", health, "imageUrl", "evolutionLevel", "createdAt", "updatedAt") VALUES ('cmrd4qlkw00059guz5dmpeowz', '╨б╨░╤Б╨║╨╡ ╨г╤З╤Ц╤Е╨░', 'EPIC', 'cmrd4qlip00009guz9zfelcne', 'cmrd4qlka00039guz9n97kelr', 3400, 5600, '../photo/Naruto/Sasuke.jpg', 1, '2026-07-09 06:32:32.96', '2026-07-24 05:22:05.942');
INSERT INTO public."Card" (id, name, rarity, "seasonId", "cardSetId", "basePower", health, "imageUrl", "evolutionLevel", "createdAt", "updatedAt") VALUES ('cmrd4qll500069guzlkxo9kxk', '╨б╨░╨║╤Г╤А╨░ ╨е╨░╤А╤Г╨╜╨╛', 'RARE', 'cmrd4qlip00009guz9zfelcne', 'cmrd4qlka00039guz9n97kelr', 1800, 3200, '../photo/Naruto/Sakura.webp', 1, '2026-07-09 06:32:32.969', '2026-07-24 05:22:05.955');
INSERT INTO public."Card" (id, name, rarity, "seasonId", "cardSetId", "basePower", health, "imageUrl", "evolutionLevel", "createdAt", "updatedAt") VALUES ('cmrd4qllc00079guzyyx64oq9', '╨Ъ╨░╨║╨░╤И╤Ц ╨е╨░╤В╨░╨║╨╡', 'EPIC', 'cmrd4qlip00009guz9zfelcne', 'cmrd4qlka00039guz9n97kelr', 3200, 5200, '../photo/Naruto/Hatake.jpeg', 1, '2026-07-09 06:32:32.976', '2026-07-24 05:22:05.966');
INSERT INTO public."Card" (id, name, rarity, "seasonId", "cardSetId", "basePower", health, "imageUrl", "evolutionLevel", "createdAt", "updatedAt") VALUES ('cmrd4qllm00089guzbr2w5944', '╨Ь╨░╨┤╨░╤А╨░ ╨г╤З╤Ц╤Е╨░', 'MYTHIC', 'cmrd4qlip00009guz9zfelcne', 'cmrd4qlka00039guz9n97kelr', 6500, 10000, '../photo/Naruto/Madara.webp', 1, '2026-07-09 06:32:32.986', '2026-07-24 05:22:05.975');
INSERT INTO public."Card" (id, name, rarity, "seasonId", "cardSetId", "basePower", health, "imageUrl", "evolutionLevel", "createdAt", "updatedAt") VALUES ('cmrd4qllt00099guziqluri55', '╨Ф╨╢╨╕╤А╨░╨╣╤П', 'RARE', 'cmrd4qlip00009guz9zfelcne', 'cmrd4qlka00039guz9n97kelr', 2000, 3400, '../photo/Naruto/Jiraya.webp', 1, '2026-07-09 06:32:32.993', '2026-07-24 05:22:05.982');
INSERT INTO public."Card" (id, name, rarity, "seasonId", "cardSetId", "basePower", health, "imageUrl", "evolutionLevel", "createdAt", "updatedAt") VALUES ('cmrd4qlm2000a9guz4r8tkcak', '╨е╤Ц╨╜╨░╤В╨░ ╨е╤М╤О╨│╨░', 'COMMON', 'cmrd4qlip00009guz9zfelcne', 'cmrd4qlka00039guz9n97kelr', 1200, 2200, '../photo/Naruto/Hinata.webp', 1, '2026-07-09 06:32:33.002', '2026-07-24 05:22:05.989');
INSERT INTO public."Card" (id, name, rarity, "seasonId", "cardSetId", "basePower", health, "imageUrl", "evolutionLevel", "createdAt", "updatedAt") VALUES ('cmrd4qlm9000b9guzydivsqae', '╨и╤Ц╨║╨░╨╝╨░╤А╤Г ╨Э╨░╤А╨░', 'COMMON', 'cmrd4qlip00009guz9zfelcne', 'cmrd4qlka00039guz9n97kelr', 1100, 2000, '../photo/Naruto/Shikamaru.webp', 1, '2026-07-09 06:32:33.009', '2026-07-24 05:22:05.996');
INSERT INTO public."Card" (id, name, rarity, "seasonId", "cardSetId", "basePower", health, "imageUrl", "evolutionLevel", "createdAt", "updatedAt") VALUES ('cmrd4qlmg000c9guzkx8s0kug', '╨У╨░╨░╤А╨░', 'EPIC', 'cmrd4qlip00009guz9zfelcne', 'cmrd4qlka00039guz9n97kelr', 3300, 5400, '../photo/Naruto/Gaara.webp', 1, '2026-07-09 06:32:33.016', '2026-07-24 05:22:06.002');
INSERT INTO public."Card" (id, name, rarity, "seasonId", "cardSetId", "basePower", health, "imageUrl", "evolutionLevel", "createdAt", "updatedAt") VALUES ('cmrd4qlmm000d9guz91ui9l7e', '╨Ж╤В╨░╤З╤Ц ╨г╤З╤Ц╤Е╨░', 'LEGENDARY', 'cmrd4qlip00009guz9zfelcne', 'cmrd4qlka00039guz9n97kelr', 4400, 7200, '../photo/Naruto/Itachi.webp', 1, '2026-07-09 06:32:33.022', '2026-07-24 05:22:06.008');


--
-- Data for Name: CardEvolution; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: CardInstance; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmrd52frb002woouzy1mgrnmb', 'cmrd4qln9000h9guzejh1h2yj', 'cmrd4qllc00079guzyyx64oq9', 'NORMAL', 1, false, '2026-07-09 06:41:45.287');
INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmreqo3zk000it0uzseepw7se', 'cmreqo3yr000ht0uz9oh9gw7z', 'cmrd4qlkn00049guzls6xhroe', 'NORMAL', 1, false, '2026-07-10 09:34:14.576');
INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmreqo3zw000jt0uzbr4af1ow', 'cmreqo3yr000ht0uz9oh9gw7z', 'cmrd4qlkw00059guz5dmpeowz', 'SHINY', 1, false, '2026-07-10 09:34:14.588');
INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmreqo404000kt0uzx4tipdre', 'cmreqo3yr000ht0uz9oh9gw7z', 'cmrd4qll500069guzlkxo9kxk', 'GOLDEN', 1, false, '2026-07-10 09:34:14.596');
INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmreqo6ez000mt0uzu6v3ojfb', 'cmreqo3yr000ht0uz9oh9gw7z', 'cmrd4qlmg000c9guzkx8s0kug', 'NORMAL', 1, false, '2026-07-10 09:34:17.723');
INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmrd5174a0029oouzaq40d4q6', 'cmrd4qln9000h9guzejh1h2yj', 'cmrd4qllm00089guzbr2w5944', 'NORMAL', 2, false, '2026-07-09 06:40:47.434');
INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmrd4zt9h001eoouz763ty2ci', 'cmrd4qln9000h9guzejh1h2yj', 'cmrd4qlm9000b9guzydivsqae', 'NORMAL', 10, false, '2026-07-09 06:39:42.821');
INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmrd50ouk001woouz6vr47yh5', 'cmrd4qln9000h9guzejh1h2yj', 'cmrd4qllt00099guziqluri55', 'NORMAL', 4, false, '2026-07-09 06:40:23.756');
INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmrd4zuvq001goouz6dhwkzlc', 'cmrd4qln9000h9guzejh1h2yj', 'cmrd4qlmm000d9guz91ui9l7e', 'NORMAL', 4, false, '2026-07-09 06:39:44.918');
INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmrd4z6ed0015oouzt4gn7jr0', 'cmrd4qln9000h9guzejh1h2yj', 'cmrd4qlkw00059guz5dmpeowz', 'SHINY', 2, false, '2026-07-09 06:39:13.189');
INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmrd4z6ep0016oouzrg4m40pt', 'cmrd4qln9000h9guzejh1h2yj', 'cmrd4qll500069guzlkxo9kxk', 'GOLDEN', 4, false, '2026-07-09 06:39:13.201');
INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmrd4zqvd001coouzaloq9rjl', 'cmrd4qln9000h9guzejh1h2yj', 'cmrd4qlm2000a9guz4r8tkcak', 'NORMAL', 7, false, '2026-07-09 06:39:39.721');
INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmrd4zwat001ioouzxwxbl3bp', 'cmrd4qln9000h9guzejh1h2yj', 'cmrd4qlmg000c9guzkx8s0kug', 'NORMAL', 3, false, '2026-07-09 06:39:46.757');
INSERT INTO public."CardInstance" (id, "ownerId", "cardId", rank, copies, "isLocked", "acquiredAt") VALUES ('cmrd4z6dz0014oouz9a250908', 'cmrd4qln9000h9guzejh1h2yj', 'cmrd4qlkn00049guzls6xhroe', 'NORMAL', 8, false, '2026-07-09 06:39:13.175');


--
-- Data for Name: Clan; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Clan" (id, name, tag, description, banner, "seasonId", "weeklyScore", "totalCards", "bankDust", "createdAt", "updatedAt", "maxMembers", "isStarter", level) VALUES ('cmrd4qlmx000f9guzvdtf8yog', 'Dust Syndicate', 'DST', 'Economy and trading', NULL, NULL, 0, 0, 0, '2026-07-09 06:32:33.033', '2026-07-24 05:22:06.017', 20, true, 1);
INSERT INTO public."Clan" (id, name, tag, description, banner, "seasonId", "weeklyScore", "totalCards", "bankDust", "createdAt", "updatedAt", "maxMembers", "isStarter", level) VALUES ('cmrd4qln1000g9guzv800oltr', 'Night Circuit', 'NCT', 'Season events and quest pushes', NULL, NULL, 0, 0, 0, '2026-07-09 06:32:33.037', '2026-07-24 05:22:06.021', 20, true, 1);
INSERT INTO public."Clan" (id, name, tag, description, banner, "seasonId", "weeklyScore", "totalCards", "bankDust", "createdAt", "updatedAt", "maxMembers", "isStarter", level) VALUES ('cmrd4qlmr000e9guzwwu1jk9i', 'Shadow Legion', 'SLG', 'Clan wars and boss farming', NULL, NULL, 2500, 120, 5000, '2026-07-09 06:32:33.027', '2026-07-24 05:22:06.012', 20, true, 1);


--
-- Data for Name: ClanMember; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."ClanMember" (id, "clanId", "userId", role, "joinedAt", "contributionScore") VALUES ('cmrk92w0x000jt0uz3lcsm4vm', 'cmrd4qlmr000e9guzwwu1jk9i', 'cmrd4qln9000h9guzejh1h2yj', 'LEADER', '2026-07-14 06:08:28.065', 0);


--
-- Data for Name: ClanQuest; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."ClanQuest" (id, "clanId", title, progress, target, "rewardText", "completedAt", "createdAt", "updatedAt", type) VALUES ('cmrstqfeq000qlsuz7m8vu08y', 'cmrd4qlmr000e9guzwwu1jk9i', '╨Ч╨┤╨╛╨▒╤Г╨┤╤М╤В╨╡ ╤А╨░╨╖╨╛╨╝ 500 ╨║╨░╤А╤В╨╛╨║', 4, 500, '+50 000 ╨║╨╛╤Ц╨╜╤Ц╨▓ ╤Г ╨║╨░╨╖╨╜╤Г ╨║╨╗╨░╨╜╤Г', NULL, '2026-07-20 06:08:48.002', '2026-07-24 05:18:22.044', 'CARDS');


--
-- Data for Name: ClanWar; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: ClanWarParticipant; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: DailyRewardClaim; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: Location; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."Location" (id, name, emoji, "maxHp", "currentHp", "controllingClanId", "lastPayoutAt", "updatedAt") VALUES ('cmrstphac000ilsuzekdggrhw', '╨Ч╨╡╨╝╨╗╤Ц ╨Т╤Ц╤В╤А╤Ц╨▓', 'ЁЯМмя╕П', 1000000, 1000000, NULL, '2026-07-20 06:08:03.78', '2026-07-20 06:08:03.78');
INSERT INTO public."Location" (id, name, emoji, "maxHp", "currentHp", "controllingClanId", "lastPayoutAt", "updatedAt") VALUES ('cmrstphai000jlsuzorxm53al', '╨з╨╛╤А╨╜╤Ц ╨Т╨╛╨┤╨╕', 'ЁЯМК', 1000000, 1000000, NULL, '2026-07-20 06:08:03.786', '2026-07-20 06:08:03.786');
INSERT INTO public."Location" (id, name, emoji, "maxHp", "currentHp", "controllingClanId", "lastPayoutAt", "updatedAt") VALUES ('cmrstphap000klsuzg7684bbk', '╨в╨░╤Ф╨╝╨╜╤Ц ╨Ч╨╡╨╝╨╗╤Ц', 'ЁЯМ▓', 1000000, 1000000, NULL, '2026-07-20 06:08:03.793', '2026-07-20 06:08:03.793');
INSERT INTO public."Location" (id, name, emoji, "maxHp", "currentHp", "controllingClanId", "lastPayoutAt", "updatedAt") VALUES ('cmrstpha3000hlsuzjgbgtars', '╨Ч╨╡╨╝╨╗╤Ц ╨Т╨╛╨│╨╜╤О', 'ЁЯФе', 1000000, 885000, NULL, '2026-07-20 06:08:03.771', '2026-07-22 05:16:33.925');


--
-- Data for Name: PityCounter; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: QuestProgress; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmritp0zx000k0suzjsldfr8g', 'cmrd4qln9000h9guzejh1h2yj', 'win_1_arena', '2026-07-13', 1, true, '2026-07-13 06:10:41.046');
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmritph2j000n0suzp6cgb4la', 'cmrd4qln9000h9guzejh1h2yj', 'craft_1_card', '2026-07-13', 1, true, '2026-07-13 06:10:42.495');
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmritwphq000isouz0gtllvv1', 'cmrd4qln9000h9guzejh1h2yj', 'claim_3_cards', '2026-07-13', 3, true, '2026-07-13 06:48:30.684');
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmritp0zo000j0suzr1omp1h7', 'cmrd4qln9000h9guzejh1h2yj', 'fight_2_arena', '2026-07-13', 2, true, '2026-07-13 06:48:32.74');
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrk6j5vv000mf8uz25w6229p', 'cmrd4qln9000h9guzejh1h2yj', 'win_1_arena', '2026-07-14', 1, true, '2026-07-14 04:57:33.187');
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrk6ixxe000if8uzd8drjkhy', 'cmrd4qln9000h9guzejh1h2yj', 'claim_3_cards', '2026-07-14', 3, true, '2026-07-14 05:34:09.78');
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrk6j5vq000lf8uz6etquvia', 'cmrd4qln9000h9guzejh1h2yj', 'fight_2_arena', '2026-07-14', 2, true, '2026-07-14 05:34:10.944');
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrlwgmym000lf4uz0s2g1cwm', 'cmrd4qln9000h9guzejh1h2yj', 'fight_2_arena', '2026-07-15', 1, false, NULL);
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrlwgmyt000mf4uzqw5rnob5', 'cmrd4qln9000h9guzejh1h2yj', 'win_1_arena', '2026-07-15', 1, true, '2026-07-15 09:57:14.433');
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrlwg34a000if4uz52x7pa8u', 'cmrd4qln9000h9guzejh1h2yj', 'claim_3_cards', '2026-07-15', 2, false, NULL);
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrowivl3000ll4uzgg9irk5t', 'cmrd4qln9000h9guzejh1h2yj', 'fight_2_arena', '2026-07-17', 1, false, NULL);
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrowivlh000ml4uzn4mktdh3', 'cmrd4qln9000h9guzejh1h2yj', 'win_1_arena', '2026-07-17', 1, true, '2026-07-17 12:16:01.713');
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrowflcl000il4uz8it8lnfj', 'cmrd4qln9000h9guzejh1h2yj', 'claim_3_cards', '2026-07-17', 2, false, NULL);
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrq0k166000kskuz06iy641h', 'cmrd4qln9000h9guzejh1h2yj', 'fight_2_arena', '2026-07-18', 1, false, NULL);
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrq0k16d000lskuz39ekl266', 'cmrd4qln9000h9guzejh1h2yj', 'win_1_arena', '2026-07-18', 1, true, '2026-07-18 06:57:14.477');
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrq0jxrw000iskuzonwzt4ko', 'cmrd4qln9000h9guzejh1h2yj', 'claim_3_cards', '2026-07-18', 2, false, NULL);
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrssyzbx000lo0uzsimu1kp0', 'cmrd4qln9000h9guzejh1h2yj', 'fight_2_arena', '2026-07-20', 1, false, NULL);
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrssyzc2000mo0uz35f00ddr', 'cmrd4qln9000h9guzejh1h2yj', 'win_1_arena', '2026-07-20', 1, true, NULL);
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrssyvec000jo0uzmyvm81ao', 'cmrd4qln9000h9guzejh1h2yj', 'claim_3_cards', '2026-07-20', 3, true, NULL);
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrvmqu3b000kz4uzi38skxdw', 'cmrd4qln9000h9guzejh1h2yj', 'fight_2_arena', '2026-07-22', 1, false, NULL);
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmrvmqqof000iz4uzj07dhuuf', 'cmrd4qln9000h9guzejh1h2yj', 'claim_3_cards', '2026-07-22', 2, false, NULL);
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmryhoz81000ih8uz4a4b7fvr', 'cmrd4qln9000h9guzejh1h2yj', 'claim_3_cards', '2026-07-24', 1, false, NULL);
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmryhp1p3000kh8uz3tlidh28', 'cmrd4qln9000h9guzejh1h2yj', 'fight_2_arena', '2026-07-24', 1, false, NULL);
INSERT INTO public."QuestProgress" (id, "userId", "questId", "periodKey", progress, completed, "claimedAt") VALUES ('cmryhp1p9000lh8uzkaeqc4db', 'cmrd4qln9000h9guzejh1h2yj', 'win_1_arena', '2026-07-24', 1, true, '2026-07-24 05:19:17.23');


--
-- Data for Name: Referral; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: TradeListing; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: UserAchievement; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('e4d5e1cc-50ec-4aaf-b819-c7af8a20d39b', '46699632fba615b860a04470bf8ce8a921ab06097e2d9241d7544c7fe9d22a61', '2026-07-14 06:15:55.497032+00', '20260714061555_clan_level', NULL, NULL, '2026-07-14 06:15:55.486641+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('9345b583-5142-4231-b352-9bd527de51c3', 'a84e483bb11786d1d01496f8cdfd8b8a87d9cdcf1b0fe85780bcb67af92f4b80', '2026-07-09 06:13:26.695309+00', '20260709061326_init', NULL, NULL, '2026-07-09 06:13:26.305091+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('cf424528-64d2-4288-8a2b-474ab42f1044', '7fd44028e15df03de7c06c5bf66b331a248435d2fa12a297f04a77d1133f45d5', '2026-07-10 05:13:04.845763+00', '20260710051304_user_settings', NULL, NULL, '2026-07-10 05:13:04.831661+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ed390864-81b3-4e14-a9aa-60109ef4d7c7', 'de60f3ab530eba7797929dfdf732de5c3e585648c4d64ece6bfeded3a468415f', '2026-07-10 05:22:16.325207+00', '20260710052216_total_card_claims', NULL, NULL, '2026-07-10 05:22:16.314545+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('42e875d2-a54b-43fa-8124-3d040e378f2d', '3a0c8e490370acc938eaf5a8884a3b919de70b6ca474616f11b6382145439fab', '2026-07-17 12:10:45.859924+00', '20260717121045_bonus_milestones', NULL, NULL, '2026-07-17 12:10:45.75354+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('41a55dfe-b067-4649-884b-986aff3b807a', '427c0b6d354be5ff051165ec6e9aba28842bc1872adf0d0c67a8b10b50a1c50d', '2026-07-10 05:34:11.061216+00', '20260710053411_custom_nickname_flag', NULL, NULL, '2026-07-10 05:34:11.053551+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('115e7378-e449-4ef3-803c-405f48a69568', 'bb4645fd8eddc4673df1d9c856551808b54ac76d99e1ac1eec32d8f1409b1341', '2026-07-11 05:12:34.601669+00', '20260711051234_arena_system', NULL, NULL, '2026-07-11 05:12:34.589549+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('af5a090d-3c70-4fb5-80b8-6d865d4b6640', '2897629a4dd1f69fd83e9a52fd7519287703a90050465e2711ad601d5214f9ad', '2026-07-11 05:25:03.997535+00', '20260711052503_arena_teams', NULL, NULL, '2026-07-11 05:25:03.985892+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('c1f2640a-7203-45bc-8190-294d4b10f9ab', '6889cf9e1df37d0d3f5173d6c162b1b467f16dfd1568c0968d1d2446c27f1c1e', '2026-07-18 07:08:01.014302+00', '20260718070800_referrals', NULL, NULL, '2026-07-18 07:08:00.974456+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('f1c3b6d8-62bf-4432-bb8b-22fa2c8fad92', 'd1ae3e48bbf96b6b146efde7ae4ce770fc321d4fdaaee6d2da06a2237c4d0001', '2026-07-12 05:19:19.476555+00', '20260712051919_notification_flags', NULL, NULL, '2026-07-12 05:19:19.462189+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('46e7f68a-e307-46f0-9dd5-28fa2c2f39f4', '35b4703f8dde8603a02bff5aaf6e18dd80ba8065a9562dbb7aeb834c2be588da', '2026-07-13 06:01:37.518994+00', '20260713060137_quests', NULL, NULL, '2026-07-13 06:01:37.476174+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('6f028ad4-0283-4d22-94e9-cbaae9264328', '026c5588a2e527bcbd452f7f92dc2cd46d06483c23b1b2c90f2952dfde586ff1', '2026-07-13 06:22:11.716719+00', '20260713062211_shards_craft_attempts', NULL, NULL, '2026-07-13 06:22:11.704416+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('f7383207-0d7a-4782-a4af-4736bbb63901', '13764c952684a04526c2d11a730075436be73674e0a4f14b23ba1d87c7702313', '2026-07-20 05:52:23.068506+00', '20260720055223_raids_territories', NULL, NULL, '2026-07-20 05:52:23.026301+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('fcceea7b-3678-40cc-8672-1ee8016fc76c', '53de099657dab6652bedbfae74a2d8f3a4be15dab763cfae91813f458537a89a', '2026-07-14 05:24:18.574801+00', '20260714052418_craft_lock', NULL, NULL, '2026-07-14 05:24:18.563843+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('ddd53b40-7764-4a80-b305-89972fae64ff', '0dc0e112d9a5e958aad690a194884fda2e82629c7cece5182d2dc501a63aeee7', '2026-07-14 05:36:41.834676+00', '20260714053641_clan_max_members', NULL, NULL, '2026-07-14 05:36:41.825285+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('c8bbc971-2e9e-4fcc-b733-e6415fe58f4a', 'f10a57c89aca901a359f38401b3ef41c6eddb3c25fbab3fd708016cd98aae9da', '2026-07-14 05:48:04.466731+00', '20260714054804_clan_roles', NULL, NULL, '2026-07-14 05:48:04.415014+00', 1);
INSERT INTO public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) VALUES ('d17eaf10-91fe-45b5-a485-2a738bfbbe7a', '4db9889f7f6d5847b70bb6ea29f3a0a8467d2636f710d8f3b377f1a5c96131e3', '2026-07-14 06:03:35.772329+00', '20260714060335_starter_clans', NULL, NULL, '2026-07-14 06:03:35.762724+00', 1);


--
-- PostgreSQL database dump complete
--

\unrestrict Kuj7suZn1PW246ApqMYXUJPCbiyeDnUlyA26hPneXuwyeLkh7ozDdLoBzMFclbK


