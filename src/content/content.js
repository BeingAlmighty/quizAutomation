console.log("Content script loaded on:", location.href);

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SIMPLE_LEARN_NOW") {
    console.log("Simple learn trigger received");
    solveFullPageAndSubmit();
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "REVIEW_SIMPLE_LEARN") {
    console.log("Simple learn review detected");
    waitForFullRenderAndScrapeSimple();
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SIMPLE_SOLVE_NOW") {
    console.log("Simple solve trigger received");
    simpleSolveFromLocalStorageAndSubmit();
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "SOLVE_NOW") {
    console.log("Solve trigger received");
    runSolveFlow();
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "LEARN_NOW") {
    console.log("Learn trigger received");
    runLearnFlow();
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "REVIEW_LEARN") {
    console.log("Learn review detected");
    waitForFullRenderAndScrape();
  }
});

async function solveCurrentQuestion() {
  const submit = document.querySelector("input[value='Submit']");
  if (!submit) return;

  const questionEl = document.querySelector(".question");
  if (!questionEl) return;

  const questionText = questionEl.innerText.trim();
  console.log("Current question:", questionText);

  const stored = await getStoredResults();

  const match = stored.find(
    q => q.question.trim() === questionText
  );

  if (!match) {
    console.warn("No stored answer found for this question");
    return;
  }

  console.log("Matching answer found:", match.correctAnswers);

  document.querySelectorAll(".answer").forEach(ans => {
    const text =
      ans.querySelector("div:last-child")?.innerText.trim();

    if (match.correctAnswers.includes(text)) {
      ans.querySelector("input")?.click();
      console.log("Selected:", text);
    }
  });

  setTimeout(() => {
    console.log("Submitting answer");
    submit.click();
  }, 600);
}

async function runSolveFlow() {
  console.log("Running solve flow on:", location.href);

  if (isReviewPage()) return;

  if (clickFinish()) return;
  if (clickContinue()) return;

  await solveCurrentQuestion();
}

function isReviewPage() {
  return location.pathname.includes("/review");
}

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

function runLearnFlow() {
  console.log("Running learn flow on:", location.href);

  if (isReviewPage()) return;

  if (clickFinish()) return;
  if (clickContinue()) return;

  handleSubmitRandom();
}

function solveFullPageAndSubmit() {
  console.log("Automation started");

  const questions = document.querySelectorAll(".component");
  console.log("Total questions:", questions.length);

  questions.forEach((q) => {
    const radios = q.querySelectorAll('input[type="radio"]');
    const checkboxes = q.querySelectorAll('input[type="checkbox"]');

    if (radios.length) {
      const randomRadio =
        radios[Math.floor(Math.random() * radios.length)];

      const label = randomRadio.closest("label");

      (label || randomRadio).click();

      console.log("Radio option selected");

    } else if (checkboxes.length) {

      const shuffled =
        [...checkboxes].sort(() => 0.5 - Math.random());

      const count =
        Math.floor(Math.random() * checkboxes.length) + 1;

      shuffled.slice(0, count).forEach(cb => {
        const label = cb.closest("label");
        (label || cb).click();
      });

      console.log("Checkboxes selected");
    }
  });

  console.log("All questions attempted");

  setTimeout(() => {
    const submitBtn =
      document.getElementById("the-submit-button");

    if (submitBtn) {
      console.log("Submitting form");
      submitBtn.click();
    } else {
      console.warn("Submit button not found");
    }
  }, 800);
}

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
    console.warn("No stored answer found");
    return false;
  }

  selectCorrectAnswers(match.correctAnswers);

  setTimeout(() => submit.click(), 600);

  return true;
}

function simpleSolveFromLocalStorageAndSubmit() {
  const raw = localStorage.getItem("SIMPLE_QUIZ_ANSWERS");

  if (!raw) {
    console.warn("No SIMPLE_QUIZ_ANSWERS found");
    return;
  }

  const answersMap = JSON.parse(raw);

  console.log("Loaded answers:", answersMap);

  document.querySelectorAll(".component").forEach((c) => {
    const question =
      c.querySelector(".question")?.innerText.trim();

    if (!question || !answersMap[question]) return;

    const correctAnswers = answersMap[question];

    c.querySelectorAll("label.answer").forEach(label => {
      const text =
        label.querySelector("div:last-child")
          ?.innerText.trim();

      if (correctAnswers.includes(text)) {
        label.click();
        console.log("Selected:", text);
      }
    });
  });

  setTimeout(() => {
    const submitBtn =
      document.getElementById("the-submit-button");

    if (submitBtn) {
      console.log("Submitting answers");
      submitBtn.click();
    }
  }, 800);
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

function waitForFullRenderAndScrape() {
  let last = 0;
  let stable = 0;

  const i = setInterval(() => {
    const c =
      document.querySelectorAll(".component").length;

    if (c === last) stable++;
    else stable = 0;

    last = c;

    if (stable >= 3 && c > 0) {
      clearInterval(i);
      scrapeAllResults();
    }
  }, 500);
}

function waitForFullRenderAndScrapeSimple() {
  let last = 0;
  let stable = 0;

  const i = setInterval(() => {
    const c =
      document.querySelectorAll(".component").length;

    if (c === last) stable++;
    else stable = 0;

    last = c;

    if (stable >= 3 && c > 0) {
      clearInterval(i);
      scrapeAndSaveSimpleLearnResults();
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

      if (
        src.includes("check.svg") ||
        src.includes("check-wrong.svg")
      ) {
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

function scrapeAndSaveSimpleLearnResults() {
  const store = {};

  document.querySelectorAll(".component").forEach((c) => {
    const question =
      c.querySelector(".question")?.innerText.trim();

    if (!question) return;

    const correctAnswers = [];

    c.querySelectorAll(".answer img").forEach(img => {
      const src = img.src;

      if (
        src.includes("check.svg") ||
        src.includes("check-wrong.svg")
      ) {
        const text =
          img.closest(".answer")
            ?.querySelector("div:last-child")
            ?.innerText.trim();

        if (text) correctAnswers.push(text);
      }
    });

    if (correctAnswers.length) {
      store[question] = correctAnswers;
    }
  });

  localStorage.setItem(
    "SIMPLE_QUIZ_ANSWERS",
    JSON.stringify(store)
  );

  console.log("Simple learn answers saved");
}