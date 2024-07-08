require('dotenv').config();
const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const OpenAI = require('openai');
const axios = require('axios');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite'
});

const Conversation = sequelize.define('Conversation', {
  userId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  messages: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      return JSON.parse(this.getDataValue('messages'));
    },
    set(value) {
      this.setDataValue('messages', JSON.stringify(value));
    }
  }
});

sequelize.sync();

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function getChatbotResponse(messages) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: messages,
    functions: [
      {
        name: "get_room_options",
        description: "Get available room options",
        parameters: {
          type: "object",
          properties: {},
          required: []
        }
      },
      {
        name: "book_room",
        description: "Book a room",
        parameters: {
          type: "object",
          properties: {
            roomId: { type: "integer" },
            fullName: { type: "string" },
            email: { type: "string" },
            nights: { type: "integer" }
          },
          required: ["roomId", "fullName", "email", "nights"]
        }
      }
    ],
    function_call: "auto"
  });

  return response.choices[0].message;
}

// Hotel API functions
async function getRoomOptions() {
  try {
    const response = await axios.get('https://bot9assignement.deno.dev/rooms');
    return response.data;
  } catch (error) {
    console.error('Error fetching room options:', error);
    throw error;
  }
}

async function bookRoom(bookingDetails) {
  try {
    const response = await axios.post('https://bot9assignement.deno.dev/book', bookingDetails);

    // Send email to the user
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const mailOptions = {
      from: 'your-email@gmail.com',
      to: bookingDetails.email,
      subject: 'Hotel Booking Confirmation',
      text: `
        Here are the details of your booking:
        Room ID: ${bookingDetails.roomId}
        Room Name: ${response.data.name}
        Full Name: ${bookingDetails.fullName}
        Email: ${bookingDetails.email}
        Nights: ${bookingDetails.nights}
        Total Cost: $${response.data.price * bookingDetails.nights}
      `
    };

    await transporter.sendMail(mailOptions);

    return response.data;
  } catch (error) {
    console.error('Error booking room:', error);
    throw error;
  }
}

// Main chat endpoint
app.post('/chat', async (req, res) => {
  try {
    const { userId, message } = req.body;

    let conversation = await Conversation.findOne({ where: { userId } });
    if (!conversation) {
      conversation = await Conversation.create({ userId, messages: [] });
    }

    const messages = conversation.messages;
    messages.push({ role: 'user', content: message });

    const botResponse = await getChatbotResponse(messages);

    if (botResponse.function_call) {
      const functionName = botResponse.function_call.name;
      const functionArgs = JSON.parse(botResponse.function_call.arguments);

      let functionResult;
      if (functionName === 'get_room_options') {
        functionResult = await getRoomOptions();
      } else if (functionName === 'book_room') {
        functionResult = await bookRoom(functionArgs);
      }

      messages.push(botResponse);
      messages.push({
        role: 'function',
        name: functionName,
        content: JSON.stringify(functionResult)
      });

      const finalResponse = await getChatbotResponse(messages);
      messages.push(finalResponse);
    } else {
      messages.push(botResponse);
    }

    await conversation.update({ messages });

    const responseText = messages[messages.length - 1].content;
    
    res.json({ response: responseText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});