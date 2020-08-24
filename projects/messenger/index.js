/**
 * the host of the server
 */
const SERVER_HOST = "https://128.52.128.220";
import Client from "https://designftw.mit.edu/assignments/hw9/js/Client.js";

/**
 * 
 * New Storage Data Structures
 * 
 */
let GLOBAL_ALIAS = ""
let UNAVAILABLE_STATE = true
let ALIAS_MAPPING = {} // alias(str) => Alias(obj)
let ALIAS_CONVERSATION_MAPPING = {} // alias(str) => list of conversations [Message(obj)]
let MESSAGES_MAPPING = {} // message.id(str) => Message(obj)
let PARITCIPANT_MAPPING = {};
let UPDATED_CONVERSATION_MAPPING = {};
let UPDATED_ALIAS_MAPPING = {};

function setAliasName(inputAlias) {
  let settingsButton = document.querySelector(".settings-button");
  settingsButton.textContent = inputAlias;
}

function hideContent() {
  let title = document.querySelector(".right-header-title");
  title.textContent = "";

  let conversation = document.querySelector(".right-conversation-viewer");
  conversation.innerHTML = "";

  let submitButton = document.getElementById("message-submit");
  submitButton.classList.add("not-allowed-button");
  submitButton.classList.remove("right-send-button");

  let messageInput = document.getElementById("message-input");
  messageInput.setAttribute("disabled", "");
  messageInput.value = "";
  messageInput.classList.add("message-input-disabled");

  let subjectInput = document.getElementById("subject-input");
  subjectInput.setAttribute("disabled", "");
  subjectInput.value = "";
  subjectInput.classList.add("subject-input-disabled");

  UNAVAILABLE_STATE = true;
}

function resetContent() {
  let title = document.querySelector(".right-header-title");
  title.classList.remove("isHidden");

  let submitButton = document.getElementById("message-submit");
  submitButton.classList.remove("not-allowed-button");
  submitButton.classList.add("right-send-button");

  let messageInput = document.getElementById("message-input");
  messageInput.removeAttribute("disabled");
  messageInput.classList.remove("message-input-disabled");

  let subjectInput = document.getElementById("subject-input");
  subjectInput.removeAttribute("disabled");
  subjectInput.classList.remove("subject-input-disabled");

  UNAVAILABLE_STATE = false;
}

function loadConversationsToLeftRail() {

  if (document.querySelector(".dropdown-row-item-selected") == null) {
    let currentRowItem = Array.from(document.querySelectorAll(".dropdown-row-item")).find((item) => item.textContent == GLOBAL_ALIAS);
    currentRowItem.classList.add("dropdown-row-item-selected");
  }

  let conversationList = document.querySelector(".left-container");
  conversationList.innerHTML = "";

  let conversationsForThisAlias = Object.entries(UPDATED_CONVERSATION_MAPPING[GLOBAL_ALIAS]);
  let tempDataObjects = conversationsForThisAlias.map((item) => {
    let conversationParticipants = filterOutAlias(PARITCIPANT_MAPPING[item[0]], GLOBAL_ALIAS).toString();
    let messages = item[1];
    messages.sort((a, b) => {
      if (a.createdAt > b.createdAt) {
        return 1;
      } else if (a.createdAt == b.createdAt) {
        return 0;
      } else {
        return -1;
      }
    });
    let mostRecentMessage = messages[messages.length-1];
    let sentDate = getDateString(mostRecentMessage.createdAt);
    let sentTime = getTimeString(mostRecentMessage.createdAt);
    return [conversationParticipants, mostRecentMessage, sentDate, sentTime, conversationList, messages];
  });

  tempDataObjects.sort((a, b) => {
    let aTime = a[1].createdAt;
    let bTime = b[1].createdAt;
    if (aTime > bTime) {
      return -1;
    } else if (aTime < bTime) {
      return 1;
    }
    return 0;
  }).map((item) => {
    createLeftRailMessageObject(item[0], item[1], item[2], item[3], item[4], item[5]);
  });

  document.querySelector(".left-container").firstChild.click();
}

function createLeftRailMessageObject(participants, recentMessage, dateString, timeString, parentElement, allMessages) {
  let dateTimeString = dateString + " at " + timeString;
  let conversationItem = insertChild(parentElement, "div", "conversation-item");
  conversationItem.setAttribute("data-created-at", recentMessage.createdAt);
  conversationItem.setAttribute("data-message-id", recentMessage.id);

  let conversationTopRow = insertChild(conversationItem, "div", "conversation-item-top-row");
  insertChild(conversationTopRow, "h4", "conversation-name", participants);
  insertChild(conversationTopRow, "div", "conversation-time", dateTimeString);
  insertChild(conversationItem, "div", "conversation-recent-message", parsePayload(recentMessage.payload).text);

  conversationItem.addEventListener("click", () => {
    let selectedDiv = document.querySelector(".conversation-item-selected");
    if (selectedDiv != null) {
      selectedDiv.classList.remove("conversation-item-selected");
    }
    conversationItem.classList.add("conversation-item-selected");
    updateRightMessageViewport(allMessages, participants, );

    if (UNAVAILABLE_STATE == true) {
      resetContent();
    }
  });

  return conversationItem;
}

function updateRightMessageViewport(allMessages, participants) {
  let sendButton = document.getElementById("message-submit");
  sendButton.classList.add("isDisabled");
  //1. Update Conversation Title 
  let conversationTitle = document.querySelector(".right-header-title");
  conversationTitle.textContent = participants.toString();
  
  //2. Load Messages
  let viewport = document.querySelector(".right-conversation-viewer");
  viewport.innerHTML = "";
  allMessages.map((message) => {
    let classSelectorModifier = message.sender.name == GLOBAL_ALIAS ? "-sent" : "-received";
    let messageSender = message.sender.name;
    let messageSentTime = getTimeString(new Date(message.createdAt));
    let messageSentDate = getDateString(new Date(message.createdAt));
    let topText = messageSender + " said at " + messageSentTime + " on " + messageSentDate;
    let messagePayloadSubject = parsePayload(message.payload).subject;
    let messagePayloadText = parsePayload(message.payload).text;

    let messageItem = insertChild(viewport, "div", "message-item" + classSelectorModifier);
    messageItem.setAttribute("data-message-id", message.id);
    insertChild(messageItem, "div", "message-top-row" + classSelectorModifier, topText);

    let messageContentDiv = insertChild(messageItem, "div", "message-content" + classSelectorModifier);
    insertChild(messageContentDiv, "b", null, messagePayloadSubject);
    insertChild(messageContentDiv, "div", null, messagePayloadText);
  });
  
  //3. Set scroll position to bottom
  viewport.scrollTop = viewport.scrollHeight;
}

function addAliasDropdownMenu() {
  const parent = document.querySelector(".dropdown-items");

  Object.entries(ALIAS_MAPPING).map((item) => {
    let dropdownRowItem = insertChild(parent, "a", "dropdown-row-item", item[0]);
    dropdownRowItem.setAttribute("value", item[0]);

    dropdownRowItem.addEventListener("click", (event) => {
      let selectedItem = document.querySelector(".dropdown-row-item-selected");
      if (selectedItem != dropdownRowItem) {
        if (selectedItem != null) {
          selectedItem.classList.remove("dropdown-row-item-selected");
        }
        dropdownRowItem.classList.add("dropdown-row-item-selected");
        GLOBAL_ALIAS = event.target.textContent;
        setAliasName(GLOBAL_ALIAS);
        loadConversationsToLeftRail();
      }
    });
  });
}

function addButtonEventListeners(client) {

  let handleSendMessage = function() {
    let messageText = document.getElementById("message-input").value.trim();
    let subjectText = document.getElementById("subject-input").value.trim();
    if (messageText.length == 0) {
      console.log("Cannot send empty message");
      UNAVAILABLE_STATE = true;
    }

    if (UNAVAILABLE_STATE == false) {
      // 1. Get recipients
      let recipients = document.querySelector(".right-header-title").innerHTML.split(",");
      let messagePayload = JSON.stringify({ "text": messageText, "subject": subjectText });

      client.api.messages.sendMessage(GLOBAL_ALIAS, recipients, messagePayload).then((result) => {
        insertMessage(result);
        loadConversationsToLeftRail();
      });

      // Update text and subject bar
      document.getElementById("message-input").value = "";
      document.getElementById("subject-input").value = "";
    };
  };

  const sendButton = document.getElementById("message-submit");
  sendButton.addEventListener("click", handleSendMessage);

  let subjectBar = document.getElementById("subject-input");
  let textBar = document.getElementById("message-input");
  textBar.addEventListener("input", (event) => {
    if (event.target.value.trim().length == 0) {
      sendButton.classList.add("isDisabled");
      sendButton.removeEventListener("click", handleSendMessage);
    } else if (event.target.value.trim().length == 1) {
      sendButton.classList.remove("isDisabled");
      sendButton.addEventListener("click", handleSendMessage);
    }
  });
}

function handleCreateNewMessage(client) {
  const createNewMessageButton = document.getElementById("create-new-message-button");
  const createNewMessageDialog = document.getElementById("newMessageDialog");
  const createNewMessageForm = document.getElementById("newMessageForm");
  const cancelNewMessageButtom = createNewMessageForm.querySelector('[type="reset"]');

  createNewMessageButton.addEventListener("click", () => {
    createNewMessageDialog.showModal();
  });

  cancelNewMessageButtom.addEventListener("click", () => {
    createNewMessageDialog.close();
  });

  createNewMessageForm.addEventListener("submit", () => {
    let ownAlias = GLOBAL_ALIAS;
    let recipients = createNewMessageForm.elements["alias"].value.split(",");
    let newMessageText = JSON.stringify({ text: createNewMessageForm.elements["new-message"].value });

    // send message
    client.api.messages.sendMessage(ownAlias, recipients, newMessageText).then((result) => {
      insertMessage(result);
      loadConversationsToLeftRail();
    }).catch((err) => {
      console.log("ERROR:\t", err);
    });

  });
}

/**
 * Called when the client logs in. Passes in the client and currently logged in account.
 * @param {Client} client an instance of Client
 * @param {Account} account the currently logged in account
 */
async function onAccountLoggedIn(client, account) {
  // just to get you started, get all the aliases owned by the account
  window._client = client;
  let aliasList = await client.getAliasesForAccount().then((result) => {
    result.map((aliasObject) => {
      ALIAS_MAPPING[aliasObject.name] = aliasObject;
    })
    return result;
  });
  GLOBAL_ALIAS = aliasList[0].name;

  client.addEventListener("onNewMessage", (result) => {
    let sender = result.detail.aliasName;
    let messageID = result.detail.messageId;

    client.getMessageById(sender, messageID).then((messageObj) => {
      insertMessage(messageObj);
      loadConversationsToLeftRail();
    })
  });
  getAllMessages(client);
  addAliasDropdownMenu();
  addButtonEventListeners(client);
  handleCreateNewMessage(client);
  hideContent();
}

/**
 * Fetch all messages for all alias provided on the account
 * 
 * @param {Client} client 
 */
async function getAllMessages(client) {
  console.log("STARTED FETCHING ALL MESSAGES");
  let aliasList = Object.keys(ALIAS_MAPPING);
  for (let i = 0; i < aliasList.length; i++) {
    let alias = aliasList[i];
    UPDATED_ALIAS_MAPPING[alias] = {};
    await client.getMessagesForAlias(alias).then((allMessages) => {
      let groupedMessages = client.groupMessagesByUniqueRecipients(allMessages);
      ALIAS_CONVERSATION_MAPPING[alias] = groupedMessages;
      allMessages.map((item) => {
        insertMessage(item);
      });
    });
  }

  GLOBAL_ALIAS = aliasList[0];

  document.getElementById("rightContainer").classList.remove("isHidden");
  document.getElementById("create-new-message-button").classList.remove("isHidden");
  UNAVAILABLE_STATE = true;
  console.log("FINISHED FETCHING ALL MESSAGES");
  loadConversationsToLeftRail();
  setAliasName(GLOBAL_ALIAS);
}

/**
 * Called when the document is loaded. Creates a Client and adds auth flow
 * event handling.
 */
async function initializeClientAndAuthUI() {
  let client = new Client(SERVER_HOST);
  addSignupFormHandlers(client);
  addLoginFormHandlers(client);
  addLogoutFormHandlers(client);

  // update ui to reflect if the client is logged in
  const loginResult = await client.isLoggedIn();
  toggleLoginUI(loginResult.isLoggedIn);

  // if client is logged in call account loaded
  if (loginResult.isLoggedIn) {
    onAccountLoggedIn(client, loginResult.account);
  }
  // listen for client login and logout events
  client.addEventListener("login", (e) => {
    onAccountLoggedIn(client, e.detail);
    toggleLoginUI(true);
  });
  client.addEventListener("logout", (e) => {
    removeLoggedInContent();
    toggleLoginUI(false);
    setAliasName("Settings");
  });
}

// when the DOM is loaded run the initialize code since initialize code
// accesses UI
if (document.readyState == "loading") {
  // DOM not ready so wait for an event to fire
  document.addEventListener("DOMContentLoaded", initializeClientAndAuthUI, {
    once: true,
  });
} else {
  // DOM is ready!
  initializeClientAndAuthUI();
}

/**
 *  -------------------- The code below is for auth --------------------
 */

/**
 * Show and hide the log in ui based on if the user is logged in.
 * @param {boolean} isLoggedIn true if the user is currently logged in
 */
function toggleLoginUI(isLoggedIn) {
  const logoutButton = document.querySelector("#logoutButton");
  const loginButton = document.querySelector("#loginButton");
  const signupButton = document.querySelector("#signUpButton");

  if (isLoggedIn) {
    // hide login ui
    loginButton.classList.add("isHidden");
    signupButton.classList.add("isHidden");
    // show logout ui
    logoutButton.classList.remove("isHidden");
  } else {
    // show login ui
    loginButton.classList.remove("isHidden");
    signupButton.classList.remove("isHidden");
    // hide logout ui
    logoutButton.classList.add("isHidden");
  }
}

/**
 * Create a handler for the logout button
 * @param {Client} client the chat client for the application
 */
function addLogoutFormHandlers(client) {
  const logoutButton = document.querySelector("#logoutButton");
  if (logoutButton !== null) {
    logoutButton.addEventListener("click", () => {
      client.logout();
      // TODO(lukemurray): handle logout failure
      initializeAllDataStructures();
    });
  }
}

/**
 * Create a handler for the login form
 * @param {Client} client the chat client for the application
 */
function addLoginFormHandlers(client) {
  const loginButton = document.querySelector("#loginButton");
  const loginDialog = document.querySelector("#loginDialog");
  const loginForm = document.querySelector("#loginForm");
  const cancelLoginButton = loginForm.querySelector('[type="reset"]');
  // show the login dialog when the user clicks the login button
  loginButton.addEventListener("click", () => {
    loginDialog.showModal();
  });
  // hide the login dialog when the user cancels the login
  cancelLoginButton.addEventListener("click", () => {
    loginDialog.close();
  });
  // try to login when the user submits the login form
  loginForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const email = loginForm.elements["email"].value;
    const password = loginForm.elements["password"].value;
    // login
    client
      .login(email, password)
      .then(() => {
        loginForm.querySelector(".error").innerHTML = "";
        loginDialog.close();
      })
      .catch((err) => {
        // if there is an error display the error in the form
        loginForm.querySelector(".error").innerHTML = err.message;
      });
  });
}

/**
 * Create a handler for the signup form
 * @param {Client} client the chat client for the application
 */
function addSignupFormHandlers(client) {
  const signupButton = document.querySelector("#signUpButton");
  const signupDialog = document.querySelector("#signUpDialog");
  const signupForm = document.querySelector("#signUpForm");
  const cancelSignupButton = signupForm.querySelector('[type="reset"]');
  // show the signup dialog when the user clicks the signup button
  signupButton.addEventListener("click", () => {
    signupDialog.showModal();
  });
  // hide the signup dialog when the user cancels the signup
  cancelSignupButton.addEventListener("click", () => {
    signupDialog.close();
  });
  // try to signup when the user submits the signup form
  signupForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const alias = signupForm.elements["alias"].value;
    const email = signupForm.elements["email"].value;
    const password = signupForm.elements["password"].value;
    // signup
    client
      .signup(alias, email, password)
      .then(() => {
        signupForm.querySelector(".error").innerHTML = "";
        signupDialog.close();
      })
      .catch((err) => {
        // if there is an error display the error in the form
        signupForm.getElementsByClassName("error").innerHTML = err.message;
      });
  });
}

function removeLoggedInContent() {
  let aliasItems = document.querySelector(".dropdown-items");
  aliasItems.innerHTML = "";

  let leftConversations = document.querySelector(".left-container");
  leftConversations.innerHTML = "";

  hideContent();
}


/**
 *  -------------------- The code below is helper functions --------------------
 */

function getTimeString(inputDateObject) {
  let timeStamp = "am"
  let messageHour = inputDateObject.getHours();
  if (messageHour >= 12) {
    messageHour -= 12;
    timeStamp = "pm";
  }
  if (messageHour == 0) {
    messageHour = 12;
  }
  let messageMinutes = inputDateObject.getMinutes();
  if (messageMinutes < 10) {
    messageMinutes = "0" + messageMinutes.toString();
  }
  let outputString = messageHour + ":" + messageMinutes + " " + timeStamp;
  return outputString;
}

function getDateString(inputDateObject) {
  let months = {
    0: ["January", "Jan."],
    1: ["February", "Feb."],
    2: ["March", "Mar."],
    3: ["April", "Apr."],
    4: ["May", "May"],
    5: ["June", "Jun."],
    6: ["July", "Jul."],
    7: ["August", "Aug."],
    8: ["September", "Sept."],
    9: ["October", "Oct."],
    10: ["November", "Nov."],
    11: ["December", "Dec."]
  };
  let month = months[inputDateObject.getMonth()][0];
  let date = inputDateObject.getDate();
  return month + " " + date;
}

function insertChild(parent, elementType, className, inputText = null, idValue = null) {
  let newChild = document.createElement(elementType);
  if (className != null) {
    newChild.setAttribute("class", className);
  }
  if (inputText != null) {
    newChild.textContent = inputText;
  }
  if (idValue != null) {
    newChild.setAttribute("id", idValue);
  }
  parent.appendChild(newChild);
  return newChild;
}

function filterOutAlias(conversationName, alias) {
  let listOfNames = [];
  if (typeof conversationName == "string") {
    listOfNames = conversationName.split(",");
  } else {
    listOfNames = conversationName
  }

  let filtedNames = listOfNames.filter((item) => item != alias);
  if (filtedNames.length == 0 && listOfNames.indexOf(alias) != -1) {
    return [alias];
  } else {
    return filtedNames;
  }
}

function parsePayload(inputPayload) {
  return (inputPayload.indexOf("{") == -1) ?
    { "text": inputPayload } :
    JSON.parse(inputPayload);
}

function sortArray(arrA) {
  arrA.sort((a, b) => {
    if (a > b) {
      return 1;
    } else if (a == b) {
      return 0;
    } else {
      return -1;
    }
  });
  return arrA;
}

function insertMessage(inputMessageObject) {

  if (MESSAGES_MAPPING[inputMessageObject.id] == undefined) {
    MESSAGES_MAPPING[inputMessageObject.id] = inputMessageObject;
    let allParticipantsList = sortArray(inputMessageObject.recipients.map(
      (item) => { return item.name }).concat([inputMessageObject.sender.name])
    );

    let allParticipantsKey = allParticipantsList.toString();
    PARITCIPANT_MAPPING[allParticipantsKey] = allParticipantsList;

    let aliasList = Object.keys(ALIAS_MAPPING);
    let ALIAS_THIS_MESSAGE_CORRESPONDS_TO = aliasList.filter(x => allParticipantsList.includes(x));

    ALIAS_THIS_MESSAGE_CORRESPONDS_TO.map((alias) => {

      if (UPDATED_CONVERSATION_MAPPING[alias] == undefined) {
        UPDATED_CONVERSATION_MAPPING[alias] = {};
      }

      if (UPDATED_CONVERSATION_MAPPING[alias][allParticipantsKey] == undefined) {
        UPDATED_CONVERSATION_MAPPING[alias][allParticipantsKey] = [inputMessageObject];
      } else {
        let messagesForThisConversation = UPDATED_CONVERSATION_MAPPING[alias][allParticipantsKey];
        messagesForThisConversation.push(inputMessageObject);
        UPDATED_CONVERSATION_MAPPING[alias][allParticipantsKey] = messagesForThisConversation;
      }
    });
  }
}


function initializeAllDataStructures() {
  GLOBAL_ALIAS = ""
  UNAVAILABLE_STATE = true
  ALIAS_MAPPING = {} // alias(str) => Alias(obj)
  ALIAS_CONVERSATION_MAPPING = {} // alias(str) => list of conversations [Message(obj)]
  MESSAGES_MAPPING = {} // message.id(str) => Message(obj)
  PARITCIPANT_MAPPING = {};
  UPDATED_CONVERSATION_MAPPING = {};
  UPDATED_ALIAS_MAPPING = {};
}