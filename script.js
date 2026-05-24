const API_URL = "https://my-first-golang-project.onrender.com/tasks";


const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const tasksList = document.getElementById("tasksList");

const allCount = document.getElementById("allCount");
const activeCount = document.getElementById("activeCount");
const doneCount = document.getElementById("doneCount");

let tasks = [];

document.addEventListener("DOMContentLoaded", () => {
  loadTasks();
  setupEvents();
});

function setupEvents() {
  addBtn.addEventListener("click", handleAddTask);

  taskInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleAddTask();
    }
  });
}

async function loadTasks() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Tasklarni olishda xatolik");
    }

    tasks = await response.json();
    renderTasks();
    updateStats();
  } catch (error) {
    console.error(error);
    tasksList.innerHTML = `<div class="empty">Tasklarni yuklab bo‘lmadi</div>`;
  }
}

function renderTasks() {
  if (!tasks || tasks.length === 0) {
    tasksList.innerHTML = `
      <div class="empty">
        <h3>Hali task yo‘q</h3>
        <p>Yangi task qo‘shib boshlang.</p>
      </div>
    `;
    return;
  }

  tasksList.innerHTML = tasks
    .map((task) => {
      return `
        <div class="task-item ${task.completed ? "done" : ""}" data-id="${task.id}">
          <div class="task-left">
            <button class="check-btn" data-action="toggle" data-id="${task.id}">
              ${task.completed ? "✓" : ""}
            </button>

            <div class="task-text">
              <div class="task-title">${escapeHTML(task.taskName)}</div>
              <div class="task-meta">
                ${task.completed ? "Completed" : "Active"}
              </div>
            </div>
          </div>

          <div class="task-actions">
            <button class="icon-btn" data-action="edit" data-id="${task.id}">✎</button>
            <button class="icon-btn danger" data-action="delete" data-id="${task.id}">🗑</button>
          </div>
        </div>
      `;
    })
    .join("");

  bindTaskButtons();
}

function bindTaskButtons() {
  const buttons = tasksList.querySelectorAll("[data-action]");

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === "delete") {
        await deleteTask(id);
      }

      if (action === "toggle") {
        const task = tasks.find((t) => String(t.id) === String(id));
        if (task) {
          await toggleTask(id, !task.completed);
        }
      }

      if (action === "edit") {
        await editTask(id);
      }
    });
  });
}

async function handleAddTask() {
  const taskName = taskInput.value.trim();

  if (!taskName) {
    alert("Task yozing");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskName: taskName,
      }),
    });

    if (!response.ok) {
      throw new Error("Task qo‘shishda xatolik");
    }

    taskInput.value = "";
    await loadTasks();
  } catch (error) {
    console.error(error);
    alert("Task qo‘shib bo‘lmadi");
  }
}

async function deleteTask(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      throw new Error("Task o‘chirishda xatolik");
    }

    await loadTasks();
  } catch (error) {
    console.error(error);
    alert("Task o‘chirib bo‘lmadi");
  }
}

async function toggleTask(id, newStatus) {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        completed: newStatus,
      }),
    });

    if (!response.ok) {
      throw new Error("Task statusini o‘zgartirishda xatolik");
    }

    await loadTasks();
  } catch (error) {
    console.error(error);
    alert("Task statusini o‘zgartirib bo‘lmadi");
  }
}

async function editTask(id) {
  const task = tasks.find((t) => String(t.id) === String(id));
  if (!task) return;

  const newName = prompt("Yangi task nomini yozing:", task.taskName);

  if (newName === null) return;

  const trimmed = newName.trim();
  if (!trimmed) {
    alert("Bo‘sh nom bo‘lmaydi");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        taskName: trimmed,
        completed: task.completed,
      }),
    });

    if (!response.ok) {
      throw new Error("Task edit qilishda xatolik");
    }

    await loadTasks();
  } catch (error) {
    console.error(error);
    alert("Task edit qilib bo‘lmadi");
  }
}

function updateStats() {
  const total = tasks.length;
  const done = tasks.filter((task) => task.completed).length;
  const active = total - done;

  if (allCount) allCount.textContent = total;
  if (activeCount) activeCount.textContent = active;
  if (doneCount) doneCount.textContent = done;
}

function escapeHTML(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}