
const STORAGE_KEY = "myTodoTasks";

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyDescription = document.getElementById("emptyDescription");
const formMessage = document.getElementById("formMessage");
const progressFill = document.getElementById("progressFill");
const progressBar = document.getElementById("progressBar");
const clearCompletedButton = document.getElementById("clearCompleted");

let tasks = loadTasks();
let currentFilter = "all";

// Load saved tasks from browser storage
function loadTasks() {
    try {
        const savedTasks = JSON.parse(localStorage.getItem(STORAGE_KEY));

        if (Array.isArray(savedTasks)) {
            return savedTasks.filter(task =>
                task &&
                typeof task.id === "string" &&
                typeof task.title === "string" &&
                typeof task.completed === "boolean"
            );
        }
    } catch (error) {
        console.warn("Could not load saved tasks.", error);
    }

    return [];
}

// Save tasks in browser storage
function saveTasks() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        formMessage.textContent =
            "Could not save tasks. Check your browser storage settings.";
    }
}

// Generate a unique ID for each task
function makeId() {
    if (window.crypto && window.crypto.randomUUID) {
        return window.crypto.randomUUID();
    }

    return Date.now() + "-" + Math.random().toString(16).slice(2);
}

// Display today's date
function updateDate() {
    const today = new Date();

    document.getElementById("todayDate").textContent =
        today.toLocaleDateString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric"
        });
}

// Create an action button
function createIconButton(label, action, taskId, type) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "icon-button";
    button.setAttribute("aria-label", label);
    button.title = label;

    if (type === "edit") {
        button.textContent = "✎";
    } else {
        button.textContent = "×";
    }

    button.addEventListener("click", function () {
        action(taskId);
    });

    return button;
}

// Display tasks and update progress
function renderTasks() {
    taskList.replaceChildren();

    const completedCount = tasks.filter(task => task.completed).length;
    const pendingCount = tasks.length - completedCount;

    const percentage = tasks.length === 0
        ? 0
        : Math.round((completedCount / tasks.length) * 100);

    document.getElementById("completedCount").textContent = completedCount;
    document.getElementById("totalCount").textContent = tasks.length;
    document.getElementById("progressPercent").textContent = percentage + "%";

    document.getElementById("taskTotalBadge").textContent =
        tasks.length + (tasks.length === 1 ? " task" : " tasks");

    document.getElementById("allFilterCount").textContent = tasks.length;
    document.getElementById("pendingFilterCount").textContent = pendingCount;
    document.getElementById("completedFilterCount").textContent = completedCount;

    progressFill.style.width = percentage + "%";
    progressBar.setAttribute("aria-valuenow", percentage);

    if (tasks.length === 0) {
        document.getElementById("progressMessage").textContent =
            "Every task starts with a first step.";
    } else if (percentage === 100) {
        document.getElementById("progressMessage").textContent =
            "Everything is done. Great work!";
    } else {
        document.getElementById("progressMessage").textContent =
            "Keep going. You're making progress.";
    }

    document.getElementById("footerMessage").textContent =
        pendingCount === 0 && tasks.length > 0
            ? "All tasks completed. Nice work!"
            : pendingCount + (pendingCount === 1
                ? " task left to go."
                : " tasks left to go.");

    const visibleTasks = tasks.filter(function (task) {
        if (currentFilter === "pending") {
            return !task.completed;
        }

        if (currentFilter === "completed") {
            return task.completed;
        }

        return true;
    });

    visibleTasks.forEach(function (task) {
        const item = document.createElement("li");
        item.className = "task-item";

        if (task.completed) {
            item.classList.add("is-complete");
        }

        // Complete or uncomplete button
        const checkButton = document.createElement("button");
        checkButton.type = "button";
        checkButton.className = "task-check";
        checkButton.textContent = task.completed ? "✓" : "";

        checkButton.setAttribute(
            "aria-label",
            task.completed ? "Mark task as pending" : "Complete task"
        );

        checkButton.addEventListener("click", function () {
            toggleTask(task.id);
        });

        // Task title and status
        const content = document.createElement("div");
        content.className = "task-content";

        const title = document.createElement("p");
        title.className = "task-title";
        title.textContent = task.title;

        const status = document.createElement("span");
        status.className = "task-status";
        status.textContent = task.completed ? "Completed" : "In progress";

        content.append(title, status);

        // Edit and delete buttons
        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editButton = createIconButton(
            "Edit task", editTask, task.id, "edit"
        );

        const deleteButton = createIconButton(
            "Delete task", deleteTask, task.id, "delete"
        );

        actions.append(editButton, deleteButton);
        item.append(checkButton, content, actions);
        taskList.appendChild(item);
    });

    const hasVisibleTasks = visibleTasks.length > 0;

    emptyState.hidden = hasVisibleTasks;
    taskList.hidden = !hasVisibleTasks;

    if (!hasVisibleTasks) {
        if (currentFilter === "pending" && tasks.length > 0) {
            emptyTitle.textContent = "Nothing pending.";
            emptyDescription.textContent =
                "You've completed every task. Nice work!";
        } else if (currentFilter === "completed" && tasks.length > 0) {
            emptyTitle.textContent = "No completed tasks yet.";
            emptyDescription.textContent =
                "Completed tasks will appear here.";
        } else {
            emptyTitle.textContent = "A fresh start.";
            emptyDescription.textContent =
                "Add your first task and build some momentum.";
        }
    }

    clearCompletedButton.hidden = completedCount === 0;
}

// Add a new task
function addTask(title) {
    tasks.unshift({
        id: String(makeId()),
        title: title,
        completed: false
    });

    saveTasks();

    currentFilter = "all";
    updateFilterButtons();
    renderTasks();
}

// Mark a task completed or pending
function toggleTask(id) {
    tasks = tasks.map(function (task) {
        if (task.id === id) {
            return {
                ...task,
                completed: !task.completed
            };
        }

        return task;
    });

    saveTasks();
    renderTasks();
}

// Edit a task
function editTask(id) {
    const task = tasks.find(function (item) {
        return item.id === id;
    });

    if (!task) {
        return;
    }

    const updatedTitle = prompt("Edit your task:", task.title);

    if (updatedTitle === null) {
        return;
    }

    const title = updatedTitle.trim();

    if (title === "") {
        alert("Task title cannot be empty.");
        return;
    }

    if (title.length > 200) {
        alert("Task title must be under 200 characters.");
        return;
    }

    tasks = tasks.map(function (item) {
        if (item.id === id) {
            return {
                ...item,
                title: title
            };
        }

        return item;
    });

    saveTasks();
    renderTasks();
}

// Delete a task
function deleteTask(id) {
    const task = tasks.find(function (item) {
        return item.id === id;
    });

    tasks = tasks.filter(function (item) {
        return item.id !== id;
    });

    saveTasks();
    renderTasks();

    if (task) {
        formMessage.textContent = "Task deleted successfully.";
    }
}

// Update active filter styling
function updateFilterButtons() {
    document.querySelectorAll(".filter-button").forEach(function (button) {
        const isActive = button.dataset.filter === currentFilter;

        button.classList.toggle("active", isActive);
        button.setAttribute("aria-pressed", String(isActive));
    });
}

// Handle the add-task form
taskForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const title = taskInput.value.trim();

    if (title === "") {
        formMessage.textContent = "Please enter a task first.";
        taskInput.focus();
        return;
    }

    if (title.length > 200) {
        formMessage.textContent =
            "Task title must be under 200 characters.";
        return;
    }

    addTask(title);

    taskInput.value = "";
    formMessage.textContent = "Task added successfully.";
    taskInput.focus();
});

// Filter tasks
document.querySelectorAll(".filter-button").forEach(function (button) {
    button.addEventListener("click", function () {
        currentFilter = button.dataset.filter;

        updateFilterButtons();
        renderTasks();
    });
});

// Remove all completed tasks
clearCompletedButton.addEventListener("click", function () {
    tasks = tasks.filter(function (task) {
        return !task.completed;
    });

    saveTasks();
    renderTasks();

    formMessage.textContent = "Completed tasks cleared.";
});

// Start the application
updateDate();
renderTasks();
