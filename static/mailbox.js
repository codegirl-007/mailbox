const STORAGE_KEY = "mailbox-letters";
const BOX_TITLES = {
  suggestions: "Suggestions",
  letters: "Letters",
  problems: "Problems",
};

const bus = new EventTarget();

function emit(type, detail) {
  bus.dispatchEvent(new CustomEvent(type, { detail }));
}

const pad = document.getElementById("pad");
const lift = document.getElementById("lift");
const letterInput = document.getElementById("letter");
const inbox = document.getElementById("inbox");
const inboxTitle = document.getElementById("inbox-title");
const inboxList = document.getElementById("inbox-list");
const slots = Array.from(document.querySelectorAll(".mailbox-slot"));

let drag = null;
let ignoreClick = false;

function loadLetters() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return {
      suggestions: Array.isArray(data?.suggestions) ? data.suggestions : [],
      letters: Array.isArray(data?.letters) ? data.letters : [],
      problems: Array.isArray(data?.problems) ? data.problems : [],
    };
  } catch (err) {
    return { suggestions: [], letters: [], problems: [] };
  }
}

function saveLetters(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function slotFromPoint(x, y) {
  const el = document.elementFromPoint(x, y);
  return el ? el.closest(".mailbox-slot") : null;
}

function highlightSlot(slot) {
  slots.forEach((item) => item.classList.toggle("is-target", item === slot));
}

function moveGhost(x, y) {
  if (!drag) return;
  drag.ghost.style.left = `${x}px`;
  drag.ghost.style.top = `${y}px`;
}

function endDrag(x, y) {
  if (!drag) return;
  const slot = slotFromPoint(x, y);
  const text = drag.text;
  const ghost = drag.ghost;
  drag = null;
  document.body.classList.remove("is-dragging");
  pad.classList.remove("is-away");
  highlightSlot(null);
  ghost.remove();

  if (slot) {
    ignoreClick = true;
    setTimeout(() => {
      ignoreClick = false;
    }, 0);
    emit("drop", { box: slot.dataset.box, text });
    return;
  }

  emit("cancel", { text });
}

function startDrag(event) {
  if (drag) return;
  const text = letterInput.value.trim();
  if (!text) {
    emit("empty");
    return;
  }

  const ghost = document.createElement("img");
  ghost.src = "folded-paper.jpg";
  ghost.alt = "";
  ghost.className = "drag-ghost";
  document.body.appendChild(ghost);

  drag = { ghost, text };
  document.body.classList.add("is-dragging");
  pad.classList.add("is-away");
  if (event.pointerId != null) {
    try {
      lift.setPointerCapture(event.pointerId);
    } catch (err) {
      // Mouse-only paths don't always support pointer capture.
    }
  }
  moveGhost(event.clientX, event.clientY);
  highlightSlot(slotFromPoint(event.clientX, event.clientY));
  emit("dragstart", { text });
}

function onDown(event) {
  if (event.button !== undefined && event.button !== 0) return;
  event.preventDefault();
  startDrag(event);
}

function onMove(event) {
  if (!drag) return;
  moveGhost(event.clientX, event.clientY);
  highlightSlot(slotFromPoint(event.clientX, event.clientY));
}

function onUp(event) {
  if (!drag) return;
  endDrag(event.clientX, event.clientY);
}

lift.addEventListener("pointerdown", onDown);
lift.addEventListener("mousedown", onDown);
window.addEventListener("pointermove", onMove);
window.addEventListener("mousemove", onMove);
window.addEventListener("pointerup", onUp);
window.addEventListener("mouseup", onUp);
lift.addEventListener("pointercancel", onUp);

lift.addEventListener("keydown", (event) => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    letterInput.focus();
  }
});

function formatWhen(at) {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(at));
  } catch (err) {
    return "";
  }
}

function renderInbox(box) {
  const items = loadLetters()[box];
  inboxTitle.textContent = BOX_TITLES[box];
  inboxList.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "inbox-empty";
    empty.textContent = "No letters yet.";
    inboxList.append(empty);
    return;
  }

  items.forEach((item) => {
    const article = document.createElement("article");
    article.className = "inbox-letter";

    const body = document.createElement("p");
    body.textContent = item.text;

    const footer = document.createElement("footer");
    const when = document.createElement("time");
    when.textContent = formatWhen(item.at);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "letter-remove";
    remove.textContent = "Throw away";
    remove.addEventListener("click", () => {
      const data = loadLetters();
      data[box] = data[box].filter((letter) => letter.id !== item.id);
      saveLetters(data);
      renderInbox(box);
    });

    footer.append(when, remove);
    article.append(body, footer);
    inboxList.append(article);
  });
}

slots.forEach((slot) => {
  slot.addEventListener("click", () => {
    if (drag || ignoreClick) return;
    emit("open", { box: slot.dataset.box });
  });
});

bus.addEventListener("empty", () => {
  pad.classList.remove("is-empty");
  void pad.offsetWidth;
  pad.classList.add("is-empty");
  letterInput.focus();
});

bus.addEventListener("drop", (event) => {
  const { box, text } = event.detail;
  const data = loadLetters();
  data[box].unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    at: Date.now(),
  });
  saveLetters(data);
  letterInput.value = "";
});

bus.addEventListener("open", (event) => {
  renderInbox(event.detail.box);
  inbox.showModal();
});
