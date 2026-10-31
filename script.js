const STORAGE_KEY = 'spck_tasks_v1';

const defaultTasks = [
  { id: 1, title: 'Cloner le dépôt GitHub dans Spck Editor', done: true },
  { id: 2, title: 'Modifier style.css ou script.js sur mobile', done: false },
  { id: 3, title: 'Faire un Commit & Push vers GitHub', done: false }
];

let tasks = loadTasks();
let currentFilter = 'all';

const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const listEl = document.getElementById('task-list');
const summaryEl = document.getElementById('summary-text');
const progressEl = document.getElementById('progress-bar');
const clearDoneBtn = document.getElementById('clear-done');
const filterBtns = document.querySelectorAll('.filter-btn');

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultTasks;
  } catch {
    return defaultTasks;
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('Stockage local indisponible:', err);
  }
}

function render() {
  const completedCount = tasks.filter((t) => t.done).length;
  const total = tasks.length;
  const percent = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  summaryEl.textContent = `${completedCount} sur ${total} terminée${completedCount > 1 ? 's' : ''} (${percent}%)`;
  progressEl.style.width = `${percent}%`;

  const visible = tasks.filter((task) => {
    if (currentFilter === 'active') return !task.done;
    if (currentFilter === 'done') return task.done;
    return true;
  });

  listEl.innerHTML = '';

  if (visible.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-state';
    empty.textContent = 'Aucune tâche dans cette vue.';
    listEl.appendChild(empty);
    return;
  }

  visible.forEach((task) => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' completed' : '');

    const label = document.createElement('label');
    label.className = 'task-label';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.done;
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const span = document.createElement('span');
    span.className = 'task-title';
    span.textContent = task.title;

    label.appendChild(checkbox);
    label.appendChild(span);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'delete-btn';
    removeBtn.type = 'button';
    removeBtn.textContent = 'Supprimer';
    removeBtn.addEventListener('click', () => deleteTask(task.id));

    li.appendChild(label);
    li.appendChild(removeBtn);
    listEl.appendChild(li);
  });
}

function toggleTask(id) {
  tasks = tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  saveTasks();
  render();
}

function deleteTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const title = input.value.trim();
  if (!title) return;

  tasks.unshift({
    id: Date.now(),
    title,
    done: false
  });
  input.value = '';
  saveTasks();
  console.log('Nouvelle tâche ajoutée :', title);
  render();
});

clearDoneBtn.addEventListener('click', () => {
  tasks = tasks.filter((t) => !t.done);
  saveTasks();
  render();
});

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter || 'all';
    render();
  });
});

render();
console.log('Carnet Mobile prêt pour Spck Editor.');
