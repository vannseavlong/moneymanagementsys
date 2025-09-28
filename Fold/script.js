const totalMoneyInput = document.getElementById('totalMoney');
const addItemButton = document.getElementById('addItem');
const spendingList = document.getElementById('spendingList');
const remainingMoneySpan = document.getElementById('remainingMoney');
const sendTelegramButton = document.getElementById('sendTelegram');
const monthInput = document.getElementById('month');
const chatIdInput = document.getElementById('chatId'); // New chat ID input

// Function to add a new spending item row
addItemButton.addEventListener('click', () => {
    const newItem = document.createElement('div');
    newItem.classList.add('spending-item');
    newItem.innerHTML = `
        <input type="text" placeholder="Item" class="item">
        <input type="number" placeholder="Amount (KHR)" class="amount">
    `;
    spendingList.appendChild(newItem);
});

// Function to calculate remaining money
function calculateRemainingMoney() {
    const totalMoney = parseFloat(totalMoneyInput.value) || 0;
    let totalSpending = 0;

    document.querySelectorAll('.amount').forEach(input => {
        totalSpending += parseFloat(input.value) || 0;
    });

    const remainingMoney = totalMoney - totalSpending;
    remainingMoneySpan.textContent = remainingMoney.toFixed(2);
}

// Update remaining money whenever an amount is changed
document.addEventListener('input', calculateRemainingMoney);

// Send data to Telegram
sendTelegramButton.addEventListener('click', () => {
    const totalMoney = totalMoneyInput.value;
    const month = monthInput.value;
    const chatId = chatIdInput.value; // Get the chat ID input value
    let message = `Total Money: ${totalMoney} KHR\n`;

    // Loop through each item and amount
    document.querySelectorAll('.spending-item').forEach(item => {
        const itemName = item.querySelector('.item').value;
        const itemAmount = item.querySelector('.amount').value;
        message += `${itemName}: ${itemAmount} KHR\n`;
    });

    const remainingMoney = remainingMoneySpan.textContent;
    message += `Remaining Money: ${remainingMoney} KHR\n`;
    message += `Month: ${month}\n`;

    sendToTelegram(message, chatId); // Pass the chat ID as a parameter
});

// Function to send data to Telegram using Bot API
function sendToTelegram(message, chatId) {
    const botToken = '7388924117:AAFcht-1MsFTpixlYsKdN5Tce_KX93UNU5M';  // Replace with your bot token
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    const data = {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    }).then(response => response.json())
      .then(data => {
          if (data.ok) {
              alert('Data sent to Telegram successfully!');
          } else {
              alert('Failed to send data to Telegram.');
          }
      })
      .catch(error => {
          console.error('Error:', error);
      });
}
