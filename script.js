const API_URL = "https://my-first-golang-project.onrender.com/tasks";

const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const tasksList = document.getElementById("tasksList");

const allCount = document.getElementById("allCount");
const activeCount = document.getElementById("activeCount");
const doneCount = document.getElementById("doneCount");

let tasks = [];

document.addEventListener("DOMContentLoaded", () => {
  setupEvents();
  loadTasks();
});

function setupEvents() {
  if (addBtn) {
    addBtn.addEventListener("click", handleAddTask);
  }

  if (taskInput) {
    taskInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleAddTask();
      }
    });
  }
}

function getTaskName(task) {
  return task?.taskName ?? task?.TaskName ?? task?.name ?? "";
}

function getTaskDone(task) {
  return Boolean(task?.completed ?? task?.Completed ?? task?.done ?? false);
}

function getTaskId(task, index) {
  return task?.id ?? task?.ID ?? task?.Id ?? index + 1;
}

async function loadTasks() {
  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error("Tasklarni olishda xatolik");
    }

    const data = await response.json();
    tasks = Array.isArray(data) ? data : [];

    renderTasks();
    updateStats();
  } catch (error) {
    console.error(error);
    if (tasksList) {
      tasksList.innerHTML = `
        <div class="empty">
          <h3>Tasklarni yuklab bo‘lmadi</h3>
          <p>Backend va CORS sozlamalarini tekshiring.</p>
        </div>
      `;
    }
  }
}

function renderTasks() {
  if (!tasksList) return;

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
    .map((task, index) => {
      const name = escapeHTML(getTaskName(task));
      const done = getTaskDone(task);
      const id = getTaskId(task, index);

      return `
        <div class="task-item ${done ? "done" : ""}" data-id="${id}" data-index="${index}">
          <div class="task-left">
            <button class="check-btn ${done ? "checked" : ""}" type="button" data-action="toggle" data-id="${id}" data-index="${index}">
              ${done ? "✓" : ""}
            </button>

            <div class="task-text">
              <div class="task-title">${name}</div>
              <div class="task-meta">
                ${done ? "Completed" : "Active"}
              </div>
            </div>
          </div>

          <div class="task-actions">
            <button class="icon-btn" type="button" data-action="edit" data-id="${id}" data-index="${index}">✎</button>
            <button class="icon-btn danger" type="button" data-action="delete" data-id="${id}" data-index="${index}">🗑</button>
          </div>
        </div>
      `;
    })
    .join("");

  bindTaskButtons();
}

function bindTaskButtons() {
  if (!tasksList) return;

  const buttons = tasksList.querySelectorAll("[data-action]");

  buttons.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const action = btn.dataset.action;
      const index = Number(btn.dataset.index);
      const task = tasks[index];

      if (!task && action !== "delete") {
        return;
      }

      const id = getTaskId(task, index);

      if (action === "delete") {
        await deleteTask(id);
      }

      if (action === "toggle") {
        await toggleTask(id, !getTaskDone(task));
      }

      if (action === "edit") {
        await editTask(id);
      }
    });
  });
}

async function handleAddTask() {
  const taskName = taskInput ? taskInput.value.trim() : "";

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

    if (taskInput) {
      taskInput.value = "";
    }

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
  const task = tasks.find((t, index) => String(getTaskId(t, index)) === String(id));
  if (!task) return;

  const currentName = getTaskName(task);
  const newName = prompt("Yangi task nomini yozing:", currentName);

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
        completed: getTaskDone(task),
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
  const done = tasks.filter((task) => getTaskDone(task)).length;
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
