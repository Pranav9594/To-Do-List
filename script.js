// DOM Elements
const todoInput = document.getElementById('todo-input');
const addButton = document.getElementById('add-button');
const todoList = document.getElementById('todo-list');
const taskTemplate = document.getElementById('task-template');
const tasksCount = document.getElementById('tasks-count');
const clearCompletedBtn = document.getElementById('clear-completed');
const themeToggle = document.getElementById('theme-toggle');
const filterButtons = document.querySelectorAll('.filter-btn');

// State
let todos = [];
let currentFilter = 'all';
let draggedItem = null;

// Initialize the app
function init() {
    loadTodos();
    renderTodos();
    loadTheme();
    setupEventListeners();
}

// Load todos from localStorage
function loadTodos() {
    const storedTodos = localStorage.getItem('todos');
    if (storedTodos) {
        todos = JSON.parse(storedTodos);
    }
}

// Save todos to localStorage
function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
    updateTasksCount();
}

// Load theme preference
function loadTheme() {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    if (darkMode) {
        document.body.classList.add('dark-theme');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
}

// Toggle theme
function toggleTheme() {
    const isDarkMode = document.body.classList.toggle('dark-theme');
    localStorage.setItem('darkMode', isDarkMode);
    themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

// Setup event listeners
function setupEventListeners() {
    // Add new todo
    addButton.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    // Filter todos
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTodos();
        });
    });

    // Clear completed todos
    clearCompletedBtn.addEventListener('click', clearCompleted);

    // Toggle theme
    themeToggle.addEventListener('click', toggleTheme);
}

// Add a new todo
function addTodo() {
    const text = todoInput.value.trim();
    if (text) {
        const newTodo = {
            id: Date.now(),
            text,
            completed: false
        };
        
        todos.push(newTodo);
        saveTodos();
        renderTodos();
        todoInput.value = '';
        todoInput.focus();
    }
}

// Render todos based on current filter
function renderTodos() {
    todoList.innerHTML = '';
    
    const filteredTodos = todos.filter(todo => {
        if (currentFilter === 'active') return !todo.completed;
        if (currentFilter === 'completed') return todo.completed;
        return true;
    });
    
    filteredTodos.forEach(todo => {
        const todoItem = createTodoElement(todo);
        todoList.appendChild(todoItem);
    });
    
    updateTasksCount();
}

// Create a todo list item element
function createTodoElement(todo) {
    const todoItem = document.importNode(taskTemplate.content, true).querySelector('.todo-item');
    
    // Set data attributes and classes
    todoItem.dataset.id = todo.id;
    if (todo.completed) {
        todoItem.classList.add('completed');
    }
    
    // Set text content
    const todoText = todoItem.querySelector('.todo-text');
    todoText.textContent = todo.text;
    
    // Set checkbox state
    const checkbox = todoItem.querySelector('.todo-checkbox');
    checkbox.checked = todo.completed;
    
    // Add event listeners
    checkbox.addEventListener('change', () => toggleTodoComplete(todo.id));
    todoItem.querySelector('.edit-btn').addEventListener('click', () => editTodo(todo.id));
    todoItem.querySelector('.delete-btn').addEventListener('click', () => deleteTodo(todo.id));
    
    // Drag and drop functionality
    todoItem.addEventListener('dragstart', handleDragStart);
    todoItem.addEventListener('dragend', handleDragEnd);
    todoItem.addEventListener('dragover', handleDragOver);
    todoItem.addEventListener('dragenter', handleDragEnter);
    todoItem.addEventListener('dragleave', handleDragLeave);
    todoItem.addEventListener('drop', handleDrop);
    
    return todoItem;
}

// Toggle todo complete status
function toggleTodoComplete(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        saveTodos();
        renderTodos();
    }
}

// Edit todo
function editTodo(id) {
    const todoItem = document.querySelector(`.todo-item[data-id="${id}"]`);
    const todoText = todoItem.querySelector('.todo-text');
    const currentText = todoText.textContent;
    
    // Create input for editing
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'editing-input';
    input.value = currentText;
    
    // Replace text with input
    todoText.replaceWith(input);
    input.focus();
    
    // Handle input blur and keypress
    const handleEdit = (save) => {
        const newText = input.value.trim();
        if (save && newText) {
            const todo = todos.find(t => t.id === id);
            if (todo) {
                todo.text = newText;
                saveTodos();
            }
        }
        
        // Restore text element
        const newTodoText = document.createElement('span');
        newTodoText.className = 'todo-text';
        newTodoText.textContent = save && newText ? newText : currentText;
        input.replaceWith(newTodoText);
    };
    
    input.addEventListener('blur', () => handleEdit(true));
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleEdit(true);
        } else if (e.key === 'Escape') {
            handleEdit(false);
        }
    });
}

// Delete todo
function deleteTodo(id) {
    const todoItem = document.querySelector(`.todo-item[data-id="${id}"]`);
    todoItem.classList.add('fade-out');
    
    todoItem.addEventListener('animationend', () => {
        todos = todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
    });
}

// Clear completed todos
function clearCompleted() {
    const completedItems = document.querySelectorAll('.todo-item.completed');
    
    completedItems.forEach(item => {
        item.classList.add('fade-out');
    });
    
    // Wait for animation to complete
    setTimeout(() => {
        todos = todos.filter(todo => !todo.completed);
        saveTodos();
        renderTodos();
    }, 300);
}

// Update tasks count
function updateTasksCount() {
    const activeTodos = todos.filter(todo => !todo.completed);
    tasksCount.textContent = `${activeTodos.length} task${activeTodos.length !== 1 ? 's' : ''} left`;
}

// Drag and Drop Handlers
function handleDragStart(e) {
    draggedItem = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd() {
    this.classList.remove('dragging');
    draggedItem = null;
    
    // Update todos array order based on DOM order
    const newOrder = [];
    document.querySelectorAll('.todo-item').forEach(item => {
        const id = parseInt(item.dataset.id);
        const todo = todos.find(t => t.id === id);
        if (todo) newOrder.push(todo);
    });
    
    todos = newOrder;
    saveTodos();
}

function handleDragOver(e) {
    e.preventDefault();
    return false;
}

function handleDragEnter(e) {
    e.preventDefault();
    this.classList.add('drag-over');
}

function handleDragLeave() {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    e.stopPropagation();
    
    if (draggedItem !== this) {
        const list = todoList;
        const children = Array.from(list.children);
        const draggedIndex = children.indexOf(draggedItem);
        const targetIndex = children.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            list.insertBefore(draggedItem, this.nextSibling);
        } else {
            list.insertBefore(draggedItem, this);
        }
    }
    
    this.classList.remove('drag-over');
    return false;
}

// Initialize the app
document.addEventListener('DOMContentLoaded', init);