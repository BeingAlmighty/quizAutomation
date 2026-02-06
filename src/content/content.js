console.log("✅ Content script loaded on:", location.href);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SOLVE_NOW") {
    console.log("Solve trigger received");
    runSolveFlow();
  }
});

(async function main() {
  const mode = await getMode();
  if (!mode) return;

  if (isReviewPage()) {
    if (mode === "LEARN") {
      waitForFullRenderAndScrape();
    }
    return;
  }
  if (clickFinish()) return;
  if (clickContinue()) return;
  if (mode === "LEARN") {
    handleSubmitRandom();
  }
  if(mode === "SIMPLE_LEARN"){
    solveFullPage();
  }

  if (mode === "SOLVE") {
    handleSubmitFromStorage();
  }
})();

async function solveCurrentQuestion() {
  const submit = document.querySelector("input[value='Submit']");
  if (!submit) return;

  const questionEl = document.querySelector(".question");
  if (!questionEl) return;

  const questionText = questionEl.innerText.trim();
  console.log("❓ Current question:", questionText);

  const stored = await getStoredResults();
  const match = stored.find(
    q => q.question.trim() === questionText
  );

  if (!match) {
    console.warn("❌ No stored answer found for this question");
    return;
  }

  console.log("✅ Matching answer found:", match.correctAnswers);

  document.querySelectorAll(".answer").forEach(ans => {
    const text =
      ans.querySelector("div:last-child")?.innerText.trim();

    if (match.correctAnswers.includes(text)) {
      ans.querySelector("input")?.click();
      console.log("☑️ Selected:", text);
    }
  });

  setTimeout(() => {
    console.log("📤 Submit clicked");
    submit.click();
  }, 600);
}


async function runSolveFlow() {
  console.log("▶️ Running solve flow on:", location.href);

  if (isReviewPage()) return;

  if (clickFinish()) return;
  if (clickContinue()) return;

  await solveCurrentQuestion();
}




/* ---------- MODE ---------- */

function getMode() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_MODE" }, res =>
      resolve(res?.mode)
    );
  });
}

/* ---------- PAGE TYPES ---------- */

function isReviewPage() {
  return location.pathname.includes("/review");
}

/* ---------- BUTTONS ---------- */

function clickFinish() {
  const btn = document.querySelector("input[value='Finish']");
  if (!btn) return false;
  setTimeout(() => btn.click(), 600);
  return true;
}

function clickContinue() {
  const btn = document.querySelector("input[value='Continue']");
  if (!btn) return false;
  setTimeout(() => btn.click(), 600);
  return true;
}

/* ---------- LEARN MODE ---------- */

function handleSubmitRandom() {
  const submit = document.querySelector("input[value='Submit']");
  if (!submit) return false;

  selectRandomAnswers();
  setTimeout(() => submit.click(), 600);
  return true;
}

function selectRandomAnswers() {
  const radios = document.querySelectorAll("input[type=radio]");
  const checkboxes = document.querySelectorAll("input[type=checkbox]");

  if (radios.length) {
    radios[Math.floor(Math.random() * radios.length)].click();
  }

  if (checkboxes.length) {
    [...checkboxes]
      .filter(() => Math.random() > 0.5)
      .forEach(cb => cb.click());
  }
}
function solveFullPage(){
  const questions = document.querySelectorAll('.question');

  questions.forEach(question => {
    const radios = question.querySelectorAll('input[type="radio"]');
    const checkboxes = question.querySelectorAll('input[type="checkbox"]');

    if (radios.length > 0) {
      const randomRadio = radios[Math.floor(Math.random() * radios.length)];
      randomRadio.click();
    }

    if (checkboxes.length > 0) {
      [...checkboxes]
      .filter(() => Math.random() > 0.5)
      .forEach(cb => cb.click());
    }
  });
  
}


/* ---------- SOLVE MODE ---------- */

async function handleSubmitFromStorage() {
  const submit = document.querySelector("input[value='Submit']");
  if (!submit) return false;

  const questionText =
    document.querySelector(".question")?.innerText.trim();

  if (!questionText) return false;

  const stored = await getStoredResults();
  const match = stored.find(
    q => q.question.trim() === questionText
  );

  if (!match) {
    console.warn("❌ No stored answer found, skipping");
    return false;
  }

  selectCorrectAnswers(match.correctAnswers);
  setTimeout(() => submit.click(), 600);
  return true;
}

function selectCorrectAnswers(correctAnswers) {
  document.querySelectorAll(".answer").forEach(ans => {
    const text =
      ans.querySelector("div:last-child")?.innerText.trim();

    if (correctAnswers.includes(text)) {
      ans.querySelector("input")?.click();
    }
  });
}

function getStoredResults() {
  return new Promise((resolve) => {
    chrome.storage.local.get("quizResults", (res) => {
      resolve(res.quizResults || []);
    });
  });
}

/* ---------- REVIEW SCRAPING ---------- */

function waitForFullRenderAndScrape() {
  let last = 0, stable = 0;

  const i = setInterval(() => {
    const c = document.querySelectorAll(".component").length;
    if (c === last) stable++;
    else stable = 0;
    last = c;

    if (stable >= 3 && c > 0) {
      clearInterval(i);
      scrapeAllResults();
    }
  }, 500);
}

function scrapeAllResults() {
  const results = [];

  document.querySelectorAll(".component").forEach(c => {
    const question =
      c.querySelector(".question")?.innerText.trim();

    const correctAnswers = [];

    c.querySelectorAll(".answer img").forEach(img => {
      const src = img.src;
      if (src.includes("check.svg") || src.includes("check-wrong.svg")) {
        const text =
          img.closest(".answer")
            ?.querySelector("div:last-child")
            ?.innerText.trim();
        if (text) correctAnswers.push(text);
      }
    });

    if (question && correctAnswers.length) {
      results.push({ question, correctAnswers });
    }
  });

  chrome.runtime.sendMessage(
    { type: "SAVE_RESULTS", payload: results },
    () => chrome.runtime.sendMessage({ type: "STOP" })
  );
}