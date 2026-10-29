
"use strict";

// ======================================
// 1. DATOS DE DEMOSTRACION
// ======================================

const state = {
  balance: 850000,
  income: 0,
  expenses: 0,
  movements: [],
  notifications: [],
  goals: [],
  user: "",
  pending: null,
  balanceVisible: true
};

const $ = (id) => document.getElementById(id);

const money = (amount) =>
  new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS"
  }).format(amount);

const escapeHTML = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);

function addNotification(message) {
  state.notifications.unshift(message);
  renderNotifications();
}

function addMovement(description, amount) {
  state.movements.unshift({
    description,
    amount,
    date: new Date().toLocaleDateString("es-AR")
  });
  renderMovements();
  renderSummary();
}

// ======================================
// 2. INICIO DE SESION
// ======================================

$("loginForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const email = $("email").value.trim();
  const password = $("password").value;

  if (!email || password.length < 4) {
    $("loginError").textContent =
      "Ingresá un correo válido y una contraseña de al menos 4 caracteres.";
    return;
  }

  // Es una demo: no se verifica una cuenta real.
  state.user = email.split("@")[0];

  $("userName").textContent = state.user;
  $("welcomeName").textContent = state.user;

  $("login").classList.add("hidden");
  $("app").classList.remove("hidden");
  $("loginError").textContent = "";

  showSection("inicio");
  renderAll();
});

$("logout").addEventListener("click", () => {
  state.user = "";
  state.pending = null;

  $("app").classList.add("hidden");
  $("login").classList.remove("hidden");
  $("password").value = "";
  $("loginForm").reset();

  $("transferReview").classList.add("hidden");
  $("paymentReview").classList.add("hidden");
});

// ======================================
// 3. NAVEGACION
// ======================================

function showSection(sectionId) {
  document.querySelectorAll(".page-section").forEach((section) => {
    section.classList.toggle("hidden", section.id !== sectionId);
  });

  document.querySelectorAll(".nav-btn").forEach((button) => {
    button.classList.toggle(
      "active",
      button.dataset.section === sectionId
    );
  });

  const activeButton = document.querySelector(
    `.nav-btn[data-section="${sectionId}"]`
  );

  $("pageTitle").textContent = activeButton
    ? activeButton.textContent.replace(/^[^\wÁÉÍÓÚÑ]+/, "").trim()
    : "Inicio";

  if (sectionId === "asistente") {
    $("chatInput").focus();
  }
}

document.querySelectorAll("[data-section]").forEach((button) => {
  button.addEventListener("click", () => {
    showSection(button.dataset.section);
  });
});

document.querySelectorAll("[data-go]").forEach((button) => {
  button.addEventListener("click", () => {
    showSection(button.dataset.go);
  });
});

// ======================================
// 4. SALDO Y RESUMEN
// ======================================

function renderBalance() {
  const formatted = money(state.balance);

  $("balance").textContent = state.balanceVisible
    ? formatted
    : "••••••••";

  $("accountBalance").textContent = formatted;
  $("income").textContent = money(state.income);
  $("expenses").textContent = money(state.expenses);

  $("toggleBalance").textContent = state.balanceVisible
    ? "Ocultar saldo"
    : "Mostrar saldo";
}

$("toggleBalance").addEventListener("click", () => {
  state.balanceVisible = !state.balanceVisible;
  renderBalance();
});

function renderMovements() {
  const list = $("movementList");

  if (state.movements.length === 0) {
    list.innerHTML =
      '<p class="notice">Todavía no hay movimientos en esta demo.</p>';
    return;
  }

  list.innerHTML = state.movements.map((movement) => `
    <div class="movement">
      <div>
        <p>${escapeHTML(movement.description)}</p>
        <small>${escapeHTML(movement.date)}</small>
      </div>
      <span class="amount ${
        movement.amount >= 0 ? "positive" : "negative"
      }">
        ${movement.amount > 0 ? "+" : ""}${money(movement.amount)}
      </span>
    </div>
  `).join("");
}

function renderSummary() {
  $("expenseSummary").innerHTML = `
    <p>Ingresos registrados: <strong>${money(state.income)}</strong></p>
    <p>Gastos registrados: <strong>${money(state.expenses)}</strong></p>
    <p>Balance del período: <strong>${money(
      state.income - state.expenses
    )}</strong></p>
    <p class="notice">
      Los valores se calculan con las operaciones de esta sesión.
    </p>
  `;
}

function renderNotifications() {
  const list = $("notificationList");

  if (state.notifications.length === 0) {
    list.innerHTML = "<p>No hay notificaciones nuevas.</p>";
    return;
  }

  list.innerHTML = state.notifications.map((message) => `
    <div class="movement">
      <p>${escapeHTML(message)}</p>
    </div>
  `).join("");
}

function renderAll() {
  renderBalance();
  renderMovements();
  renderSummary();
  renderNotifications();
  renderGoals();
}

// ======================================
// 5. TRANSFERENCIAS SIMULADAS
// ======================================

$("transferForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const recipient = $("recipient").value.trim();
  const destination = $("destination").value.trim();
  const amount = Number($("transferAmount").value);
  const note = $("transferNote").value.trim();

  if (
    !recipient ||
    !destination ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    $("transferMessage").textContent =
      "Revisá los datos y el importe ingresado.";
    return;
  }

  if (amount > state.balance) {
    $("transferMessage").textContent =
      "Saldo insuficiente para esta operación simulada.";
    return;
  }

  state.pending = {
    type: "transfer",
    recipient,
    destination,
    amount,
    note
  };

  $("transferMessage").textContent = "";

  $("transferReview").innerHTML = `
    <h3>Revisá la operación</h3>
    <p>Destinatario: <strong>${escapeHTML(recipient)}</strong></p>
    <p>Alias o identificador: ${escapeHTML(destination)}</p>
    <p>Concepto: ${escapeHTML(note || "Sin concepto")}</p>
    <p>Importe: <strong>${money(amount)}</strong></p>
    <p>Saldo restante: ${money(state.balance - amount)}</p>
    <button class="primary-btn" id="confirmTransfer" type="button">
      Confirmar demo
    </button>
    <button class="secondary-btn" id="cancelTransfer" type="button">
      Cancelar
    </button>
  `;

  $("transferReview").classList.remove("hidden");
});

$("transferReview").addEventListener("click", (event) => {
  if (event.target.id === "cancelTransfer") {
    state.pending = null;
    $("transferReview").classList.add("hidden");
  }

  if (event.target.id === "confirmTransfer") {
    const operation = state.pending;

    if (!operation || operation.type !== "transfer") return;

    // Segunda validación antes de modificar el saldo.
    if (operation.amount > state.balance) {
      $("transferMessage").textContent = "Saldo insuficiente.";
      $("transferReview").classList.add("hidden");
      state.pending = null;
      return;
    }

    state.balance -= operation.amount;
    state.expenses += operation.amount;

    addMovement(
      "Transferencia a " + operation.recipient,
      -operation.amount
    );

    addNotification(
      "Transferencia demo realizada a " + operation.recipient
    );

    state.pending = null;
    $("transferReview").classList.add("hidden");
    $("transferForm").reset();
    $("transferMessage").textContent =
      "Transferencia simulada completada correctamente.";

    renderBalance();
    renderSummary();
  }
});

// ======================================
// 6. PAGOS SIMULADOS
// ======================================

$("paymentForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const service = $("service").value;
  const amount = Number($("paymentAmount").value);

  if (
    !service ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    $("paymentMessage").textContent =
      "Seleccioná un servicio e ingresá un importe válido.";
    return;
  }

  if (amount > state.balance) {
    $("paymentMessage").textContent = "Saldo insuficiente.";
    return;
  }

  state.pending = {
    type: "payment",
    service,
    amount
  };

  $("paymentMessage").textContent = "";

  $("paymentReview").innerHTML = `
    <h3>Confirmar pago de demostración</h3>
    <p>Servicio: <strong>${escapeHTML(service)}</strong></p>
    <p>Importe: <strong>${money(amount)}</strong></p>
    <button class="primary-btn" id="confirmPayment" type="button">
      Confirmar demo
    </button>
    <button class="secondary-btn" id="cancelPayment" type="button">
      Cancelar
    </button>
  `;

  $("paymentReview").classList.remove("hidden");
});

$("paymentReview").addEventListener("click", (event) => {
  if (event.target.id === "cancelPayment") {
    state.pending = null;
    $("paymentReview").classList.add("hidden");
  }

  if (event.target.id === "confirmPayment") {
    const operation = state.pending;

    if (!operation || operation.type !== "payment") return;

    if (operation.amount > state.balance) {
      $("paymentMessage").textContent = "Saldo insuficiente.";
      $("paymentReview").classList.add("hidden");
      state.pending = null;
      return;
    }

    state.balance -= operation.amount;
    state.expenses += operation.amount;

    addMovement("Pago de " + operation.service, -operation.amount);
    addNotification("Pago demo registrado: " + operation.service);

    state.pending = null;
    $("paymentReview").classList.add("hidden");
    $("paymentForm").reset();
    $("paymentMessage").textContent =
      "Pago simulado completado correctamente.";

    renderBalance();
    renderSummary();
  }
});

// ======================================
// 7. OBJETIVOS DE AHORRO
// ======================================

$("savingForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const name = $("goalName").value.trim();
  const amount = Number($("goalAmount").value);

  if (!name || !Number.isFinite(amount) || amount <= 0) {
    return;
  }

  state.goals.push({
    name,
    target: amount,
    saved: 0
  });

  $("savingForm").reset();
  renderGoals();

  addNotification("Nuevo objetivo de ahorro: " + name);
});

function renderGoals() {
  const container = $("savingGoals");

  if (state.goals.length === 0) {
    container.innerHTML =
      '<p class="notice">Todavía no creaste objetivos de ahorro.</p>';
    return;
  }

  container.innerHTML = state.goals.map((goal, index) => {
    const percentage = Math.min(
      100,
      (goal.saved / goal.target) * 100
    );

    return `
      <div class="goal">
        <h3>${escapeHTML(goal.name)}</h3>
        <p>Objetivo: ${money(goal.target)}</p>
        <p>Ahorrado: ${money(goal.saved)}</p>
        <div class="progress">
          <div style="width:${percentage}%"></div>
        </div>
        <p>${percentage.toFixed(1)}% completado</p>
        <button class="secondary-btn save-money"
          data-index="${index}" type="button">
          Registrar ahorro
        </button>
      </div>
    `;
  }).join("");
}

$("savingGoals").addEventListener("click", (event) => {
  const button = event.target.closest(".save-money");

  if (!button) return;

  const goal = state.goals[Number(button.dataset.index)];
  if (!goal) return;

  const available = Math.max(0, state.balance);
  const remaining = goal.target - goal.saved;

  if (remaining <= 0) {
    alert("¡Ya alcanzaste este objetivo!");
    return;
  }

  const input = prompt(
    "¿Cuánto querés registrar como ahorro? Disponible: " +
    money(available)
  );

  if (input === null || input.trim() === "") return;

  const amount = Number(input);

  if (
    !Number.isFinite(amount) ||
    amount <= 0 ||
    amount > available ||
    amount > remaining
  ) {
    alert("Ingresá un importe válido, dentro del saldo y del objetivo.");
    return;
  }

  state.balance -= amount;
  goal.saved += amount;

  // Transferir al objetivo no se cuenta como gasto de consumo.
  addMovement("Aporte a ahorro: " + goal.name, -amount);
  addNotification("Aporte registrado para " + goal.name);

  renderBalance();
  renderSummary();
  renderGoals();
});

// ======================================
// 8. TITO IA: ASISTENTE DE DEMOSTRACION
// ======================================

function getAssistantReply(question) {
  const q = question.toLowerCase();

  if (q.includes("saldo") || q.includes("dinero tengo")) {
    return "Tu saldo actual de demostración es " +
      money(state.balance) + ".";
  }

  if (
    q.includes("gast") ||
    q.includes("gasto") ||
    q.includes("categor")
  ) {
    return "En esta sesión registraste " + money(state.expenses) +
      " en gastos. Para ver el detalle, abrí la sección " +
      "'Ahorros y gastos'. Esta demo todavía no clasifica " +
      "automáticamente los consumos por categoría.";
  }

  if (
    q.includes("ahorro") ||
    q.includes("ahorrar") ||
    q.includes("organizar")
  ) {
    return "Podés comenzar definiendo un objetivo concreto, " +
      "registrar tus aportes y revisar periódicamente tus gastos. " +
      "Encontrarás tus objetivos en 'Ahorros y gastos'.";
  }

  if (q.includes("transfer")) {
    return "Entrá en Transferencias, completá los datos del " +
      "destinatario, revisá el importe y confirmá la operación " +
      "de demostración. No se envía dinero real.";
  }

  if (q.includes("pago") || q.includes("servicio")) {
    return "En la sección Pagos podés seleccionar un servicio, " +
      "ingresar un importe y confirmar un pago simulado.";
  }

  if (
    q.includes("hola") ||
    q.includes("ayuda")
  ) {
    return "¡Hola! Puedo explicarte cómo consultar tu saldo, " +
      "registrar una transferencia simulada, pagar servicios " +
      "o crear objetivos de ahorro.";
  }

  return "Puedo ayudarte con consultas sobre el saldo de esta demo, " +
    "los gastos registrados, los objetivos de ahorro y el uso " +
    "de los módulos. Todavía no estoy conectado a un modelo " +
    "de inteligencia artificial real.";
}

$("chatForm").addEventListener("submit", (event) => {
  event.preventDefault();

  const input = $("chatInput");
  const question = input.value.trim();

  if (!question) return;

  const messages = $("chatMessages");

  const userMessage = document.createElement("div");
  userMessage.className = "bubble user";
  userMessage.textContent = question;
  messages.appendChild(userMessage);

  const reply = document.createElement("div");
  reply.className = "bubble bot";
  reply.textContent = getAssistantReply(question);
  messages.appendChild(reply);

  input.value = "";
  messages.scrollTop = messages.scrollHeight;
});

// ======================================
// 9. INICIALIZACION
// ======================================

renderAll();
