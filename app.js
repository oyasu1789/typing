const CSV_PATHS = {
  normal: "oyajigari_words.csv",
  fire: "fire_prevention_typing_words.csv",
};

const GAME_MODES = {
  normal: { label: "通常モード" },
  fire: { label: "火災予防モード" },
};

const WORD_DATA_LIMITS = {
  csvCharacters: 1_000_000,
  csvBytes: 4_000_000,
  rows: 5_000,
  displayCharacters: 100,
  readingCharacters: 100,
};

const WORD_DIFFICULTIES = new Set(["easy", "normal", "hard"]);
const WORD_TYPES = new Set(["normal", "sentence", "strong", "guard", "buff", "special"]);
const WORD_READING_PATTERN = /^[ぁ-ゖァ-ヺー]+$/u;

const FIRE_PREVENTION_FALLBACK_CSV = window.FIRE_PREVENTION_WORDS_CSV || "";

const FALLBACK_WORDS_CSV = "id,display,reading,difficulty,type\n1,残業,ざんぎょう,easy,normal\n2,課長,かちょう,easy,normal\n3,始発,しはつ,easy,normal\n4,終電,しゅうでん,easy,normal\n5,会議,かいぎ,easy,normal\n6,部長,ぶちょう,easy,normal\n7,営業,えいぎょう,easy,normal\n8,退勤,たいきん,easy,normal\n9,出勤,しゅっきん,easy,normal\n10,名刺,めいし,easy,normal\n11,定時,ていじ,easy,normal\n12,深夜,しんや,easy,normal\n13,繁華街,はんかがい,easy,normal\n14,路地裏,ろじうら,easy,normal\n15,駅前,えきまえ,easy,normal\n16,改札,かいさつ,easy,normal\n17,通勤,つうきん,easy,normal\n18,疲労,ひろう,easy,normal\n19,財布,さいふ,easy,normal\n20,防御,ぼうぎょ,easy,guard\n21,反撃,はんげき,easy,strong\n22,連打,れんだ,easy,strong\n23,突進,とっしん,easy,strong\n24,不良,ふりょう,easy,normal\n25,乱入,らんにゅう,easy,strong\n26,逆襲,ぎゃくしゅう,easy,strong\n27,撃破,げきは,easy,strong\n28,気合,きあい,easy,normal\n29,勝負,しょうぶ,easy,normal\n30,闘魂,とうこん,easy,strong\n31,今日も働く,きょうもはたらく,normal,sentence\n32,社会をなめるな,しゃかいをなめるな,normal,sentence\n33,最近の若いもんは,さいきんのわかいもんは,normal,sentence\n34,まだまだ終われん,まだまだおわれん,normal,sentence\n35,終電を逃した,しゅうでんをのがした,normal,sentence\n36,育毛剤を買わねば,いくもうざいをかわねば,normal,sentence\n37,今日も残業確定,きょうもざんぎょうかくてい,normal,sentence\n38,ハゲを甘く見るな,はげをあまくみるな,normal,sentence\n39,これが昭和魂だ,これがしょうわだましいだ,normal,special\n40,部長が怒っている,ぶちょうがおこっている,normal,sentence\n41,課長代理クラッシュ,かちょうだいりくらっしゅ,normal,special\n42,深夜残業アッパー,しんやざんぎょうあっぱー,normal,special\n43,満員電車ラッシュ,まんいんでんしゃらっしゅ,normal,special\n44,育毛レーザー発射,いくもうれーざーはっしゃ,normal,special\n45,昭和魂タイピング乱舞,しょうわだましいたいぴんぐらんぶ,hard,special\n46,営業成績が危ない,えいぎょうせいせきがあぶない,normal,sentence\n47,始末書を書かされた,しまつしょをかかされた,normal,sentence\n48,部下がまた遅刻した,ぶかがまたちこくした,normal,sentence\n49,取引先へ向かう,とりひきさきへむかう,normal,sentence\n50,接待ゴルフは地獄だ,せったいごるふはじごくだ,normal,sentence\n51,会議資料を修正中,かいぎしりょうをしゅうせいちゅう,normal,sentence\n52,気合で乗り切る,きあいでのりきる,normal,strong\n53,社会人歴三十年,しゃかいじんれきさんじゅうねん,normal,sentence\n54,今月も赤字だ,こんげつもあかじだ,normal,sentence\n55,俺はまだ戦える,おれはまだたたかえる,normal,strong\n56,全力で反撃する,ぜんりょくではんげきする,normal,strong\n57,怒りの連続攻撃,いかりのれんぞくこうげき,normal,strong\n58,拳に魂を込めろ,こぶしにたましいをこめろ,normal,strong\n59,ネクタイを締め直す,ねくたいをしめなおす,normal,guard\n60,タイピング速度上昇,たいぴんぐそくどじょうしょう,normal,buff\n61,深夜二時の帰宅,しんやにじのきたく,normal,sentence\n62,取引先から電話だ,とりひきさきからでんわだ,normal,sentence\n63,プレゼン資料完成,ぷれぜんしりょうかんせい,normal,sentence\n64,給料日まであと三日,きゅうりょうびまであとみっか,normal,sentence\n65,財布の中身が危険,さいふのなかみがきけん,normal,sentence\n66,不良どもを返り討ち,ふりょうどもをかえりうち,hard,strong\n67,これでも元運動部だ,これでももとうんどうぶだ,hard,sentence\n68,通勤ラッシュをなめるな,つうきんらっしゅをなめるな,hard,sentence\n69,営業スマイル全開,えいぎょうすまいるぜんかい,hard,strong\n70,育毛剤が切れている,いくもうざいがきれている,hard,sentence\n71,おやじの本気を見せる,おやじのほんきをみせる,hard,strong\n72,怒涛のタイピング連打,どとうのたいぴんぐれんだ,hard,strong\n73,疲労限界突破,ひろうげんかいとっぱ,hard,strong\n74,今日も生き延びる,きょうもいきのびる,hard,sentence\n75,決戦のネオン街,けっせんのねおんがい,hard,sentence\n76,半グレリーダー登場,はんぐれりーだーとうじょう,hard,sentence\n77,裏社会のボス襲来,うらしゃかいのぼすしゅうらい,hard,sentence\n78,最後の戦いが始まる,さいごのたたかいがはじまる,hard,sentence\n79,絶対に負けられない,ぜったいにまけられない,hard,strong\n80,伝説のおやじ覚醒,でんせつのおやじかくせい,hard,special\n81,魂のキーボード連打,たましいのきーぼーどれんだ,hard,special\n82,怒りの育毛レーザー,いかりのいくもうれーざー,hard,special\n83,深夜残業地獄突き,しんやざんぎょうじごくづき,hard,special\n84,課長代理最終奥義,かちょうだいりさいしゅうおうぎ,hard,special\n85,満員電車超特急,まんいんでんしゃちょうとっきゅう,hard,special\n86,始発出勤無双乱舞,しはつしゅっきんむそうらんぶ,hard,special\n87,社会人魂爆裂拳,しゃかいじんだましいばくれつけん,hard,special\n88,深夜の公園で決着,しんやのこうえんでけっちゃく,hard,sentence\n89,おやじ狩りを許さない,おやじがりをゆるさない,hard,strong\n90,昭和生まれをなめるな,しょうわうまれをなめるな,hard,strong\n91,部長の説教三時間,ぶちょうのせっきょうさんじかん,hard,sentence\n92,終電ダッシュ開始,しゅうでんだっしゅかいし,hard,strong\n93,営業資料再提出,えいぎょうしりょうさいていしゅつ,hard,sentence\n94,ネオン街最終決戦,ねおんがいさいしゅうけっせん,hard,sentence\n95,気合と根性で突破,きあいとこんじょうでとっぱ,hard,strong\n96,拳で語るサラリーマン,こぶしでかたるさらりーまん,hard,strong\n97,今日も育毛剤を塗る,きょうもいくもうざいをぬる,hard,sentence\n98,社会人の怒りを知れ,しゃかいじんのいかりをしれ,hard,strong\n99,絶望からの大逆転,ぜつぼうからのだいぎゃくてん,hard,special\n100,これが俺たちのおやじ魂だ,これがおれたちのおやじだましいだ,hard,special\n";

const ENEMIES = [
  { name: "チンピラ高校生", stage: "駅前", hp: 90, threat: 0.42, asset: "enemy-1" },
  { name: "バイク不良", stage: "繁華街裏路地", hp: 110, threat: 0.55, asset: "enemy-2" },
  { name: "半グレリーダー", stage: "廃ビル前", hp: 130, threat: 0.7, asset: "enemy-3" },
  { name: "裏社会のボス", stage: "ネオン街決戦", hp: 160, threat: 0.86, asset: "enemy-4" },
];

const BATTLE_BACKGROUNDS = [
  { label: "深夜の路地裏", className: "bg-alley" },
  { label: "月夜の公園", className: "bg-park" },
  { label: "駅前広場", className: "bg-station" },
];

const DIFFICULTIES = {
  easy: { label: "易しい", hpRate: 0.82, threatRate: 0.76, playerHp: 115, time: 120, enemyInterval: 2000, maxReading: 5 },
  normal: { label: "普通", hpRate: 1, threatRate: 1, playerHp: 100, time: 99, enemyInterval: 1500, maxReading: 11 },
  hard: { label: "難しい", hpRate: 1.24, threatRate: 1.18, playerHp: 90, time: 82, enemyInterval: 1000, maxReading: Infinity },
};

const LINES = {
  start: ["最近の若いもんは...", "ハゲを甘く見るなよ...!"],
  combo: ["まだまだァ!", "社会をなめるな!", "定時で帰らせろ!"],
  special: ["これが昭和のキーボード力だァ!!", "課長代理クラァァッシュ!!"],
  win: ["今日も生き延びた...", "育毛剤代は稼がせてもらうぞ..."],
};

const KANA = {
  "あ": ["a"], "い": ["i"], "う": ["u"], "え": ["e"], "お": ["o"],
  "か": ["ka"], "き": ["ki"], "く": ["ku"], "け": ["ke"], "こ": ["ko"],
  "さ": ["sa"], "し": ["shi", "si"], "す": ["su"], "せ": ["se"], "そ": ["so"],
  "た": ["ta"], "ち": ["chi", "ti"], "つ": ["tsu", "tu"], "て": ["te"], "と": ["to"],
  "な": ["na"], "に": ["ni"], "ぬ": ["nu"], "ね": ["ne"], "の": ["no"],
  "は": ["ha"], "ひ": ["hi"], "ふ": ["fu", "hu"], "へ": ["he"], "ほ": ["ho"],
  "ま": ["ma"], "み": ["mi"], "む": ["mu"], "め": ["me"], "も": ["mo"],
  "や": ["ya"], "ゆ": ["yu"], "よ": ["yo"],
  "ら": ["ra"], "り": ["ri"], "る": ["ru"], "れ": ["re"], "ろ": ["ro"],
  "わ": ["wa"], "を": ["wo", "o"], "ん": ["n", "nn", "n'"],
  "が": ["ga"], "ぎ": ["gi"], "ぐ": ["gu"], "げ": ["ge"], "ご": ["go"],
  "ざ": ["za"], "じ": ["ji", "zi"], "ず": ["zu"], "ぜ": ["ze"], "ぞ": ["zo"],
  "だ": ["da"], "ぢ": ["ji", "di"], "づ": ["zu", "du"], "で": ["de"], "ど": ["do"],
  "ば": ["ba"], "び": ["bi"], "ぶ": ["bu"], "べ": ["be"], "ぼ": ["bo"],
  "ぱ": ["pa"], "ぴ": ["pi"], "ぷ": ["pu"], "ぺ": ["pe"], "ぽ": ["po"],
  "ぁ": ["xa", "la"], "ぃ": ["xi", "li"], "ぅ": ["xu", "lu"], "ぇ": ["xe", "le"], "ぉ": ["xo", "lo"],
  "ゃ": ["xya", "lya"], "ゅ": ["xyu", "lyu"], "ょ": ["xyo", "lyo"],
};

const DIGRAPHS = {
  "きゃ": ["kya"], "きゅ": ["kyu"], "きょ": ["kyo"],
  "しゃ": ["sha", "sya"], "しゅ": ["shu", "syu"], "しょ": ["sho", "syo"],
  "ちゃ": ["cha", "tya", "cya"], "ちゅ": ["chu", "tyu", "cyu"], "ちょ": ["cho", "tyo", "cyo"],
  "にゃ": ["nya"], "にゅ": ["nyu"], "にょ": ["nyo"],
  "ひゃ": ["hya"], "ひゅ": ["hyu"], "ひょ": ["hyo"],
  "みゃ": ["mya"], "みゅ": ["myu"], "みょ": ["myo"],
  "りゃ": ["rya"], "りゅ": ["ryu"], "りょ": ["ryo"],
  "ぎゃ": ["gya"], "ぎゅ": ["gyu"], "ぎょ": ["gyo"],
  "じゃ": ["ja", "jya", "zya"], "じゅ": ["ju", "jyu", "zyu"], "じょ": ["jo", "jyo", "zyo"],
  "ぢゃ": ["ja", "dya"], "ぢゅ": ["ju", "dyu"], "ぢょ": ["jo", "dyo"],
  "びゃ": ["bya"], "びゅ": ["byu"], "びょ": ["byo"],
  "ぴゃ": ["pya"], "ぴゅ": ["pyu"], "ぴょ": ["pyo"],
  "ふぁ": ["fa", "fwa"], "ふぃ": ["fi", "fwi"], "ふぇ": ["fe", "fwe"], "ふぉ": ["fo", "fwo"],
};

const TYPE_DAMAGE = {
  normal: 12,
  sentence: 16,
  strong: 22,
  guard: 10,
  buff: 8,
  special: 30,
};

const FIRE_PREVENTION_TIME_BONUS = {
  minimumCharacters: 10,
  seconds: 5,
};

const ATTACK_MOTIONS = ["punch", "punch-alt", "kick", "kick-alt"];

const $ = (id) => document.getElementById(id);

function earnsFirePreventionTimeBonus(mode, word, typedCharacters, missed) {
  return mode === "fire"
    && word.type === "sentence"
    && typedCharacters > FIRE_PREVENTION_TIME_BONUS.minimumCharacters
    && !missed;
}

class TypingManager {
  constructor(onSuccess, onMiss, onCorrectInput, onCharacterComplete) {
    this.onSuccess = onSuccess;
    this.onMiss = onMiss;
    this.onCorrectInput = onCorrectInput;
    this.onCharacterComplete = onCharacterComplete;
    this.current = null;
    this.input = "";
    this.lastKeyTime = 0;
    this.completedChars = 0;
  }

  setWord(word) {
    this.current = {
      ...word,
      romaji: buildRomajiCandidates(word.reading),
      romajiProgress: buildRomajiProgress(word.reading),
    };
    this.input = "";
    this.lastKeyTime = performance.now();
    this.completedChars = 0;
    UIManager.renderWord(this.current, this.input);
  }

  handleKey(key) {
    if (!this.current || key.length !== 1) return;
    const char = key.toLowerCase();
    if (!/^[a-z'-]$/.test(char)) return;

    const next = this.input + char;
    const matches = this.current.romaji.filter((candidate) => candidate.startsWith(next));
    if (!matches.length) {
      this.onMiss();
      UIManager.renderWord(this.current, this.input);
      return;
    }

    this.input = next;
    UIManager.renderWord(this.current, this.input);
    this.onCorrectInput();

    const completed = this.completedCharacterCount();
    const complete = matches.some((candidate) => candidate === this.input);
    const now = performance.now();
    const elapsed = Math.max(180, now - this.lastKeyTime);

    if (completed > this.completedChars) {
      for (let index = this.completedChars + 1; index <= completed; index += 1) {
        const characterSpeed = index / (elapsed / 1000);
        this.onCharacterComplete(this.current, characterSpeed, index, this.current.romajiProgress.length, complete && index === completed);
      }
      this.completedChars = completed;
    }

    if (complete) {
      const speed = this.current.reading.length / (elapsed / 1000);
      this.onSuccess(this.current, speed, this.input.length);
      this.lastKeyTime = now;
    }
  }

  completedCharacterCount() {
    if (!this.current) return 0;
    for (let index = this.current.romajiProgress.length - 1; index >= 0; index -= 1) {
      if (this.current.romajiProgress[index].some((candidate) => this.input.startsWith(candidate))) {
        return index + 1;
      }
    }
    return 0;
  }

  bestCandidate() {
    if (!this.current) return "";
    const prefixed = this.current.romaji
      .filter((candidate) => candidate.startsWith(this.input))
      .sort((a, b) => a.length - b.length);
    return prefixed[0] || this.current.romaji[0] || "";
  }
}

class BattleManager {
  constructor() {
    this.difficulty = "normal";
    this.reset();
  }

  reset(difficulty = this.difficulty) {
    this.difficulty = difficulty;
    const setting = DIFFICULTIES[this.difficulty];
    this.enemyIndex = 0;
    this.playerHp = setting.playerHp;
    this.playerMaxHp = setting.playerHp;
    this.special = 0;
    this.score = 0;
    this.combo = 0;
    this.typedCount = 0;
    this.missCount = 0;
    this.defeatedCount = 0;
    this.maxCombo = 0;
    this.highScore = getSavedNumber("oyajigariHighScore");
    this.enemy = this.createEnemy(0);
    this.wordAttack = null;
  }

  createEnemy(index) {
    const setting = DIFFICULTIES[this.difficulty];
    const base = ENEMIES[index];
    const hp = Math.round(base.hp * setting.hpRate);
    return {
      ...base,
      hp,
      threat: clamp(base.threat * setting.threatRate, 0, 1),
      currentHp: hp,
    };
  }

  calculateDamage(word, speed, includeSpeed = true, includeCombo = true) {
    const speedBonus = Math.min(16, Math.floor(speed * 1.2));
    const comboBonus = includeCombo ? Math.min(18, Math.floor(this.combo / 3)) : 0;
    const base = TYPE_DAMAGE[word.type] || TYPE_DAMAGE.normal;
    let damage = base + comboBonus;
    if (includeSpeed) damage += speedBonus;
    if (word.type === "special" && this.special >= 60) damage += 34;
    return damage;
  }

  hitCharacter(word, speed, completedChars, totalChars, finalCharacter) {
    if (!this.wordAttack || this.wordAttack.word !== word) {
      this.wordAttack = {
        word,
        appliedDamage: 0,
        plannedDamage: this.calculateDamage(word, 0, false, false),
      };
    }

    const totalDamage = finalCharacter
      ? this.calculateDamage(word, speed, true)
      : this.wordAttack.plannedDamage;
    const targetDamage = finalCharacter
      ? totalDamage
      : totalDamage * (completedChars / totalChars);
    const damage = Math.max(0, targetDamage - this.wordAttack.appliedDamage);
    this.wordAttack.appliedDamage += damage;

    this.enemy.currentHp = clamp(this.enemy.currentHp - damage, 0, this.enemy.hp);
    this.score += damage * 10;
    UIManager.attack(word.type, damage, this.combo);

    if (!finalCharacter) return;

    if (word.type === "guard") {
      this.playerHp = clamp(this.playerHp + 8, 0, this.playerMaxHp);
    }
    if (word.type === "buff") {
      this.special = clamp(this.special + 24, 0, 100);
    }
    if (word.type === "special" && this.special >= 60) {
      this.special = clamp(this.special - 60, 0, 100);
      UIManager.say(randomFrom(LINES.special));
      UIManager.specialFlash();
    } else {
      this.special = clamp(this.special + 10 + Math.floor(speed), 0, 100);
    }

    this.combo += 1;
    this.typedCount += 1;
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.score += this.combo * 35;

    if (this.combo > 1 && this.combo % 4 === 0) UIManager.say(randomFrom(LINES.combo));
    this.wordAttack = null;

    if (this.enemy.currentHp <= 0) {
      this.nextEnemy();
    }
  }

  miss() {
    this.combo = 0;
    this.missCount += 1;
    this.playerHp = clamp(this.playerHp - 5, 0, this.playerMaxHp);
    UIManager.miss();
  }

  enemyAttack() {
    const damage = Math.ceil(5 + this.enemy.threat * 8);
    this.combo = 0;
    this.playerHp = clamp(this.playerHp - damage, 0, this.playerMaxHp);
    UIManager.enemyAttack();
  }

  nextEnemy() {
    UIManager.koEnemy();
    this.defeatedCount += 1;
    this.enemyIndex += 1;
    if (this.enemyIndex >= ENEMIES.length) {
      GameManager.finish(true);
      return;
    }
    setTimeout(() => {
      this.enemy = this.createEnemy(this.enemyIndex);
      UIManager.renderBattle(this);
      UIManager.resetEnemyPose();
      UIManager.showCutIn(`${this.enemy.name}が現れた！`);
    }, 950);
  }

  persist() {
    this.score = Math.round(this.score);
    this.highScore = Math.max(this.highScore, this.score);
    setSavedValue("oyajigariHighScore", String(this.highScore));
    setSavedValue("oyajigariMaxCombo", String(Math.max(getSavedNumber("oyajigariMaxCombo"), this.maxCombo)));
  }
}

class UIManager {
  static init() {
    this.nodes = {
      arena: $("arena"),
      player: $("player"),
      enemy: $("enemy"),
      title: $("titleScreen"),
      titleResult: $("titleResult"),
      result: $("resultScreen"),
      resultHeading: $("resultHeading"),
      resultSummary: $("resultSummary"),
      resultStats: $("resultStats"),
      cutIn: $("cutIn"),
      flash: $("screenFlash"),
      hit: $("hitEffect"),
      combo: $("combo"),
      speech: $("speech"),
    };
    this.lastPlayerAttackMotion = null;
    this.lastEnemyAttackMotion = null;
    this.attackTimers = new WeakMap();
  }

  static renderBattle(battle) {
    $("playerHp").style.width = `${(battle.playerHp / battle.playerMaxHp) * 100}%`;
    $("playerHpText").textContent = Math.ceil(battle.playerHp);
    $("enemyHp").style.width = `${(battle.enemy.currentHp / battle.enemy.hp) * 100}%`;
    $("enemyHpText").textContent = Math.ceil(battle.enemy.currentHp);
    $("specialGauge").style.width = `${battle.special}%`;
    $("enemyThreat").style.width = `${battle.enemy.threat * 100}%`;
    $("enemyName").textContent = battle.enemy.name;
    $("stageName").textContent = battle.background?.label || battle.enemy.stage;
    $("score").textContent = Math.round(battle.score);
    $("maxCombo").textContent = battle.maxCombo;
    $("highScore").textContent = battle.highScore;
    this.nodes.combo.textContent = `${battle.combo} COMBO`;
    this.nodes.combo.classList.toggle("on", battle.combo > 1);
    this.nodes.player.classList.toggle("anger", battle.special >= 60);
    this.setEnemyAsset(battle.enemy.asset);
  }

  static renderWord(word, input) {
    const best = GameManager.typing.bestCandidate();
    $("displayWord").textContent = word.display;
    $("reading").textContent = word.reading;
    $("wordType").textContent = word.type;
    $("difficulty").textContent = word.difficulty;
    $("typedText").textContent = input;
    $("remainingText").textContent = best.slice(input.length);
  }

  static attack(type, damage, combo) {
    const attackMotion = type === "guard" ? "guard" : randomAttackMotion(this.lastPlayerAttackMotion);
    if (attackMotion !== "guard") this.lastPlayerAttackMotion = attackMotion;
    this.playAttack(this.nodes.player, attackMotion);
    this.restartClass(this.nodes.enemy, "hit");
    this.restartClass(this.nodes.arena, "shake");
    const damageText = formatDamage(damage);
    this.nodes.hit.textContent = type === "special" ? `${damageText} SPECIAL` : `${damageText} HIT`;
    this.restartClass(this.nodes.hit, "on");
  }

  static miss() {
    $("statusLine").textContent = "MISS - コンボが途切れた";
    const motion = randomAttackMotion(this.lastEnemyAttackMotion);
    this.lastEnemyAttackMotion = motion;
    this.playAttack(this.nodes.enemy, motion);
    this.restartClass(this.nodes.player, "hit");
    this.restartClass(this.nodes.arena, "shake");
  }

  static enemyAttack() {
    $("statusLine").textContent = "敵の攻撃を受けた";
    const motion = randomAttackMotion(this.lastEnemyAttackMotion);
    this.lastEnemyAttackMotion = motion;
    this.playAttack(this.nodes.enemy, motion);
    this.restartClass(this.nodes.player, "hit");
    this.restartClass(this.nodes.arena, "shake");
  }

  static specialFlash() {
    this.restartClass(this.nodes.flash, "on");
  }

  static koEnemy() {
    this.clearAttack(this.nodes.enemy);
    this.nodes.enemy.classList.add("ko");
    this.say(randomFrom(LINES.win));
  }

  static koPlayer() {
    this.clearAttack(this.nodes.player);
    this.nodes.player.classList.add("ko");
  }

  static resetPlayerPose() {
    this.nodes.player.className = "fighter player idle";
  }

  static resetEnemyPose() {
    this.nodes.enemy.className = "fighter enemy idle";
    this.setEnemyAsset(GameManager.battle.enemy.asset);
  }

  static resetAttackHistory() {
    this.lastPlayerAttackMotion = null;
    this.lastEnemyAttackMotion = null;
  }

  static setEnemyAsset(asset) {
    this.nodes.enemy.classList.remove("enemy-1", "enemy-2", "enemy-3", "enemy-4");
    this.nodes.enemy.classList.add(asset);
  }

  static setArenaBackground(background) {
    this.nodes.arena.classList.remove(...BATTLE_BACKGROUNDS.map((item) => item.className));
    this.nodes.arena.classList.add(background.className);
  }

  static showTitle(message) {
    this.nodes.titleResult.textContent = message;
    this.nodes.title.classList.remove("hidden");
  }

  static hideTitle() {
    this.nodes.title.classList.add("hidden");
  }

  static showResults(battle, won, difficultyLabel, timeLeft) {
    const attempts = battle.typedCount + battle.missCount;
    const accuracy = attempts ? Math.round((battle.typedCount / attempts) * 100) : 100;
    this.nodes.resultHeading.textContent = won ? "CLEAR" : "GAME OVER";
    this.nodes.resultSummary.textContent = `${difficultyLabel} / 残り${Math.max(0, timeLeft)}秒`;
    $("resultScore").textContent = Math.round(battle.score);
    $("resultCombo").textContent = battle.maxCombo;
    $("resultDefeated").textContent = `${battle.defeatedCount}/${ENEMIES.length}`;
    $("resultAccuracy").textContent = `${accuracy}%`;
    this.nodes.result.classList.remove("hidden");
  }

  static hideResults() {
    this.nodes.result.classList.add("hidden");
  }

  static showCutIn(text) {
    this.nodes.cutIn.textContent = text;
    this.restartClass(this.nodes.cutIn, "on", 1350);
  }

  static say(line) {
    this.nodes.speech.textContent = line;
  }

  static playAttack(node, motion, duration = 260) {
    clearTimeout(this.attackTimers.get(node));
    this.clearAttack(node);
    void node.offsetWidth;
    node.classList.add("attack", motion);
    const timer = setTimeout(() => {
      node.classList.remove("attack", "guard", ...ATTACK_MOTIONS);
      this.attackTimers.delete(node);
    }, duration);
    this.attackTimers.set(node, timer);
  }

  static clearAttack(node) {
    clearTimeout(this.attackTimers.get(node));
    node.classList.remove("attack", "guard", ...ATTACK_MOTIONS);
    this.attackTimers.delete(node);
  }

  static restartClass(node, className, duration = 260) {
    node.classList.remove(...className.split(" "));
    void node.offsetWidth;
    node.classList.add(...className.split(" "));
    setTimeout(() => node.classList.remove(...className.split(" ")), duration);
  }
}

class GameManager {
  static async boot() {
    UIManager.init();
    this.battle = new BattleManager();
    this.typing = new TypingManager(
      (word, speed, typedCharacters) => this.handleSuccess(word, speed, typedCharacters),
      () => this.handleMiss(),
      () => this.handleCorrectInput(),
      (word, speed, completedChars, totalChars, finalCharacter) => this.handleCharacterComplete(word, speed, completedChars, totalChars, finalCharacter),
    );
    const [normalWords, fireWords] = await Promise.all([
      loadWords(CSV_PATHS.normal, FALLBACK_WORDS_CSV),
      loadWords(CSV_PATHS.fire, FIRE_PREVENTION_FALLBACK_CSV),
    ]);
    this.wordsByMode = { normal: normalWords, fire: fireWords };
    this.selectedMode = "normal";
    this.words = this.wordsByMode[this.selectedMode];
    this.running = false;
    this.timeLeft = 99;
    this.enemyTimer = null;
    this.clockTimer = null;
    this.selectedDifficulty = "normal";
    this.currentBackground = null;
    this.currentWordMissed = false;

    document.querySelectorAll("[data-difficulty]").forEach((button) => {
      button.addEventListener("click", () => this.start(button.dataset.difficulty));
    });
    document.querySelectorAll("[data-game-mode]").forEach((button) => {
      button.addEventListener("click", () => this.selectMode(button.dataset.gameMode));
    });
    $("startButton").addEventListener("click", () => UIManager.showTitle("難易度を選んで再挑戦"));
    $("backToTopButton").addEventListener("click", () => {
      UIManager.hideResults();
      UIManager.resetPlayerPose();
      UIManager.resetEnemyPose();
      UIManager.showTitle("難易度を選んで開始");
    });
    $("retryButton").addEventListener("click", () => {
      UIManager.hideResults();
      this.start(this.selectedDifficulty);
    });
    document.addEventListener("keydown", (event) => this.handleKey(event));

    UIManager.renderBattle(this.battle);
    $("statusLine").textContent = `${this.words.length}語を${this.words.source}から読み込みました`;
    this.nextWord();
    UIManager.hideResults();
    UIManager.showTitle("難易度を選んで開始");
  }

  static start(difficulty = this.selectedDifficulty) {
    this.selectedDifficulty = difficulty;
    this.words = this.wordsByMode[this.selectedMode];
    if (!this.words.length) {
      UIManager.showTitle(`${GAME_MODES[this.selectedMode].label}のCSVを読み込めませんでした`);
      return;
    }
    const setting = DIFFICULTIES[this.selectedDifficulty];
    this.battle.reset(this.selectedDifficulty);
    this.currentBackground = this.pickBackground();
    this.battle.background = this.currentBackground;
    this.running = true;
    this.timeLeft = setting.time;
    $("timer").textContent = this.timeLeft;
    $("startButton").classList.add("hidden");
    $("statusLine").textContent = `${GAME_MODES[this.selectedMode].label} / ${setting.label} - タイプして攻撃`;
    UIManager.hideTitle();
    UIManager.hideResults();
    UIManager.say(randomFrom(LINES.start));
    UIManager.resetPlayerPose();
    UIManager.resetEnemyPose();
    UIManager.resetAttackHistory();
    UIManager.setArenaBackground(this.currentBackground);
    UIManager.renderBattle(this.battle);
    UIManager.showCutIn(`${this.battle.enemy.name}が現れた！`);
    this.nextWord();

    clearTimeout(this.enemyTimer);
    clearInterval(this.clockTimer);
    this.scheduleEnemyAttack();
    this.clockTimer = setInterval(() => {
      if (!this.running) return;
      this.timeLeft -= 1;
      $("timer").textContent = this.timeLeft;
      if (this.timeLeft <= 0) this.finish(false);
    }, 1000);
  }

  static handleKey(event) {
    if (event.key === "Enter" && !this.running) {
      UIManager.showTitle("難易度を選んで開始");
      return;
    }
    if (!this.running) return;
    this.typing.handleKey(event.key);
  }

  static selectMode(mode) {
    if (!GAME_MODES[mode]) return;
    this.selectedMode = mode;
    this.words = this.wordsByMode[mode];
    document.querySelectorAll("[data-game-mode]").forEach((button) => {
      const selected = button.dataset.gameMode === mode;
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    UIManager.showTitle(`${GAME_MODES[mode].label}を選択中 / ${this.words.length}語`);
  }

  static handleCorrectInput() {
    this.scheduleEnemyAttack();
  }

  static scheduleEnemyAttack() {
    clearTimeout(this.enemyTimer);
    if (!this.running) return;
    const setting = DIFFICULTIES[this.selectedDifficulty];
    this.enemyTimer = setTimeout(() => {
      if (!this.running) return;
      this.battle.enemyAttack();
      UIManager.renderBattle(this.battle);
      this.checkLose();
      this.scheduleEnemyAttack();
    }, setting.enemyInterval);
  }

  static handleCharacterComplete(word, speed, completedChars, totalChars, finalCharacter) {
    this.battle.hitCharacter(word, speed, completedChars, totalChars, finalCharacter);
    UIManager.renderBattle(this.battle);
    this.checkLose();
  }

  static handleSuccess(word, speed, typedCharacters) {
    UIManager.renderBattle(this.battle);
    const earnedTimeBonus = earnsFirePreventionTimeBonus(
      this.selectedMode,
      word,
      typedCharacters,
      this.currentWordMissed,
    );
    if (earnedTimeBonus) {
      this.timeLeft += FIRE_PREVENTION_TIME_BONUS.seconds;
      $("timer").textContent = this.timeLeft;
    }
    $("statusLine").textContent = earnedTimeBonus
      ? `${speed.toFixed(1)} kana/sec / ノーミス +${FIRE_PREVENTION_TIME_BONUS.seconds}秒`
      : `${speed.toFixed(1)} kana/sec`;
    this.checkLose();
    if (this.running) this.nextWord();
  }

  static handleMiss() {
    this.currentWordMissed = true;
    this.battle.miss();
    UIManager.renderBattle(this.battle);
    this.checkLose();
  }

  static nextWord() {
    this.currentWordMissed = false;
    const setting = DIFFICULTIES[this.selectedDifficulty];
    let pool = this.words.filter((word) => {
      if (this.selectedDifficulty === "easy") return word.difficulty === "easy" || word.difficulty === "normal";
      if (this.selectedDifficulty === "normal") {
        if (this.battle.enemyIndex === 0) return word.difficulty === "easy";
        if (this.battle.enemyIndex === 1) return word.difficulty !== "hard";
      }
      return true;
    });
    const shortPool = pool.filter((word) => word.reading.length <= setting.maxReading);
    if (shortPool.length >= 6) pool = shortPool;
    if (this.selectedDifficulty === "easy") {
      pool = [...pool].sort((a, b) => a.reading.length - b.reading.length).slice(0, Math.max(12, Math.ceil(pool.length * 0.55)));
    }
    const specials = pool.filter((word) => word.type === "special");
    const normals = pool.filter((word) => word.type !== "special");
    const source = this.battle.special >= 60 && Math.random() < 0.34 ? specials : normals;
    this.typing.setWord(this.pickNextWord(source.length ? source : pool));
  }

  static pickNextWord(pool) {
    const current = this.typing.current;
    const choices = current && pool.length > 1
      ? pool.filter((word) => word.id !== current.id)
      : pool;
    return randomFrom(choices.length ? choices : pool);
  }

  static pickBackground() {
    const choices = this.currentBackground
      ? BATTLE_BACKGROUNDS.filter((background) => background.className !== this.currentBackground.className)
      : BATTLE_BACKGROUNDS;
    return randomFrom(choices);
  }

  static checkLose() {
    if (this.battle.playerHp <= 0) this.finish(false);
  }

  static finish(won) {
    if (!this.running) return;
    this.running = false;
    clearTimeout(this.enemyTimer);
    clearInterval(this.clockTimer);
    this.battle.persist();
    UIManager.specialFlash();
    if (won) {
      UIManager.koEnemy();
    } else {
      UIManager.koPlayer();
    }
    UIManager.showCutIn("KO!!");
    UIManager.renderBattle(this.battle);
    $("startButton").textContent = "RESTART";
    $("startButton").classList.add("hidden");
    $("statusLine").textContent = won ? "CLEAR - おやじの勝利" : "GAME OVER";
    if (won) UIManager.say(randomFrom(LINES.win));
    setTimeout(() => {
      UIManager.showResults(this.battle, won, `${GAME_MODES[this.selectedMode].label} / ${DIFFICULTIES[this.selectedDifficulty].label}`, this.timeLeft);
    }, 1100);
  }
}

async function loadWords(path, fallbackText = "") {
  let text = fallbackText;
  let source = fallbackText ? "同梱データ" : path;

  if (location.protocol !== "file:") {
    try {
      const response = await fetch(path, { cache: "no-store" });
      if (!response.ok) throw new Error(`CSV load failed: ${response.status}`);
      text = await readResponseText(response);
      source = path;
    } catch (error) {
      console.warn(`${path} load failed.`, error);
    }
  }

  if (!text) {
    const words = [];
    words.source = source;
    return words;
  }

  if (text.length > WORD_DATA_LIMITS.csvCharacters) {
    throw new Error(`${source} exceeds the CSV size limit`);
  }

  const words = parseCsv(text)
    .map(normalizeWord)
    .filter(Boolean);
  words.source = source;
  return words;
}

async function readResponseText(response) {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > WORD_DATA_LIMITS.csvBytes) {
    throw new Error("CSV response is too large");
  }
  if (!response.body?.getReader) {
    const text = await response.text();
    if (text.length > WORD_DATA_LIMITS.csvCharacters) throw new Error("CSV response is too large");
    return text;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let text = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    receivedBytes += value.byteLength;
    if (receivedBytes > WORD_DATA_LIMITS.csvBytes) {
      await reader.cancel();
      throw new Error("CSV response is too large");
    }
    text += decoder.decode(value, { stream: true });
    if (text.length > WORD_DATA_LIMITS.csvCharacters) {
      await reader.cancel();
      throw new Error("CSV response is too large");
    }
  }
  return text + decoder.decode();
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const clean = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    const next = clean[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      if (rows.length > WORD_DATA_LIMITS.rows + 1) {
        throw new Error("CSV has too many rows");
      }
    } else {
      cell += char;
    }
  }
  if (quoted) throw new Error("CSV contains an unterminated quoted field");
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  if (rows.length > WORD_DATA_LIMITS.rows + 1) throw new Error("CSV has too many rows");

  const headers = rows.shift();
  const requiredHeaders = ["id", "display", "reading", "difficulty", "type"];
  if (!headers || requiredHeaders.some((header) => !headers.includes(header))) {
    throw new Error("CSV is missing required headers");
  }
  return rows
    .filter((items) => items.length === headers.length)
    .map((items) => Object.fromEntries(headers.map((header, index) => [header, items[index]])));
}

function normalizeWord(row) {
  const id = Number(row.id);
  const display = row.display.trim();
  const reading = row.reading.trim();
  if (!Number.isSafeInteger(id) || id < 1) return null;
  if (!display || Array.from(display).length > WORD_DATA_LIMITS.displayCharacters) return null;
  if (!reading || Array.from(reading).length > WORD_DATA_LIMITS.readingCharacters) return null;
  if (!WORD_READING_PATTERN.test(reading)) return null;
  if (!WORD_DIFFICULTIES.has(row.difficulty) || !WORD_TYPES.has(row.type)) return null;
  return { id, display, reading, difficulty: row.difficulty, type: row.type };
}

function buildRomajiCandidates(reading) {
  let candidates = [""];
  const kana = toHiragana(reading);

  for (let i = 0; i < kana.length; i += 1) {
    const char = kana[i];
    const pair = kana.slice(i, i + 2);
    let parts = [];

    if (char === "っ") {
      const nextParts = DIGRAPHS[kana.slice(i + 1, i + 3)] || KANA[kana[i + 1]] || [""];
      parts = unique(nextParts.map((part) => (part[0] ? part[0] : "")));
    } else if (char === "ー") {
      parts = unique(candidates.map((candidate) => lastVowel(candidate) || "-"));
      parts.push("-");
    } else if (char === "ん") {
      parts = romajiForN(kana, i);
    } else if (DIGRAPHS[pair]) {
      parts = DIGRAPHS[pair];
      i += 1;
    } else {
      parts = KANA[char] || [char];
    }

    candidates = combine(candidates, unique(parts));
  }

  return unique(candidates).sort((a, b) => a.length - b.length);
}

function buildRomajiProgress(reading) {
  const units = splitKanaUnits(reading);
  return Array.from({ length: units.length }, (_, index) => buildRomajiCandidates(units.slice(0, index + 1).join("")));
}

function splitKanaUnits(reading) {
  const kana = toHiragana(reading);
  const units = [];
  for (let index = 0; index < kana.length; index += 1) {
    const pair = kana.slice(index, index + 2);
    if (DIGRAPHS[pair]) {
      units.push(pair);
      index += 1;
    } else {
      units.push(kana[index]);
    }
  }
  return units;
}

function romajiForN(kana, index) {
  const nextParts = DIGRAPHS[kana.slice(index + 1, index + 3)] || KANA[kana[index + 1]] || [];
  if (!nextParts.length) return ["nn"];

  const needsDoubleN = nextParts.some((part) => /^[aiueoyn]/.test(part));
  return needsDoubleN ? ["nn", "n'"] : ["n", "nn", "n'"];
}

function combine(prefixes, suffixes) {
  const out = [];
  for (const prefix of prefixes) {
    for (const suffix of suffixes) {
      out.push(prefix + suffix);
    }
  }
  return unique(out).slice(0, 5000);
}

function toHiragana(value) {
  return value.replace(/[ァ-ン]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0x60));
}

function lastVowel(value) {
  const match = value.match(/[aiueo](?!.*[aiueo])/);
  return match ? match[0] : "";
}

function unique(items) {
  return [...new Set(items)];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function randomFrom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomAttackMotion(previous = null) {
  const choices = ATTACK_MOTIONS.filter((motion) => motion !== previous);
  return randomFrom(choices);
}

function formatDamage(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function getSavedNumber(key) {
  try {
    const value = Number(localStorage.getItem(key) || 0);
    return Number.isFinite(value) && value >= 0
      ? Math.min(Math.floor(value), Number.MAX_SAFE_INTEGER)
      : 0;
  } catch (error) {
    return 0;
  }
}

function setSavedValue(key, value) {
  try {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue < 0) return;
    localStorage.setItem(key, String(Math.min(Math.floor(numericValue), Number.MAX_SAFE_INTEGER)));
  } catch (error) {
    console.warn("Score save skipped.", error);
  }
}

window.addEventListener("DOMContentLoaded", () => {
  GameManager.boot().catch((error) => {
    console.error(error);
    $("statusLine").textContent = "単語データの読み込みに失敗しました。CSVを確認してください。";
  });
});
