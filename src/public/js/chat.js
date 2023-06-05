const socket = io();

// DOM elements
let username = document.getElementById("username");
let email = document.getElementById("email");
let message = document.getElementById("message");
let btn = document.getElementById("send");
let output = document.getElementById("chat");
let actions = document.getElementById("actions");

btn.addEventListener("click", function () {
  // console.log(username.value, email.value, message.value);
  socket.emit("chat-message", {
    message: message.value,
    username: username.value,
    email: email.value,
  });
});

message.addEventListener("keypress", function () {
  socket.emit("chat-typing", username.value);
});

socket.on("chat-message", function (data) {
  actions.innerHTML = "";
  output.innerHTML += `
    <p>
      <strong>${data.username}</strong>:
      ${data.message}
    </p>
  `;
});

socket.on("chat-typing", function (data) {
  actions.innerHTML = `
        <p><em>${data} is typing...</em></p>
    `;
});
