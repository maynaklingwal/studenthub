// StudentHub utility dashboard script.
// Handles: percentage calculator, pomodoro timer, date sheet reminders, and notes saver.

document.addEventListener("DOMContentLoaded", () => {
  setupPercentageCalculator();
  setupPomodoroTimer();
  setupDateSheetReminder();
  setupNotesSaver();
});

function setupPercentageCalculator() {
  const totalMarksInput = document.getElementById("total-marks");
  const obtainedMarksInput = document.getElementById("obtained-marks");
  const percentageResult = document.getElementById("percentage-result");

  const calculatePercentage = () => {
    const total = Number(totalMarksInput.value);
    const obtained = Number(obtainedMarksInput.value);

    if (!totalMarksInput.value && !obtainedMarksInput.value) {
      percentageResult.textContent = "Enter marks to see percentage.";
      return;
    }

    if (!total || total <= 0) {
      percentageResult.textContent = "Total marks must be greater than 0.";
      return;
    }

    if (obtained < 0 || obtained > total) {
      percentageResult.textContent = "Obtained marks must be between 0 and total marks.";
      return;
    }

    const percentage = (obtained / total) * 100;
    percentageResult.textContent = `Percentage: ${percentage.toFixed(2)}%`;
  };

  totalMarksInput.addEventListener("input", calculatePercentage);
  obtainedMarksInput.addEventListener("input", calculatePercentage);
}

function setupPomodoroTimer() {
  const START_TIME = 25 * 60;
  let remainingSeconds = START_TIME;
  let intervalRef = null;

  const timerDisplay = document.getElementById("timer-display");
  const progressCircle = document.querySelector(".ring-progress");
  const startBtn = document.getElementById("start-timer");
  const pauseBtn = document.getElementById("pause-timer");
  const resetBtn = document.getElementById("reset-timer");

  const radius = 94;
  const circumference = 2 * Math.PI * radius;
  progressCircle.style.strokeDasharray = String(circumference);

  // Updates timer text and circular progress based on remaining seconds.
  const renderTimer = () => {
    const minutes = Math.floor(remainingSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (remainingSeconds % 60).toString().padStart(2, "0");
    timerDisplay.textContent = `${minutes}:${seconds}`;

    const completionRatio = (START_TIME - remainingSeconds) / START_TIME;
    const offset = circumference * completionRatio;
    progressCircle.style.strokeDashoffset = String(offset);
  };

  // Starts ticking timer, stopping automatically at 0.
  const startTimer = () => {
    if (intervalRef) return;

    intervalRef = setInterval(() => {
      if (remainingSeconds > 0) {
        remainingSeconds -= 1;
        renderTimer();
      } else {
        clearInterval(intervalRef);
        intervalRef = null;
        timerDisplay.textContent = "Done!";
      }
    }, 1000);
  };

  // Pauses current running timer.
  const pauseTimer = () => {
    clearInterval(intervalRef);
    intervalRef = null;
  };

  // Resets timer to 25:00 and clears active interval.
  const resetTimer = () => {
    pauseTimer();
    remainingSeconds = START_TIME;
    renderTimer();
  };

  startBtn.addEventListener("click", startTimer);
  pauseBtn.addEventListener("click", pauseTimer);
  resetBtn.addEventListener("click", resetTimer);

  renderTimer();
}

function setupDateSheetReminder() {
  const STORAGE_KEY = "studenthub_exam_reminders";
  const form = document.getElementById("exam-form");
  const nameInput = document.getElementById("exam-name");
  const dateInput = document.getElementById("exam-date");
  const examList = document.getElementById("exam-list");

  let exams = readStorage(STORAGE_KEY);

  // Returns days left from today until exam date.
  const getDaysLeft = (date) => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const examDate = new Date(date);
    examDate.setHours(0, 0, 0, 0);

    const diffMs = examDate - now;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  };

  // Renders all exams as reminder cards with countdown and remove action.
  const renderExams = () => {
    examList.innerHTML = "";

    if (!exams.length) {
      examList.innerHTML = '<li class="empty-state">No exams added yet.</li>';
      return;
    }

    exams
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .forEach((exam) => {
        const daysLeft = getDaysLeft(exam.date);

        let countdownText = "Today";
        if (daysLeft > 0) countdownText = `${daysLeft} day${daysLeft > 1 ? "s" : ""} left`;
        if (daysLeft < 0) countdownText = `${Math.abs(daysLeft)} day${Math.abs(daysLeft) > 1 ? "s" : ""} ago`;

        const item = document.createElement("li");
        item.className = "data-item";
        item.innerHTML = `
          <div>
            <p class="item-title">${escapeHTML(exam.name)}</p>
            <p class="item-subtext">${formatDate(exam.date)} • ${countdownText}</p>
          </div>
          <div class="item-actions">
            <button class="btn-icon btn-danger" data-remove-exam="${exam.id}">Delete</button>
          </div>
        `;

        examList.append(item);
      });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = nameInput.value.trim();
    const date = dateInput.value;
    if (!name || !date) return;

    exams.push({
      id: Date.now().toString(),
      name,
      date,
    });

    writeStorage(STORAGE_KEY, exams);
    renderExams();
    form.reset();
  });

  examList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-exam]");
    if (!button) return;

    const examId = button.dataset.removeExam;
    exams = exams.filter((exam) => exam.id !== examId);
    writeStorage(STORAGE_KEY, exams);
    renderExams();
  });

  renderExams();
}

function setupNotesSaver() {
  const STORAGE_KEY = "studenthub_notes";
  const form = document.getElementById("note-form");
  const noteInput = document.getElementById("note-input");
  const notesList = document.getElementById("notes-list");

  let notes = readStorage(STORAGE_KEY);

  // Draw notes with edit + delete controls.
  const renderNotes = () => {
    notesList.innerHTML = "";

    if (!notes.length) {
      notesList.innerHTML = '<li class="empty-state">No notes saved yet.</li>';
      return;
    }

    notes.forEach((note) => {
      const item = document.createElement("li");
      item.className = "data-item";
      item.innerHTML = `
        <div>
          <p class="item-title">${escapeHTML(note.text)}</p>
        </div>
        <div class="item-actions">
          <button class="btn-icon" data-edit-note="${note.id}">Edit</button>
          <button class="btn-icon btn-danger" data-delete-note="${note.id}">Delete</button>
        </div>
      `;

      notesList.append(item);
    });
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = noteInput.value.trim();
    if (!text) return;

    notes.unshift({
      id: Date.now().toString(),
      text,
    });

    writeStorage(STORAGE_KEY, notes);
    renderNotes();
    form.reset();
  });

  notesList.addEventListener("click", (event) => {
    const editButton = event.target.closest("[data-edit-note]");
    const deleteButton = event.target.closest("[data-delete-note]");

    if (editButton) {
      const noteId = editButton.dataset.editNote;
      const note = notes.find((entry) => entry.id === noteId);
      if (!note) return;

      const updatedText = window.prompt("Edit your note:", note.text);
      if (updatedText === null) return;

      const cleanedText = updatedText.trim();
      if (!cleanedText) return;

      note.text = cleanedText;
      writeStorage(STORAGE_KEY, notes);
      renderNotes();
    }

    if (deleteButton) {
      const noteId = deleteButton.dataset.deleteNote;
      notes = notes.filter((entry) => entry.id !== noteId);
      writeStorage(STORAGE_KEY, notes);
      renderNotes();
    }
  });

  renderNotes();
}

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatDate(dateInput) {
  return new Date(dateInput).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function escapeHTML(value) {
  const wrapper = document.createElement("div");
  wrapper.textContent = value;
  return wrapper.innerHTML;
}
