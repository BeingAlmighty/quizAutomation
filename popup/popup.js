document.getElementById("learnBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "START_LEARN" });
  window.close();
});

document.getElementById("solveBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "START_SOLVE" });
  window.close();
});
document.getElementById("simpleLearnBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "START_LEARN_SIMPLE" });
  window.close();
});
document.getElementById("simpleSolveBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "START_SOLVE_SIMPLE" });
  window.close();
});